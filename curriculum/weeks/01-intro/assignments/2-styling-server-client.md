# Styling and Server/Client Architecture
We have two goals today:
 - Learn about the basics of styling, and use it to make our Tic Tac Toe more pretty.
 - Introduce a _server_, and move the game state into the server.

## Steps (Morning)
 - [Learn about the basics of CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/What_is_CSS)
 - [Learn about the Box Model](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model)
 - [Learn Flex Box](https://flexboxfroggy.com/)
   - In practice, flex box will do almost all positioning you need to do in CSS
 - [Learn about Mobile-first](https://www.uxpin.com/studio/blog/a-hands-on-guide-to-mobile-first-design)
 - Style your `App.tsx`
    - Make it look really pretty (or wacky) and your own style!

## Steps (Afternoon)
 - Read [Promises & Asynchronous Programming, from beginning until "Generators" section](https://eloquentjavascript.net/11_async.html)
 - Set up [Vite-Express](https://github.com/szymmis/vite-express?tab=readme-ov-file#fresh-setup-with-create-vite) on your existing tic-tac-toe app
 - Modify `bun run dev` to run `server.ts`
 - Add a `/game` (GET) and `/move` (POST) endpoints
 - call `makeMove` in the server, manage the game state in-memory
 - Use `fetch()` in `App.tsx` to read and write game data via a server
 - Goal State:
   - your game has identical functionality, but all game state is managed by the server
   - game state persists if you refresh the tab, but not if you restart the server

## Diagram

![img](./2-styling-server-client.png)