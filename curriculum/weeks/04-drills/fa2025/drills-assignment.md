# Week 4 - Drills

## Overview

AI-assisted coding is both your greatest strength and weakness as engineers. It will make you move faster and more efficently than ever before, but it also has an ability to cover up all of your weaknesses and make all your skills atrophy.

Before moving onto mastering AI-assisted coding, we need to diagnose and train up all your core skills as engineers. We will administer a set of drills every morning which you will all do. We will use that to identify weaknesses in your skills and spend the rest of the day working on those, before trying the drills again the next morning. We reserve the right to assign additional drills/work on a case-by-case basis.

After you've run through all the drills with ease, we will set you loose to experiment with AI-assisted coding for the rest of the week.

## Repo + Details

[https://github.com/fractal-bootcamp/fundamentals-drills](https://github.com/fractal-bootcamp/fundamentals-drills)

## AI Assisted Coding

Once you've completed all the drills and you get the coach approval, we can move onto exploring AI-assisted coding.

The most important thing to realize is that AI coding is **the wild west**. Nobody has any clue what works, they just have a ton of ideas.
Your job is to explore this space and find a workflow that works for you. Don't ever stop investigating new paradigms and trying them out,
as the odds you've stumbled upon the best one is very unlikely, and it's very likely the best AI workflows are 50x as productive as the 
mediocre ones. It's very likely that with the right experimentation you can find a technique that is even better than the coaches
use. This technology is so new that both you and your coaches are in the same place on this journey.

Your job for the rest of the week is to **reach the maximum level of complexity AI coding can support as fast as possible** and then figure out how to push it even further. Please share what you find or what works for you in the coming weeks, as I am certain we will all learn something new from it.

One thing we cannot emphasize enough: **never defer your thinking to the AI**. The AI is bad at taste, conceptual clarity, and product thinking. That has to be your job. If you defer it to the AI by letting it make architecture decisions for you, or by letting the conceptual clarity of the code degrade, or not keep the code base immaculate, you have entirely stopped adding value and your job will the automated away in a few years. You are the wise king of your own kingdom, and the AI is your many clever council members. Your job as the king is not to have all the cleverness and knowledge of your various advisors. Your job as king is to have the good judgement to know which councilmember to listen to, or none at all.

I recommend exploring in increasing levels of complexity:

 - **AI as coding assitant**
    - Use Cursor (quickly falling out of fashion), Claude Code, and Codex to help with tiny individual tasks
    - Figure out which frontier model and tool you like to use the most
    - Ask it to "Refactor this function, make this button green and shiny, write a database query to select all users who signed up later than Jan 10", etc.
    - [Follow this advice](https://simonwillison.net/2025/Mar/11/using-llms-for-code/)
    - [Read this too](https://steipete.me/posts/just-talk-to-it). It argues for less automation for now
    - Give the AI agent small tasks in an existing codebase (your group project, your tic tac toe app, etc)
    - Figure out how to maintain conceptual clarity and high level understanding while using AI
    - **DO NOT BLINDLY CLICK ACCEPT EDITS**
    - Try to get your projects to the point where the slop is piling up and things are breaking and hard to fix with AI alone.
 - **Spec-driven development**
    - [Here](https://blog.fsck.com/2025/10/05/how-im-using-coding-agents-in-september-2025/) is a good model to follow, but there are many many others.
    - Writing really good specs seems to help avoid AI Slop.
    - This is a great opportunity to have the AI just one-shot some new project and see how it goes. With AI you can build 4 toy apps a day, easily.
    - Learn to prompt it well and don't let it write slop.
        - [This video](https://www.youtube.com/watch?v=WcpfyZ1yQRA) is the best demonstration of this I've ever seen.
    - Use specs until you can get much further than the naive coding-assitant approach.
 - **Automated Agents**
    - Constantly fighting agents, reviewing their code, and adjusting specs is tedious and seems automatable, right?
    - [Add automation](https://blog.fsck.com/2025/10/09/superpowers/) to make the spec driven approach easier
    - [Vibe Engineering](https://simonwillison.net/2025/Oct/7/vibe-engineering/)
    - I suspect if you get good at this you would be a 5x faster engineer than has ever existed and make millions
    - But nobody can figure this out yet, so don't worry if you fail at it