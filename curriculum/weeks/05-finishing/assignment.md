# Week 5: THE LAST 10% — Comfort, Polish & the Art of Finishing

**For:** Fractal Tech Cohort
**Starting:** Monday, Mar 3, 2026

---

## The Brief

Build something you know you can build — something comfortable, familiar, maybe even something you've already built before. Then use AI to get it to 100% of a v1, and then maybe PAST 100%, into a v2. The point here is to practice the art of finishing -- where we get something ALL THE WAY over the finish line.

Ideally, you pick a project so comfortable that you expect to finish and publish it TODAY. Certainly you should feel comfortable finishing and publishing it by Wednesday.

This will leave room and creative space for you to take the project past the point where you'd normally say "good enough" and into the territory where every edge is smooth, every interaction is considered, every detail is designed perfectly.

The challenge this week is not to build something, but to finish something.

---

## What You Need to Do

### Submit a Pitch

Before you start building, write a short pitch. It should cover:

- **What you're building** — something within your comfort zone. A project you're confident you could finish. Maybe something you've built before, or a variation on something you know well.
- **What "finished" looks like** — describe what done actually means for this project. What does polished look like? What would make you proud to put your name on it?
- **Where you usually stop** — be honest about the gap between "working" and "done" in your past projects. What's the last 10%-20% you always skip? Are you excited to push past that?

### Build It and Finish It

Spend the week building — and finishing. Use Claude Code to push past where you'd normally stop. The AI should help you:

