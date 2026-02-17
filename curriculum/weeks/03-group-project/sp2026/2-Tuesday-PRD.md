# Group Project

## Overview

The theme of this week will be about building software as a team. Now that you've done your game development orientation with Claude, we're going to split you into groups to create a new game from scratch.

## Morning: PRD

- Like with solo development, the most difficult thing is deciding what to build.
  - In an engineering team, there's the added wrinkle of figuring how to split up the work ("parallelize" it) so you can move faster than you could by yourself.
  - You also don't want people moving in opposing directions, duplicating each other's work, or building something only to delete it later ("thrashing").
- So, before you start, you want to articulate a shared vision in a legible artifact in which you've achieved enough collective alignment to begin executing while acknowledging any open questions or lingering points of disagreement.
- Touches on our theme of "not gambling."
- One such artifact is called a Product Requirements Document (PRD).
  - Typically, a product manager is responsible for producing this document, but ideally they get buy-in from all the relevant stakeholders.
    - In this program, the **Systems Integrator** will be the one responsible for aggregating everyone's input into a single doc.
  - Furthermore, with AI coding, it's even more important now that engineers have a product mindset. It's no longer a senior software engineer only thing.
  - What a PRD is:
    - Describes the product's objectives, the problem(s) it solves, and relevant context.
      - Clarifies the scope of the problem.
      - States assumptions.
      - Can also describe non-goals ("out of scope"), things the product is _not_ trying to achieve. Keeps focus crisp.
    - Articulates the constraints of the solution, e.g.:
      - Time, headcount, budget
      - Legal, privacy, security
      - Dependencies
      - Deployment platform(s) (e.g. web, mobile)
    - Identifies the target audience and writes from the user's point of view. This typically takes the form of "user stories" or "user journeys."
      - One template: "As a [type of user], I want [goal] so that [value]."
      - "As a player, I want the game to autosave after every level, so I don't lose my progress if I close the game."
      - "As a QA analyst, I want to see the frame rate in real-time, so I can identify performance bottlenecks."
    - Describes the product's functionality (e.g. game mechanics).
      - "The game takes place on a single, massive map that a player can freely move around on."
      - "Players can combine certain sets of items to create new, more powerful items."
    - What does the product look and feel like? What's the "vision?"
      - Examples of helpful imagary:
        - Concept art
        - Mocks
        - Storyboards
        - Wireframes
      - However, you only need enough to get the idea across. Details belong in a separate UX design document.
    - Success metrics and criteria: how will we know the product achieved its goals?
    - Milestones: what is the sequence of phases that we're building through?
    - May discuss tradeoffs or alternatives considered.
    - Can specify everything from a single (complex) feature to an entirely new line of business.
    - A "living document" that can evolve throughout the development process as new information is uncovered.
    - A record of collective decision-making under uncertainty.
  - What it is not:
    - It is not an engineering design document. A PRD does not prescribe how to do something, only what and why. In that sense, it is like an interface or contract. That said, engineering may give feedback about the technical feasibility of this or that requirement, and (in a functional organization) product will adjust the PRD accordingly.
- Some limitations:
  - Given that we only have a week for this project, some PRD sections like risks, rollout strategy, and operations aren't quite as relevant.
  - Since we're building a game, there's less opportunity for "solving user problems" per se. This exercise is mainly about aligning on vision.
- Resources
  - PRD template examples: https://www.lennysnewsletter.com/p/my-favorite-templates-issue-37

## Afternoon: ECS

- We've seen from the Snake example that there are two basic functions in a real-time game: initialize() and loop().
  - Initialize sets up the starting conditions for the game.
  - Loop computes updates to the game state once per "tick" according to the game's rules until the game is terminated.
- However, if you try to put all your game logic in these two methods, it will become unmanageably complex and difficult to split up among multiple developers (merge conflicts).
- One solution: ECS (Entities, Components, Systems)
  - Entities:
  - Components:
  - Systems:
- A note on Composition vs. Inheritance
