// Tic Tac Toe Game Engine


// gameState
// move(gameState) -> gameState
// endCondition(gameState) -> endResult | undefined

export type CellCoordinate = {
    row: number,
    col: number
}
export type Player = 'x' | 'o'
export type Cell = Player | null
export type Board = Cell[][]
export type EndState = Player | 'tie' | undefined
export type Game = {
    board: Board,
    currentPlayer: Player
    endState?: EndState
}

export const initialGameState = (): Game => {
    const game: Game = {
        board: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        currentPlayer: 'x'
    }
    return game
}

function nextPlayer(currentPlayer: Player) {
    if (currentPlayer === 'x') return 'o'
    else return 'x'
}

export function move(game: Game, selectedCellCoords: CellCoordinate): Game {
    const nextGame = structuredClone(game)
    let selectedCell = nextGame.board[selectedCellCoords.row][selectedCellCoords.col]

    if (selectedCell) return nextGame
    nextGame.board[selectedCellCoords.row][selectedCellCoords.col] = game.currentPlayer
    // add the currentPlayer to the selectedCell = nextGame.currentPlayer

    // calculate the endCondition
    return { ...nextGame, currentPlayer: nextPlayer(nextGame.currentPlayer), endState: calculateEnd(nextGame) }
}

function calculateEnd(game: Game): EndState {
    const { board } = game;

    // Check rows and columns
    for (let i = 0; i < 3; i++) {
        // Check row
        if (
            board[i][0] &&
            board[i][0] === board[i][1] &&
            board[i][1] === board[i][2]
        ) {
            return board[i][0] as Player;
        }
        // Check column
        if (
            board[0][i] &&
            board[0][i] === board[1][i] &&
            board[1][i] === board[2][i]
        ) {
            return board[0][i] as Player;
        }
    }

    // Check diagonals
    if (
        board[0][0] &&
        board[0][0] === board[1][1] &&
        board[1][1] === board[2][2]
    ) {
        return board[0][0];
    }
    if (
        board[0][2] &&
        board[0][2] === board[1][1] &&
        board[1][1] === board[2][0]
    ) {
        return board[0][2];
    }

    // Check for tie (no empty cells)
    const isBoardFull = board.every(row => row.every(cell => cell !== null));
    if (isBoardFull) {
        return 'tie';
    }

    // Game is still ongoing
    return undefined;
}
