# Tic Tac Toe on a Server

## Overview

Right now, our server only supports playing one game at a time. Let's add the ability to play multiple games, and select one to play from the UI. This will involve two steps:
 1. Our server understands the difference between games.
 2. Our UI can render a screen to select a game, and the games being played.

## Steps (Morning)
 - Now we need to support multiple games.
 - Use Test Driven Development! Write the tests for the API you *want* first!
 - Add game ID to the `GameState` model
 - Add game ID to `/game` and `/move`
 - Have your server store multiple games in a single object, instead of a single game
 - Add a list of games: GET `/games` and a create game endpoint: `/create`
 - Verify all those tests you wrote work

## Steps (Afternoon)
 - Now we need to allow a user to pick a game:
    - Add a new "pick/create game" component that displays initially
    - Once a game ID is selected, display the normal tic-tac-toe component
 - Goal State:
    - your game allows users to join an existing game or start a new one
    - each tic-tac-toe game functions as normal (detects winners, ties, etc.)
    - states persist between chrome tab refreshes, but not server restarts

## Diagram

![image](3-server-2.png)