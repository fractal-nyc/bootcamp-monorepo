import { useState } from 'react'
import './App.css'
import { initialGameState, move } from './game/game'

function App() {
  const [game, setGame] = useState(initialGameState())



  return (
    <div className="app">
      <div className="game-container">
        <h1 className="game-title">Tic Tac Toe</h1>

        <div className="game-info">
          <div className="current-player">
            Current Player: <span className={`player-indicator player-${game.currentPlayer}`}>{game.currentPlayer.toUpperCase()}</span>
          </div>
          {game.endState && (
            <div className="game-result">
              {game.endState === 'tie' ? 'It\'s a tie!' : `Player ${game.endState.toUpperCase()} wins!`}
            </div>
          )}
        </div>

        <div className="board">
          {game.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`cell ${cell ? `cell-${cell}` : ''}`}
                onClick={() => {
                  setGame(prev => move(prev, { row: rowIndex, col: colIndex }))
                }}
              >
                {cell ? cell.toUpperCase() : ''}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default App
