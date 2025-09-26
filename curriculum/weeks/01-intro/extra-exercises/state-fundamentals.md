# Programming Fundamentals Exercises - TicTacToe Series

## Exercise 0 & 1: Concepts/Systems + Data/State
**Goal**: Build a complete TicTacToe game engine that manages state and game logic

### Part A: English & Pseudocode (Concepts/Systems)

Students write out TicTacToe rules and logic in plain English, then convert to pseudocode:

```
English Description Exercise:
1. Describe what TicTacToe is to someone who has never played
2. List all the rules of the game
3. Describe what it means to "win" 
4. Describe what it means for the game to be "over"
5. List all the actions a player can take

Pseudocode Exercise:
1. Define what information you need to track
2. Write step-by-step logic for "making a move"
3. Write step-by-step logic for "checking if someone won"
4. Write step-by-step logic for "checking if game is over"
```

### Part B: TypeScript Implementation (Data/State)

Students implement their pseudocode in TypeScript with specific requirements:

```typescript
// tictactoe.ts

// Required Types (students must figure out the implementation)
type Player = // ?
type CellValue = // ?
type Board = // ?
type GameStatus = // ?

interface GameState {
  board: Board;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
}

// Core functions students must implement:
export function initializeGame(): GameState {
  // Return initial game state
}

export function makeMove(game: GameState, row: number, col: number): GameState {
  // Return new game state after move (or same state if invalid)
}

export function checkWinner(game: GameState): Player | null {
  // Return winner or null
}

export function isGameOver(game: GameState): boolean {
  // Return true if game is finished
}

export function isValidMove(game: GameState, row: number, col: number): boolean {
  // Return true if move is valid
}
```

**Key Learning Check**: Students must demonstrate their functions work by writing simple test cases:
```typescript
// Test cases they must make pass
let game = initializeGame();
console.log(game.currentPlayer); // should be 'X'
console.log(game.board); // should be empty 3x3 grid

game = makeMove(game, 0, 0);
console.log(game.currentPlayer); // should be 'O'
console.log(game.board[0][0]); // should be 'X'
// etc.
```

---

## Exercise 2: The Reactive Model
**Goal**: Build a React frontend that renders any valid TicTacToe state

### Setup
Students take their working TicTacToe engine from Exercise 1 and build a React app around it.

### Part A: State-Driven UI

```typescript
// Students must create a component that renders ANY valid game state
function TicTacToeGame() {
  const [gameState, setGameState] = useState(initializeGame());
  
  // Challenge: How do we re-render when state changes?
  
  return (
    <div>
      {/* Render the board based on gameState.board */}
      {/* Show gameState.currentPlayer */}
      {/* Show gameState.status */}
      {/* Show gameState.winner if game is over */}
    </div>
  );
}
```

### Part B: User Interaction

```typescript
function TicTacToeGame() {
  const [gameState, setGameState] = useState(initializeGame());
  
  const handleCellClick = (row: number, col: number) => {
    // Challenge: How do we make a move?
    // Challenge: How do we update our React state?
    // Challenge: How do we handle invalid moves?
    const newGameState = makeMove(gameState, row, col);
    // What do we do with newGameState?
  };
  
  const handleReset = () => {
    // Challenge: How do we reset the game?
  };
  
  return (
    <div>
      <Board onCellClick={handleCellClick} board={gameState.board} />
      <GameStatus 
        status={gameState.status} 
        currentPlayer={gameState.currentPlayer}
        winner={gameState.winner} 
      />
      <button onClick={handleReset}>Reset Game</button>
    </div>
  );
}
```

**Key Learning Check**: Students must demonstrate:
1. Game renders correctly for any state
2. Clicking cells makes valid moves
3. UI updates immediately after each move
4. Game shows winner/draw states
5. Reset button works

### Part C: State Visualization Exercise

Students create a "State Inspector" component that shows the raw game state:
```typescript
function StateInspector({ gameState }: { gameState: GameState }) {
  return (
    <div>
      <h3>Current Game State:</h3>
      <pre>{JSON.stringify(gameState, null, 2)}</pre>
    </div>
  );
}
```

This helps them understand that the UI is just a "view" of the underlying state.

---

