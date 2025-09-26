# Programming Fundamentals Exercises - TicTacToe Series

## Purpose

This document provides one possible exercise designed to guide you through the four fundamental programming concepts that we are teaching this week. Each exercise builds progressively on the previous one, moving from basic concepts to distributed systems.

### The Four Fundamental Pillars

1. **Concepts/Systems** - Understanding how to describe and model real-world systems (like games) in terms of rules, logic, and behavior. We start with English descriptions and pseudocode before moving to actual implementation.

2. **Data/State** - Learning how to represent the "state" of a system that changes over time, and how to build programs that manipulate and maintain this state accurately. This is the foundation of all programming.

3. **The Reactive Model** - Understanding how to build user interfaces that automatically update when state changes. You describe your UI in terms of state, and the framework handles the rest.

4. **HTTP/Networking/Client-Server Model** - Learning how to build distributed systems where state and logic can exist on remote servers, and clients can interact with that state over networks.

## How to Use This Document

**Self-Assessment and Flexibility**: You should feel free to skip sections where you already feel confident and jump directly to the section that challenges you. Each exercise has clear learning objectives and success criteria, so you can quickly assess whether you need the practice.

**Find Your Edge**: The goal is to work at the edge of your current understanding. If an exercise feels too easy, move to the next one. If it feels overwhelming, consider going back to review the previous concepts.

**Reusable Foundation**: Your TicTacToe implementation from early exercises becomes the foundation for later ones, so you'll see how the same core logic can be used in different contexts (local, React UI, networked).

## Exercise 0 & 1: Concepts/Systems + Data/State
**Goal**: Build a complete TicTacToe game engine that manages state and game logic

### Part A: English & Pseudocode (Concepts/Systems)

Write out TicTacToe rules and logic in plain English, then convert to pseudocode:

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

Implement your pseudocode in TypeScript with specific requirements:

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

**Key Learning Check**: You must demonstrate your functions work by writing simple test cases:
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
Take your working TicTacToe implementation from Exercise 1 and build a React app around it.

### Part A: State-Driven UI

```typescript
// Create a component that renders ANY valid game state
function TicTacToeGame() {
  const [gameState, setGameState] = useState(initializeGame());
  
  // Challenge: How do you re-render when state changes?
  
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
    // Challenge: How do you make a move?
    // Challenge: How do you update your React state?
    // Challenge: How do you handle invalid moves?
    const newGameState = makeMove(gameState, row, col);
    // What do you do with newGameState?
  };
  
  const handleReset = () => {
    // Challenge: How do you reset the game?
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

**Key Learning Check**: You must demonstrate:
1. Game renders correctly for any state
2. Clicking cells makes valid moves
3. UI updates immediately after each move
4. Game shows winner/draw states
5. Reset button works

### Part C: State Visualization Exercise

Create a "State Inspector" component that shows the raw game state:
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

This helps you understand that the UI is just a "view" of the underlying state.

---

## Exercise 3: HTTP/Networking/Client-Server Model
**Goal**: Move the game engine to a server and build a client that communicates via HTTP

### Part A: Server Setup

Create an Express server that manages the game state:

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

// You must implement these endpoints:
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

Modify your React app to communicate with the server instead of using local state:

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
  
  // Challenge: How do you load game state when component mounts?
  // Challenge: How do you handle network errors?
  
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
// Extend your server to support multiple players per game
app.post('/games/:id/join', (req, res) => {
  // Join existing game as second player
});

// Extend your client to:
// 1. Join games by ID
// 2. Handle "waiting for other player" states
// 3. Poll for updates when it's not your turn
// 4. Show which player you are (X or O)
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
You get a broken React component where clicking doesn't update the UI. You must:
1. Check if state is actually changing (console.log)
2. Check if you're mutating state directly
3. Check if you're calling the state setter
4. Understand immutability in React

### "My server isn't working" Debug Session
You get common server issues to diagnose:
1. CORS errors
2. JSON parsing issues
3. Route not found (404s)
4. Server crashes on invalid input

### "State Synchronization" Debug Session
You get a client that gets "out of sync" with server state. You must:
1. Understand when to fetch fresh data
2. Handle optimistic vs. server-confirmed updates
3. Deal with network failures