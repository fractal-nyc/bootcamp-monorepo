# Chatbot

## Overview

Today we are going to start building a chatbot/AI agent app. We will be using familiar technologies (git, bun, Vite, Express, React) alongside a new one: third-party APIs, specifically Claude.

## Steps (Morning)

- Use `curl` to make a request to the Anthropic API based on these docs: https://platform.claude.com/docs/en/get-started.
  - Don't forget to export your API key as an environment variable.
  - Notice the `-d` param to `curl`. This implicitly turns the request into a `POST` and allows you to pass data in the request body.
  - Use "claude-haiku-4-5-20251001" as the model instead of Opus 4.6 since it's cheaper.
- Write a shell script (`.sh`) that invokes the `curl` command with its necessary parameters and allows you to pass a single argument as the prompt (e.g. `sh curl-claude.sh "hey Claude how's it going?"`).
  - Reference: https://hbctraining.github.io/Training-modules/Accelerate_with_automation/lessons/positional_params.html
- Create a new Vite Express app using `bun create vite-express` [(docs)](https://github.com/szymmis/vite-express?tab=readme-ov-file#fresh-setup-with-%EF%B8%8F-create-vite-express).
  - **ADD `.env` TO YOUR `.gitignore` SO THAT YOU DON'T ACCIDENTALLY CHECK THE API KEY INTO SOURCE CONTROL.**. Then, install the [dotenv](https://www.npmjs.com/package/dotenv) NPM package, add the API key to a file called `.env`, and configure dotenv per the "Usage" instructions [here](https://www.npmjs.com/package/dotenv).
  - Update the default `/hello` endpoint to use the NodeJS [fetch](https://nodejs.org/en/learn/getting-started/fetch) function to call the Claude API.
  - Messages API basics: https://platform.claude.com/docs/en/build-with-claude/working-with-messages. Most importantly, note that the API is **stateless**, meaning you have to pass the entire message history to get the next turn of the conversation.
- This is going to become tedious, but fortunately Anthropi c provides a [NodeJS SDK](https://platform.claude.com/docs/en/api/client-sdks#type-script) for calling their API.
  - Now switch your `/hello` endpoint to use the SDK ([docs](https://github.com/anthropics/anthropic-sdk-typescript?tab=readme-ov-file#usage)).
- Now lets build the foundation of our chatbot.
  - Create a new `POST` endpoint (`/chat`) that:
    - takes a message from the user
    - sends it **along with any existing message history** (stored on the server) to the Claude API
    - adds Claude's response to the message history
    - returns Claude's response to the user
  - Create a basic UI that has:
    - a `<textarea>` element ([docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/textarea)) where the user can type messages
    - a `<button>` that when clicked calls your `/chat` endpoint
    - a `<div>` that displays the entire conversation. It gets updated when the call to `/chat` returns.
- Add a `/reset` endpoint that clears the current conversation so the user can start a fresh one without restarting the server.

## Steps (Afternoon)

- We have the basic chat flow working now, so let's make it look pretty.
- Previously, you were introduced to [Tailwind](https://tailwindcss.com/), a CSS library that makes it easy to style plain HTML elements.
- Today, we're going up one level of abstraction higher with [Shadcn](https://ui.shadcn.com/), a library of pre-built UI components that provide common functionality while allowing easy customizability.
- Add Shadcn to your project like so: https://ui.shadcn.com/docs/installation/vite
  - Note that Shadcn has a somewhat different installation model compared to other component libraries. Rather than introducing a Node package dependency, we copy all of the Shadcn code for the components used in our project such that we "own" the code.
- Now add the components you want to use in your UI. Suggestions:
  - [ScrollArea](https://ui.shadcn.com/docs/components/radix/scroll-area) to contain the conversation.
  - [Textarea](https://ui.shadcn.com/docs/components/radix/textarea) for where the user types.
  - [Card](https://ui.shadcn.com/docs/components/radix/card) for each turn in the conversation.
  - [Button](https://ui.shadcn.com/docs/components/radix/button) for sending the chat to the server.
- Bonus: try using one of the higher-level libraries in the [Shadcn directory](https://ui.shadcn.com/docs/directory) like [AI Elements](https://elements.ai-sdk.dev/) or [Assistant UI](https://www.assistant-ui.com/docs/ui/thread).
