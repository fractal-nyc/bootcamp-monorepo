# Real-time Game

## Overview

As you may have noticed, if you load up your game in multiple tabs, updates in one tab do not translate in real-time
to the other tab. Our goal is to fix that with a technology for real-time communication between client and server: WebSockets.

## Steps (Morning)
 - [Learn about Websockets](https://itp.nyu.edu/networks/an-introduction-to-websocket/)
 - Set up the [`express-ws`](https://www.npmjs.com/package/express-ws) package
    - It turns out [HMR](https://webpack.js.org/concepts/hot-module-replacement/) uses websockets, so we need to [turn it off in `vite.config.ts`](https://github.com/fractal-bootcamp/tic-tac-toe-sp-2026/blob/main/vite.config.ts)
 - Let clients subscribe to events for certain game IDs
 - When clients receive a game update via websockets, update the React state for the game

## Diagram

![image](4-realtime.png)

## Steps (Afternoon)
 - Use [Render](https://render.com) to deploy your project
    - Just logging in with your github and providing your tic tac toe repo will get something started
    - make sure Sevalla runs `bun install`, `bun run build`, and then `bun run start`
    - Make sure your app starts on the port configured from the environemnt, [like Sevalla tells you to](https://render.com/docs/web-services#port-binding)