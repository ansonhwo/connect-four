/**********************/
// Redux
/**********************/
const reducer = (state, action) => {
  switch (action.type) {
    case 'START': {
      const nextState = Object.assign({}, state)

      nextState.start = true
      board.state = nextState
      return nextState
    }
    case 'DRAW': {
      const nextState = Object.assign({}, state)

      nextState.draw = true
      nextState.start = false
      nextState.turns = ++state.turns
      board.state = nextState
      return nextState
    }
    case 'NEXTPLAYER': {
      const nextState = Object.assign({}, state)

      if (state.invalidMove) return state

      if (state.player > 1) nextState.player = 1
      else nextState.player = ++state.player

      board.state = nextState
      return nextState
    }
    case 'WIN': {
      const nextState = Object.assign({}, state)

      nextState.win = true
      nextState.start = false
      board.state = nextState
      return nextState
    }
    case 'CLEAR': {
      const nextState = Object.assign({}, {
        board: [
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null]
        ],
        win: false,
        draw: false,
        start: false,
        done: false,
        player: Math.floor(Math.random() * (11 - 1)) + 1 <= 5 ? 1 : 2,
        moves: [],
        invalidMove: false,
        turns: 1
      })

      board.state = nextState
      return nextState
    }
    case 'ADDPIECE': {
      const nextState = Object.assign({}, state)
      const col = parseInt(action.col)

      // Get the top-most index of an existing piece in the current column
      const row = state.board[col].reduce((min, piece, index) => {
        if (piece && index < min) return index
        else return min
      }, 6)

      // If the current column is full, move is invalid
      if (row === 0) {
        nextState.invalidMove = true
        board.state = nextState
        return nextState
      }
      // Add piece to the top of the most recent piece, and track the move
      else if (row > 0 && row <= 5) {
        nextState.board[col][row-1] = state.player
        nextState.moves.push( [col, row-1] )
      }
      // Column is empty, so add piece to the very bottom, and track the move
      else {
        nextState.board[col][5] = state.player
        nextState.moves.push( [col, 5] )
      }

      // Move was valid
      nextState.invalidMove = false
      nextState.turns = ++state.turns

      board.state = nextState
      return nextState
    }
    default:
      return state
  }
}

const initialState = {
  board: [
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null]
  ],
  win: false,
  draw: false,
  start: false,
  player: Math.floor(Math.random() * (11 - 1)) + 1 <= 5 ? 1 : 2,
  moves: [],
  invalidMove: false,
  turns: 1
}

const store = Redux.createStore(reducer, initialState)

const draw = () => {
  const state = store.getState()

  // If a move history exists, add DOM piece indicator
  if (state.moves.length > 0) {
    const board = state.board
    const cols = document.querySelectorAll('#board a.column')
    const [ c, r ] = state.moves[state.moves.length - 1]

    // Update DOM with the appropriate player piece color
    cols[c].children[r].classList.remove('none')
    if (board[c][r] === 1) cols[c].children[r].classList.add('red')
    else if (board[c][r] === 2) cols[c].children[r].classList.add('blue')
  }
}

// Determine if there is a winner after placing a game piece
function winner() {
  const state = store.getState()
  // Make sure that the move was valid
  if (state.invalidMove) return false

  // Turn 8 is the earliest possible winnable turn
  if (state.turns >= 8) {
    const grid = state.board
    const moves = state.moves
    const dir = [ [0, -1], [1, -1], [1, 0], [1, 1],
                  [0, 1], [-1, 1], [-1, 0], [-1, -1] ]

    // Loop through the move history starting from most recent
    for (let i = moves.length - 1; i >= 0; i--) {
      // Check all of the possible directions on the board
      for (let j = 0; j < dir.length; j++) {
        if (checkAdjacent(grid, moves[i][0], moves[i][1], dir[j])) {
          return true
        }
      }
    }
  }

  // If no one has won by now, the game is a draw
  if (state.turns === 43) {
    store.dispatch( { type: 'DRAW' } )
  }

  return false
}

// Get values from adjacent spots
function checkAdjacent(grid, c, r, [ x, y ]) {
  // Out of bounds check
  if (c + x < 0 || c + x > 6 || c + 2 * x < 0 || c + 2 * x > 6 ||
      c + 3 * x < 0 || c + 3 * x > 6 || r + y < 0 || r + y > 5 ||
      r + 2 * y < 0 || r + 2 * y > 5 || r + 3 * y < 0 || r + 3 * y > 5) {

    return false
  }
  // Winning game condition (4-in-a-row)
  else if (grid[c][r] === grid[c+x][r+y] &&
           grid[c][r] === grid[c+2*x][r+2*y] &&
           grid[c][r] === grid[c+3*x][r+3*y]) {

    return true
  }
  else return false
}

store.subscribe(draw)

/*********************/
// VueJS
/*********************/
const board = new Vue({
  el: '#board',
  data: {
    state: store.getState(),
    red: false,
    blue: false
  },
  methods: {
    // Player clicks the Start Game button
    startGame: function() {
      if (this.state.win) {
        store.dispatch( { type: 'CLEAR' } )
        this.clearIndicators()
      }
      this.changeColor()
      store.dispatch( { type: 'START' } )
    },
    // Player clicks on a board column
    addPiece: function(event) {
      if (this.state.start) {
        store.dispatch( { type: 'ADDPIECE', col: event.target.dataset.col } )
        if (winner()) {
          store.dispatch( { type: 'WIN' } )
        }
        else {
          store.dispatch( { type: 'NEXTPLAYER' } )
          this.changeColor()
        }
      }
    },
    // Update the current player display
    changeColor: function() {
      if (this.state.player === 1) {
        this.red = true
        this.blue = false
      }
      else {
        this.red = false
        this.blue = true
      }
    },
    // Clear all existing DOM piece indicators on the board
    clearIndicators: function() {
      const cols = document.querySelectorAll('#board a.column')

      for (let i = 0; i < cols.length; i++) {
        for (let j = 0; j < cols[i].children.length; j++) {
          let element = cols[i].children[j]
          if (element.classList.contains('red') || element.classList.contains('blue')) {
            element.classList.remove('red')
            element.classList.remove('blue')
            element.classList.add('none')
          }
        }
      }
    }
  }
})
