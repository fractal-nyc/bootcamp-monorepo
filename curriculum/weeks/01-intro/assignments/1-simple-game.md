# Simple Game

## Overview

Pick a Tic Tac Toe style game and build it from scratch in React. Good contenders for this project are 2-4 player games with simple positional rules and straightforward win conditions, like Connect4, Battleship, or Dots and Boxes.

## Helpful Readings

- Git is hard. I strongly recommend learning via "Main Levels 1-4" and "Remote Levels 1-6" [here](https://learngitbranching.js.org/?locale=en_US)

## Features

A simple version of your game should have the following:

- [ ] Game Engine
  - [ ] Separate game logic from React components
  - [ ] Track game state (board, current player, etc.)
  - [ ] Calculate what a given move would do
  - [ ] Handle move validation
  - [ ] Detect win/lose/draw conditions
  - [ ] Can run entirely in browser, resets on page refresh
- [ ] Frontend/React Game Interface
  - [ ] Display current game state
  - [ ] Allow players to make moves by using the game engine
  - [ ] Show game status (whose turn, winner, etc.)
  - [ ] Reset/restart game functionality

Bonus:

- [ ] \[Styling\] - Make it look sexy. Add animations for game moves (react-spring, framer, keyframes)
- [ ] \[Algorithms\] - Player vs AI modes: start with random moves, then implement minimax or other algorithms for calculating optimal moves

## Steps (Morning)

- Set up your favorite AI with [this prompt](../../../../tools/prompts/tutor-prompt.md)
  - Recommendation: Use ChatGPT 5 + a separate Project
- [Install `git`](https://git-scm.com/downloads/mac) using Homebrew ([install homebrew](https://brew.sh/))
  - What is homebrew...?
  - What is git...?
- Create a [new github repo](https://github.com/new) with no template
  - Use a `Node` .gitignore template
  - What is github and .gitignore...?
- Clone repo to your laptop
- [Install bun](https://bun.com/get).
  - What is bun...?
- Add `README.md` and commit to `main` branch
- Switch to a new branch named `initial-tic-tac-toe-display`
- Create a new Vite project: `bun create vite .`, using `React` and `TypeScript + SWC`
  - What is vite..?
  - The `.` is important
- Edit the main page to display a tic-tac-toe grid (no state yet)
  - It's OK if it looks ugly!
- Add all files to staging for commit
- Git Commit
- Git push to remote (github)
- Make a PR for `initial-tic-tac-toe-display`
- Merge into `main`
- Grab lunch

## Diagram

![image](1-simple-game-diagram-1.png)

## Steps (Afternoon)
 - Now we need a model for how Tic Tac Toe works:
     - Create `tictactoe.ts`
     - Define a type `GameState` that can represent everything about a tic-tac-toe game
 - Add a function called `makeMove` that takes a game + player + move location and returns a new `GameState`
 - Wire up `GameState` and `makeMove` into your React component
 - Style the main page so tic-tac-toe grid doesn't look ugly
     - Use [tailwind](https://tailwindcss.com/docs/installation/using-vite)
     - What is CSS..? What is tailwind..?
 - Add detection of winners + show celebration
 - Add move validation (can't make moves after a win)
 - Don't forget to do the [readings](./2-styling.md) for tomorrow
 - Don't forget to write in #eod

## Diagram

![image](1-simple-game-diagram-2.png)

## Inspiration

- [https://playtictactoe.org/](https://playtictactoe.org/)
- [Tetris (Brian Smiley)](https://bs-tetris.netlify.app/)
- [https://kevinshannon.com/connect4/](https://kevinshannon.com/connect4/)
- [https://www.gameaipro.com/](https://www.gameaipro.com/)

## Example Code

- https://github.com/fractal-bootcamp/tic-tac-toe-fa-2025
- Do not copy and paste from this! Use it for inspiration and instruction.
