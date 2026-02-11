import { initialGameState, move, type Game, type Player } from './game'
import { describe, it, expect } from 'vitest'


describe('Tic Tac Toe Game Engine', () => {
    it('should initialize with an empty board and player x', () => {
        const game = initialGameState()
        expect(game.board).toEqual([
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ])
        expect(game.currentPlayer).toBe('x')
        expect(game.endState).toBeUndefined()
    })

    it('should allow player x to make the first move', () => {
        let game = initialGameState()
        game = move(game, { row: 0, col: 0 })
        expect(game.board[0][0]).toBe('x')
        expect(game.currentPlayer).toBe('o')
        expect(game.endState).toBeUndefined()
    })

    it('should not allow a move on an occupied cell', () => {
        let game = initialGameState()
        game = move(game, { row: 1, col: 1 })
        const after = move(game, { row: 1, col: 1 })
        expect(after.board[1][1]).toBe('x')
        expect(after.currentPlayer).toBe('o') // Should not change turn
    })

    it('should detect a win in a row', () => {
        let game = initialGameState()
        // x | x | x
        // o | o | null
        // null | null | null
        game = move(game, { row: 0, col: 0 }) // x
        game = move(game, { row: 1, col: 0 }) // o
        game = move(game, { row: 0, col: 1 }) // x
        game = move(game, { row: 1, col: 1 }) // o
        game = move(game, { row: 0, col: 2 }) // x wins
        expect(game.endState).toBe('x')
    })

    it('should detect a win in a column', () => {
        let game = initialGameState()
        // x | o | null
        // x | o | null
        // x | null | null
        game = move(game, { row: 0, col: 0 }) // x
        game = move(game, { row: 0, col: 1 }) // o
        game = move(game, { row: 1, col: 0 }) // x
        game = move(game, { row: 1, col: 1 }) // o
        game = move(game, { row: 2, col: 0 }) // x wins
        expect(game.endState).toBe('x')
    })

    it('should detect a win in a diagonal', () => {
        let game = initialGameState()
        // x | o | null
        // o | x | null
        // null | null | x
        game = move(game, { row: 0, col: 0 }) // x
        game = move(game, { row: 0, col: 1 }) // o
        game = move(game, { row: 1, col: 1 }) // x
        game = move(game, { row: 1, col: 0 }) // o
        game = move(game, { row: 2, col: 2 }) // x wins
        expect(game.endState).toBe('x')
    })

    it('should detect a win in the anti-diagonal', () => {
        let game = initialGameState()
        // o | o | x
        // o | x | null
        // x | null | null
        game = move(game, { row: 0, col: 2 }) // x
        game = move(game, { row: 0, col: 0 }) // o
        game = move(game, { row: 1, col: 1 }) // x
        game = move(game, { row: 1, col: 0 }) // o
        game = move(game, { row: 2, col: 0 }) // x
        expect(game.endState).toBe('x')
    })

    it('should detect a tie', () => {
        let game = initialGameState()
        // x o x
        // x o o
        // o x x
        const moves = [
            { row: 0, col: 0 }, // x
            { row: 0, col: 1 }, // o
            { row: 0, col: 2 }, // x
            { row: 1, col: 1 }, // o
            { row: 1, col: 0 }, // x
            { row: 1, col: 2 }, // o
            { row: 2, col: 1 }, // x
            { row: 2, col: 0 }, // o
            { row: 2, col: 2 }  // x
        ]
        for (const moveCoords of moves) {
            game = move(game, moveCoords)
        }
        expect(game.endState).toBe('tie')
    })

    it('should not allow moves after game is over', () => {
        let game = initialGameState()
        // x | x | x
        // o | o | null
        // null | null | null
        game = move(game, { row: 0, col: 0 }) // x
        game = move(game, { row: 1, col: 0 }) // o
        game = move(game, { row: 0, col: 1 }) // x
        game = move(game, { row: 1, col: 1 }) // o
        game = move(game, { row: 0, col: 2 }) // x wins
        const after = move(game, { row: 2, col: 2 }) // try to move after win
        expect(after.board[2][2]).toBe(null)
        expect(after.endState).toBe('x')
    })
})
