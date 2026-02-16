# Week 3 Group Project

## Overview
This is your first large-scale team project. You’ll work in groups of 3–4 to design and build something ambitious enough that you’d actually want to use it yourself (or your target audience clearly would, or your instructors would).  

The only deliverable is a **live demo on Saturday**. The only evaluation criterion is: *is it cool?*  
If you aren’t proud of what you built, or if your intended users wouldn’t actually want it, you’ve missed the mark. A 3 person team has 150 man hours of work this week; you can get insanely far in that amount of time.

You will work on this for one week, but the idea should be meaty enough that you could work on it for a second week if given the time.

## Project Selection
- You can pitch any idea, but you must clear it with instructors by **Monday afternoon**.  
- Ambition is encouraged. It’s fine to take on something large; we’ll help adjust scope if needed.  
- Games are a strong option: they’re fun, you are your own user, and it’s obvious if they work.  
- Don’t pick a problem space you have no access to. You need to understand your intended users.

## Inspriation

- [Balatro](https://www.youtube.com/watch?v=VUyP21iQ_-g) was a huge hit and the entire game engine could definitely be built for the web in a week
    - The [Balatro creator made it not to make money, but because he couldn't stop playing his own game.](https://localthunk.com/blog/balatro-timeline-3aarh)
- [Neal.Fun games](https://neal.fun/infinite-craft/)
- Digital [Tamagotchi](https://en.wikipedia.org/wiki/Tamagotchi) that multiple users can feed and play with together
- A chrome extension that recognizes and silently removes [ragebait](https://www.merriam-webster.com/slang/rage-bait#:~:text=Rage%2Dbait%20(also%20spelled%20as,provocative%20or%20inflammatory%20statements%E2%80%9D).) from your social media timeline
- A fully-featured AI calendar manager with Google Calendar authentication and intelligent itinerary management
- An [AI Dungeon Master that doesn't suck](https://www.reddit.com/r/DungeonsAndDragons/comments/1hbusua/best_ai_dungeon_master/)
- [BoardGameArena](https://en.boardgamearena.com/gamepanel?game=carcassonne) has a ton of web-based clones of popular board games
    - For illustration purposes only; don't just make a clone of an existing game

## Team Structure
- Teams have 3–4 people.  
- Every team must nominate a **Systems Integrator**.  
  - Responsible for overall architecture, diagrams, and module boundaries.  
  - Checks that contributions fit the broader technical design.  
  - Reviews code with others, keeps the system coherent, ensures progress is coordinated.  
  - The Systems Integrator is a role on the team, not necessarily the “best” engineer. Anyone can step up if they want the responsibility.

## Tech Stack
- Use whatever stack you want, but the defaults are:  
  - **TypeScript + React + Express/React Router**  
- Other frameworks or tools are possible, but be realistic about how much time it will take to learn them.  
- Success depends more on good architecture and teamwork than on adopting a new technology.

## Timeline
- **Weekend of Week 2 + Monday Week 3**: Find your team and idea.
- **Monday Afternoon**: Every team must deliver a pitch to the instructors and get it approved.
- **Wednesday Afternoon**: Proof of concept that is minimally fun or useful.
- **Saturday**: **5-minute live demo per team**.  
    - Audience: your cohort and instructors.  
    - The only test is whether you built something people would use or find cool.

# Readings / Lectures

- Agile-ish development
    - tight feedback loops are #1 prioirty. iterate quickly
    - tiny, incremental improvements with PR review
    - always have something working end-to-end (vertical slice vs horizontal layers)
- Decomposing systems into parts
- Law of Leaky Abstractions: https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/
- Choose Boring Technology: https://mcfunley.com/choose-boring-technology
- Falsehoods Programmers Believe About Names: https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/
    - Highlights the importance of constrained data models and simplifying assumptions
- Computers Can Be Understood: https://blog.nelhage.com/post/computers-can-be-understood/
- Write code that is easy to delete, not extend: https://programmingisterrible.com/post/139222674273/write-code-that-is-easy-to-delete-not-easy-to
- Hold a program in your head: https://www.paulgraham.com/head.htmlx
- The Wrong Abstraction: https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction
    - We probably can't assign this until students have built lots of abstractions
- Data Modeling
    - Lecture? "Design twitter". 
    - First, a spec. Then, an overall design. Then, an order of operations. Then, a view of the day-to-day dev experience