# Multi-Client Game

## Overview

Make your server support multiple games. Your UI will need to display some way to select one of many games, or create a new one.

## Steps
 - Now we need to support multiple games.
 - Add game ID to the `GameState` model
 - Add game ID to `/game` and `/move`
 - Add a list of games: GET `/games` and a create game endpoint: `/create`
 - Now we need to allow a user to pick a game:
    - Add a new "pick/create game" component that displays initially
    - Once a game ID is selected, display the normal tic-tac-toe component
 - Goal State:
    - your game allows users to join an existing game or start a new one
    - each tic-tac-toe game functions as normal (detects winners, ties, etc.)
    - states persist between chrome tab refreshes, but not server restarts
 - If you have time, add refreshing of game state
    - If Alice and Bob are playing on two different tabs and Alice makes a move, Bob won't see it (his react component doesn't refresh, after all).
    - There are two ways to fix this: Polling, or [websockets](https://socket.io/).
    - Polling is easy, but janky (and won't scale)
    - Websockets are more work to implement, but solve this problem scalably.
    - Try to implement polling, then move to websockets (if time)

## Diagram

![image](4-multi-game.png)


## Example Code

[PR]([Step 2](https://github.com/fractal-bootcamp/tic-tac-toe-fa-2025/pull/2))