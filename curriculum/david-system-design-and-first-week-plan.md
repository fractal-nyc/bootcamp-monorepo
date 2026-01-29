# Week 1

- Present personal introduction deck: https://docs.google.com/presentation/d/1ccZHS0jSqqF4KU-VakBx_RfY4l0_9KMEo_PQVrgHgHk/edit?slide=id.p#slide=id.p
  - It currently has a bunch of info about day-to-day expectations and etiquette. Liam could do the day-to-day bit instead and I could do the overall curriculum piece.
- How to use git to produce Pull Requests: https://docs.google.com/presentation/d/1Qf4fNeLgDZFfJtX97VTa946BTRMJO_9S5QvIPZdso60/edit?slide=id.p#slide=id.p
  - Could be done on Day 1 by Paris?

## System Design track

- What is system design?
  - It's choosing among the various components available to you (computing units, database, libraries, APIs, etc.) to satisfy the functional (what the system does) and non-functional (how the system performs) requirements under the constraints (time, money, labor, legal, security, etc.) of the problem.
  - Depending on how tight the constraints and requirements are, there can often be more than one system design that could solve the problem with different pros and cons. Surfacing and choosing among trade-offs between different solutions is a critical engineering skill.
- Throughout the program we'll get deeper into what components are available and how to choose them to solve various problems, but to start we're going to focus on how to communciate our system design ideas.
- Being able to vividly communicate the structure of your system is important for several reasons:
  - Ensures that YOU understand what system you (or your AI) are building.
  - Enables you to get buy-in from both other engineers and non-technical people for the system you propose to build.
  - Provides documentation so that future engineers (including future you) can understand at a glance the structure of the system.
- Descriptive text or code are not always the best media for explaining your ideas in a way that people can easily understand.
- In Paris' presentations, you've seen various kinds of diagrams that functioned as maps to orient you and made it easier to write the code that implements the systems in question.
- Several types of diagrams (not exhaustive)
  - System Architecture diagram ("boxes and arrows")
  - Sequence diagram (requests and responses happening over time)
  - State diagram (shows how a state machine can transition between states)
- Because computer systems are built upon many layers of abstraction, you'll want to include only the most important details relevant to the problem at hand.
- Each week we'll do a brief system design exercise that we'll prepare for on Thursday and Friday.
- You will be expected to be able to draw system diagram for the applications you build

# System Design Interview Reading Group

We will be holding weekly discussion sessions on select chapters from System Design Interview Volume 1 by Alex Xu. Besides prepping you for eventual system design interviews, the motivation is to exposure you to various building blocks of computer system design and how they can be assembled to solve real-world problems.

Here are the chapters we'll cover each week. To participate, make sure to read (or at least skim) the chapter ahead of time.

1. Chapter 1: Scale from Zero to Millions of Users. Consider how you would apply these architecture ideas to your Tic Tac Toe app.
2. Chapter 12: Design a Chat System. Consider how you would apply these architecture ideas to your chatbot app.
3. Chapter 9: Design a Web Crawler
4. Chapter 11: Design a News Feed System
5. Chapter 14: Design YouTube
6. Chapter 15: Design Google Drive
7. Chapter 8: Design a URL Shortener
8. Chapter 10: Design a Notification System
9. Chapter 13: Design a Search Autocomplete System
10. Chapter 6: Design a Key-Value Store
11. Chapter 4: Design a Rate Limiter
12. Chapter 7: Design a Unique ID Generator in Distributed Systems
