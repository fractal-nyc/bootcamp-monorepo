### New (Sp2026):

Day 1 (Monday OR Tuesday):

Use Claude To Build A Game:

1. Define what a game is IN TERMS OF CODE:
    a. get that definition from us -- one of the values of expertise
        b. Ask Claude "what kind of game architecture is this. How does it work? What are popular alternatives to this kind of game architecture? What are the advantages? What popular games are built with this kind of architecture?"
    c. Maybe we give them a pseudocode definition, or a MODEL (drawing/diagram of a game). And their job is to basically translate that into a game.
    d. can we build an e2e test suite that confirms our definition of the game (before or after each generation step, I prefer after for creative work)
2. Build the core game loop via a system of prompts, each of which focus on getting to a "steel thread" of the entire game
    a. can a sprite move based on input
    aa. multiplayer???
    b. can Objects be placed in the environment
    c. can those Objects have collision
    d. can objects "automatically" be subject to forces, like physics
    e. can I pause the game
    f. can i have routing and a start menu
    g. can I have music
    h. can i have sound effects on action
    i. can i have sprite animations
    j. can i automatically produce a PACKAGE of assets for a new object in my game, via an automated asset pipeline
        i. base sprite
        ii. sprite sheet for animations (list all major animations: walking, attacking, idle, interacting)
        iii. sound effects for major actions (walking, attacking, idle, interacting)
        iiii. dialogue / voice lines
    k. can i observe and pause and rewind game states to debug my game while it is playing
        i. can i adjust all game-constants in real time, so that I can change the fundamental parameters of my game, or of any object in the game
        ii. can i click on an object, and get a debug panel which tells me all of its internal states, and gives me little controls to manipulate them
    l. coordinate systems?
3. MAGICAL MOMENT: Can I use AI to DRAMATICALLY CHANGE and PLAY with my game system on a new branch, if my architecture is solid.
    a. Change from a top-down 2D RPG to a side-scrolling 2D platformer with a single prompt.
        i. be rigourous and concrete with the prompt
    b. Completely change the art style, and re-build the assets for your ENTIRE GAME in a new color palette
    c. make your game 3D from 2D just by changing the rendering engine and re-generating assets, plus updating each of the subsystems for 3D instead of 2D math.



Day 2 (Tuesday):
- Team Assignment
- Lecture on making a PRD based on Project Architecture (in this case, Game Loop & Sub-Systems) as Project Management Focus:
    -> "hub & spoke"
        - "main.ts // game.ts // core.ts" -> imports and uses sub-systems
        - INTERFACES:
            - core.ts -> each subsystem
            - ECS
    -> how do you split responsibilities quickly by agreeing on the interfaces with the CORE, then assigning members to those interfaces (sub-systems)
    -> how do you document this in a PRD, so each member can go check against "truth" when considering their own interface.
    -> System Integrator (responsible for CORE.ts // ALSO: PRD & maintenance, updating of interfaces, integration of subsystems, unblocking the team)
        -> engineers who build and maintain and update subsystems according to requirements
    -> mocking/stubbing interfaces to create a "steel thread"

We would be happy if by the end of day 2, every team had a PRD with their design, and a CORE.ts that had stubbed every major subsystem in the design
plus team members were assigned appropriately to build out those subsystems to "complete" the stubs // interfaces.

That should look something like this:
- Game Loop (2D RPG, with environment interactions, running around a maze collecting coins, etc...)
    - systems, or components (ECS)
        - physics component
        - collisions component
        - movement component
        - input component
        - render component (?)
            - pixi.js renders to the stage
    - start menu & routing
        - "layering"
            - pause menu (interrupts rendering + layers UI on top)


Day 3 (Wednesday):
- Coding in Earnest

- Lecture is on problems and strategies of Individual Contributors on an Engineering Team:
    - DevOps problems
        - (waiting on PR review from your Systems Integrator)
        - build system not working, scripts not working, packages not working
        - style and lintings
        - merge conflicts and parallel development
        - testing (and green builds, incomplete or non-existent test suite, which can create unobserved/unintended bugs)
        - regressions
        - Claude Pre-commit hook for styleguide, bugs, regressions, testing, etc...
            - Husky (pre-commit hooks across the team)
        - Claude Skills for the team to use??
        - Claude should be able to reason about and audit each of your subsystems, ideally as a skill.
        - "Communicate and Deliver"
            - How do you deliver for your team? How can you notice bottlenecks?
        - database & networking
            - seed a database for your work.
            - migrations / backfilling (?)
        - observability tools and being able to inspect state // identify bugs, especially in staging/production "debug mode" in prod.
    - ONLY SHIP HIGH QUALITY WORK.
        - only ship work that is at the highest conceivable quality that YOU AND CLAUDE together (as reviewers // auditors) are capable of.
            - Do not settle, it often only takes 5 minutes to review your work, and it gets fasters over time as you get better at it.
            - claude as salvation against cowboy coding, rather than acceleration of cowboy coding
            - point claude at your diffs and write tests for those changes!! Don't ship untested code, there is no good reason!
    - Effective Engineer & Pragmatic Programmer
        - really good books for this week.

- LECTURE ON ECS:
    - What DATA do you need:
        - time
        - frame drift
        - render loop sync with clock
        - drop frames rather than break time
    - Physics System operates on Time, Position, Velocity, Acceleration

- multiplayer
    - networking
    - peer2peer vs. client-server
    - TCP/IP vs. UDP

Day 4 (Thursday):
- Nitty Gritty Details & Integrations
- Refactoring (let's say we are adding something major cross-cutting concern).
- Asset Pipelines


Day 5 (Friday):
- Polish, presentation, playtesting, fun, peripherals??

Day 6 (Saturday):
- Demos



Ideas For Lectures:
- databases
- auth
- leaderboards
- multiplayer
    - networking
    - peer2peer vs. client-server
    - TCP/IP vs. UDP
- rendering (how does it work, how does pixi.js work? what about 3.js? what does this say about web rendering in general? What is WebGL? Compare to the DOM?)
- 

    