- Write the tests you'd normally skip
- Handle the edge cases you'd normally ignore
- Polish the UI details you'd normally leave for "later"
- Write the docs you'd normally not write
- Set up the CI/CD you'd normally do by hand
- Help you do the publishing and marketing that you would normally avoid. (just don't post AI-written posts on social media, please!)

If you finish before the end of the week, that's great. Finishing early is not a problem, if anything it is ideal.

### Present Your Work

At the end of the week, we will demo. But this time we're looking at craft, not ambition. Show us something complete and polished, no matter how small it is.

---

## The Philosophy

Last week you tried to build something impossible, and found your limits. This week you will try to build something easy, and focus on your strengths, and the polish required to bring those strengths to bear.

There's a muscle many junior engineers never develop: the ability to finish. To take something from "it works" to "it's done." The last 10% of any project is where the craft lives — eliminating loading times & latency, handling error states, edge cases, documentation, tests, deployment, monitoring. It's the stuff that separates a prototype from a product.

AI makes this muscle dramatically easier to train. The tedious parts of finishing are all things AI can help you with, which lets you focus on your strengths.

---

## What Makes a Good Pitch

- It's something you're confident you can build — no uncertainty about whether it's possible
- You can describe what "done" looks like in concrete terms, and you know exactly how to build it, no ambiguity.
- It has clear edges — you know when you're finished
- It could be a rebuild of a previous project, a side project you never finished, or a new project in a stack you know well
- The ambition is in the polish, not the scope

## What We Don't Want

- Projects that are ambitious in scope — that was last week
- "I'll figure out what done means as I go" — define it up front
- Unfinished projects justified by "I ran out of time" — the whole point is to pick something you can finish
- Projects where "finished" just means "it compiles and runs"

---

## Ideas If You're Stuck

- **Rebuild a previous project from scratch**
- **Take your Week 4 project and finish it, if you think that would be easy.**
- **Build a tool you actually need** — a CLI, a browser extension, a script. Something small, useful, and complete.

---

## Finishing Challenges

These are prompts to help you practice the last 10%. Use them with Claude Code on your project this week, see how they work. For context: we made these with Claude Code ourselves and HAVE NOT tested them. Please update them to suit your local needs, or ask your own Claude to update them to suit your local needs.

---

### Install the QA Harness Skill

We built a skill that analyzes your codebase and writes your test suite for you. Install it and run it against your project:

```
# Copy the skill into your project
cp -r ~/bootcamp-monorepo/curriculum/weeks/05-finishing/skills/qa-harness .claude/skills/

# Then in Claude Code:
/qa-harness
```

It'll scan your project, find what's untested, rank the riskiest gaps, and start writing tests. Let it run. Read what it produces. See how it thinks about testing — that's the lesson.

---

### Install the Observability Skill

Same idea — a skill that instruments your project with logging, error handling, tracing, and health checks:

```
cp -r ~/bootcamp-monorepo/curriculum/weeks/05-finishing/skills/observability .claude/skills/

# Then:
/observability
```

It starts with a scan and scorecard, then builds up each layer. By the end, your project has structured logging, proper error chains, request tracing, and a health check endpoint. These are things production apps need and side projects never have.

---

### Install the Networking Skill

Audits your project's HTTP layer — API design, auth, CORS, error handling, debugging tools:

```
cp -r ~/bootcamp-monorepo/curriculum/weeks/05-finishing/skills/networking .claude/skills/

# Then:
/networking
```

It maps every network boundary in your project and fixes issues. You'll learn how to use curl as a debugging tool, what your browser's network tab is actually telling you, and why your CORS config is probably wrong.

---

### Write a README That Would Make a Stranger Want to Use Your Project

Ask Claude to help you write a README that covers: what it does, why it exists, how to install it, how to use it, how to contribute. Then read it as if you've never seen the project before. Does it make sense? Would you star this repo?

---

### Deploy It

If your project isn't deployed, deploy it. Use Claude to set up whatever you need — Netlify, Vercel, Railway, Fly.io, a VPS, whatever fits. The goal is a URL you can share with anyone.

---

### Set Up CI/CD

Ask Claude to add a GitHub Actions workflow that runs your tests on every push. If your tests pass, it deploys automatically. If they fail, it blocks the merge. This is how real teams ship — and it takes Claude a few minutes to set up.


---

## More Agentic Engineering Experiments:

---

### Teach Your AI to Write Like a Human

See if you can get Claude to write in a way that doesn't sound like Claude, and that actually improves the quality of its work and thinking. For instance, Read Michael Nielsen's [notes on writing](https://github.com/mnielsen/notes-on-writing/blob/master/notes_on_writing.md). Or grab notes on writing from any of a number of famous writers! Try turning these into a writing skill for Claude that improves the quality of its READMEs, commit messages, docs, comments, etc... See if this can be a living document that you improve over time.

---

### Learn `claude -p` and Spin Up "Clear Claudes"

Claude Code has a headless mode (`claude -p`) that lets you spawn fresh Claude instances from the command line. These "clear claudes" are useful when your main session is deep in one problem and you need a second opinion, or when you want to fan out work across multiple agents.

Read up on (or ask your claude to read up on) the [CLI features and patterns](https://x.com/dhasandev/status/2009529865511555506) and experiment. Try spawning a clear Claude to review your code while your main Claude keeps building. Try using subagents (the Agent tool) for the same purpose and figure out when each approach makes sense. Teach your Claude about `claude -p` so it can spawn its own helpers.

---

### Build a Phone-Based Transcription Coding Setup

What if you could go on a walk and still ship code? Build yourself a transcription + orchestration pipeline that works from your phone. Voice memo → transcription → Claude → PR. [Here's one approach](https://x.com/remilouf/status/2027851432641069153) — a phone-based workflow where you dictate what you want, it gets transcribed and sent to Claude, and code gets written while you're walking around the block.

Could be a Telegram bot, a Shortcuts automation, a simple voice app — whatever lets you do important and valuable work while walking. This is the kind of freedom AI can afford us!

---

### Build Your Own Engineering Dashboard

You've got stuff scattered everywhere — your project repo, your blog, your Claude Code sessions, your context window usage, your PRs, your test results. Build a dashboard that pulls it all together. [Here's some inspiration](https://x.com/benjitaylor/status/2027419120258683344) for what this could look like.

It doesn't have to be fancy. A single HTML page that shows: what's running, what's broken, what you shipped today, what your Claude is working on. Maybe your EODs overtime? The point is situational awareness — one place where you can see everything at a glance.

---

Pick any of these that interest you. The best harness is the one you've customized to fit your working style!