## Exercise 3: HTTP/Networking/Client-Server Model
**Goal**: Move the game engine to a server and build a client that communicates via HTTP

### Part A: Server Setup

Students create an Express server that manages the game state:

```typescript
// server.ts
import express from 'express';
import { initializeGame, makeMove, GameState } from './tictactoe';

class GameServer {
  private games: Map<string, GameState> = new Map();
  
  createGame(): string {
    const gameId = Math.random().toString(36);
    this.games.set(gameId, initializeGame());
    return gameId;
  }
  
  getGame(gameId: string): GameState | null {
    return this.games.get(gameId) || null;
  }
  
  updateGame(gameId: string, newState: GameState): void {
    this.games.set(gameId, newState);
  }
}

const server = new GameServer();
const app = express();

// Students must implement these endpoints:
app.post('/games', (req, res) => {
  // Create new game, return game ID and initial state
});

app.get('/games/:id', (req, res) => {
  // Return current game state
});

app.post('/games/:id/moves', (req, res) => {
  // Make a move, return new game state
  // Body: { row: number, col: number }
});

app.post('/games/:id/reset', (req, res) => {
  // Reset game, return new game state
});
```

### Part B: Client Refactor

Students modify their React app to communicate with the server instead of using local state:

```typescript
function TicTacToeGame() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState(/* ? */);
  const [loading, setLoading] = useState(false);
  
  const createNewGame = async () => {
    // Challenge: Make HTTP request to create game
    // Challenge: Store game ID and initial state
  };
  
  const makeMove = async (row: number, col: number) => {
    // Challenge: Make HTTP request to server
    // Challenge: Handle loading states
    // Challenge: Update local state with server response
    // Challenge: Handle errors (invalid moves, network issues)
  };
  
  const resetGame = async () => {
    // Challenge: Make HTTP request to reset
  };
  
  // Challenge: How do we load game state when component mounts?
  // Challenge: How do we handle network errors?
  
  return (
    <div>
      {gameId ? (
        <GameBoard 
          gameState={gameState}
          onMove={makeMove}
          onReset={resetGame}
          loading={loading}
        />
      ) : (
        <button onClick={createNewGame}>Start New Game</button>
      )}
    </div>
  );
}
```

### Part C: Multi-Player Support (Advanced)

```typescript
// Students extend server to support multiple players per game
app.post('/games/:id/join', (req, res) => {
  // Join existing game as second player
});

// Students extend client to:
// 1. Join games by ID
// 2. Handle "waiting for other player" states
// 3. Poll for updates when it's not their turn
// 4. Show which player they are (X or O)
```

---

## Assessment Rubric

### Exercise 0-1: Concepts/Systems + Data/State
- [ ] Can explain TicTacToe rules in English
- [ ] Pseudocode covers all game logic
- [ ] TypeScript implementation compiles
- [ ] All required methods work correctly
- [ ] Game engine handles edge cases (invalid moves, game over states)
- [ ] Test cases pass

### Exercise 2: Reactive Model
- [ ] UI renders correctly for any game state
- [ ] User interactions work (clicking, resetting)
- [ ] State changes trigger re-renders
- [ ] No direct DOM manipulation (everything through React state)
- [ ] State inspector shows current state correctly

### Exercise 3: Client-Server Model
- [ ] Server runs and responds to HTTP requests
- [ ] Client can create games and make moves via HTTP
- [ ] Error handling for network issues
- [ ] Loading states work correctly
- [ ] Same game functionality as local version
- [ ] (Advanced) Multiple players can join same game

---

## Common Debugging Exercises

### "My state isn't updating" Debug Session
Students get a broken React component where clicking doesn't update the UI. They must:
1. Check if state is actually changing (console.log)
2. Check if they're mutating state directly
3. Check if they're calling the state setter
4. Understand immutability in React

### "My server isn't working" Debug Session
Students get common server issues to diagnose:
1. CORS errors
2. JSON parsing issues
3. Route not found (404s)
4. Server crashes on invalid input

### "State Synchronization" Debug Session
Students get a client that gets "out of sync" with server state. They must:
1. Understand when to fetch fresh data
2. Handle optimistic vs. server-confirmed updates
3. Deal with network failures