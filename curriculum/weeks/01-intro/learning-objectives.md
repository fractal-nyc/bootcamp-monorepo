
### Week 1 -- teaching the fundamentals of programming computers using TicTacToe

0. Concepts/Systems -- concepts are ways in which we interact with, query, and transform state in order to form a higher order concept that achieves a goal of ours. For instance "TicTacToe".

1. Data/State -- as in, what is the "state" which represents a system or process or game which changes over time (as in a state machine).
- How can we build programs around State which manipulate it and maintain it in order to accurately represent a system.

2. The Reactive Model -- how can we describe an app, a component, a screen, or a visual element in TERMS OF a minimal piece of state, such that for ANY valid state, that app/component/screen knows how to display itself. This means the ONLY part of my app which "changes" is the state. The rest is static with respect to ANY state, so I don't need to worry about modeling the state of the frontend in my head.

3. HTTP/Networking/Express/Remote Servers/Client-Server Model -- How can we build a system that is distributed over vast physical location and many devices. Especially with respect to a game -- how can multiple players in different buildings, or different states or even countries, somehow play the "same" game, which shares the "same" state. The answer is by building a remote HTTP server (we will use express). How can our client/frontend REACT to changes in the state on that SERVER by sending HTTP requests and using that data to update its own state?


### PROBLEM:
The problem is that many students get stuck on one of these 4 basic fundamentals, and if we don't unblock them or make the concept clear to them, they may begin to feel distraught and behind.

What I need is a way for each one of these fundamental pillars for students to practice via exercises the fundamental skills involved.

For concepts/systems, I like them to be able to build and understand tic-tac-toe. Keep in mind that concepts/systems and data/state need to be taught together because the way in which you're going to describe the concept/system is first in English and pseudocode (which could be its own separate exercise for concepts/systems), and then in TypeScript specifically. Once it is in TypeScript, that's when we would describe it as a data/state of the system plus the other concepts that we would use to manipulate that data and state those functions.

For the reactive model, I'd want some kind of exercise that helps people understand how React can very simply react to changes in state for our tic-tac-toe game state. If the exercise for 0 and 1 help you build a tic-tac-toe game engine from scratch, then step two, the reactive model, the exercise will specifically focus on how we can take the state from our game engine and react to that state by rendering it and then make moves using that game engine such that we're able to interact with that state.

And then for the third exercise, HTTP networking, express the client-server model. The question is, how can we build the system such that it's distributed over vast locations, many different devices? In other words, how can we move our game engine, our state machine, our Tic-Tac-Toe game from the client onto some remote HTTP server, and then how can our client or front-end still react to changes in the state on that server by sending HTTP requests despite the fact that now the data or the state has moved locations; it's now in a different location, it's on another computer.

Please help me design some of these exercises.