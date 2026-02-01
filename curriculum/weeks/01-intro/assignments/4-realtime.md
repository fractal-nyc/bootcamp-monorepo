# Real-time Game

## Overview

As you may have noticed, if you load up your game in multiple tabs, updates in one tab do not translate in real-time
to the other tab. Our goal is to fix that with a technology for real-time communication between client and server: WebSockets.

## Steps (Morning)
 - [Learn about Websockets](https://itp.nyu.edu/networks/an-introduction-to-websocket/)
 - Set up the [`express-ws`](https://www.npmjs.com/package/express-ws) package
 - Let clients subscribe to events for certain game IDs
 - When clients receive a game update via websockets, update the React state for the game

## Diagram

![image](4-realtime.png)

## Steps (Afternoon)
 - Use [Sevalla](https://sevalla.com) to deploy your project