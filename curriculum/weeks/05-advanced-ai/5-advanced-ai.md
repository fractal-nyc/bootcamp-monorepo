# Week 5: Advanced AI Project

## [Presentation](https://docs.google.com/presentation/d/1HIT61MRfD1wHfd-cLq5OQx42ONXwh9vsw7L19MvRxak/edit?usp=sharing)

## Motivation

This week is about building something that uses **advanced AI capabilities** in a real, working product. By the end of the week, you’ll have shipped a live demo that shows you can work with frontier tools in meaningful ways.

These skills matter. Modern software teams are integrating AI into every layer of their stack — from intelligent assistants to adaptive workflows and domain-specific copilots. Hiring managers now assume familiarity with LLM-based tools, embeddings, and agentic systems. Building something tangible with them gives you portfolio proof that you’re already fluent in the next generation of tech.

Also: this is new ground. Nobody fully knows the “right” way to do any of this yet. You’re experimenting at the frontier. AI development right now is chaotic and fast-moving. You’ll be working with half-documented tools, vague APIs, and shifting best practices. That’s good. Learning to navigate that chaos is part of becoming the kind of engineer who can lead, not follow, the next wave of technology.

## What Counts as “Advanced”

Your project should show that you can combine models, data, and logic into something more than an API call. Examples of current patterns:

- **Agents and tool use** — LLMs that plan, call functions, or act in multi-step sequences  
- **Retrieval-augmented generation (RAG)** — search over private or domain-specific data using vector embeddings  
- **Workflow orchestration** — chaining models and tools together with state, scheduling, or background jobs  
- **Multimodal input/output** — combining text, code, image, or audio in a coherent interface  
- **Customization** — fine-tuning, adapters, or prompt engineering that meaningfully changes behavior  
- **Evaluation and benchmarking** — automated ways to test or score AI behavior  
- **Real-time or interactive systems** — streaming responses, live coding aids, conversational agents  

You don’t need to hit every category, just one that feels deep enough to show serious technical engagement.

## Expectations

- **Monday**: Have an idea by end of the day and get approval from the coaches. If you discover something cooler during the week, feel free to pivot.
- **Demos on tuesday, thursday, and saturday.** The demo must be functional, even if parts are mocked. With AI assisted coding, you can move insanely fast.
- **Be practical.** Aim for something someone might actually use.  
- **Be clear.** During demo, explain what’s real, what’s stubbed, and why.  
- **Be original.** Reuse frameworks or APIs as needed, but the end product should feel like yours.

## Examples

Don't use these directly. 

- [OpenMet](https://www.openmetropolitan.com/) (made by a Fractal Tech engineer!)
- A code-review copilot that comments on pull requests using a model  
- A personal research assistant with RAG over your notes  
- A workflow orchestrator that turns natural language into cloud jobs  
- A multimodal tutor that reads diagrams and answers conceptual questions  
- A domain-specific chatbot (law, finance, music) with fine-tuned tone or behavior
- 
## Resources

Again, there's no state of the art here -- just a bunch of advice. You will need to do extensive research and experimentation yourself.

- **Agents:**
    - [Academic Overview of AI Agents](https://lilianweng.github.io/posts/2023-06-23-agent)
    - [Prompt Injection](https://simonwillison.net/series/prompt-injection)
    - [OpenAI AgentKit](https://platform.openai.com/docs/guides/agents#page-top)
    - [Langchain - Agent Framework](https://docs.langchain.com/)
    - [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- **AI-assisted coding:**  
    - [Dear Student: Yes, AI is here, you're screwed unless you take action](https://archive.is/MaGZ0)
    - [Just talk to it](https://steipete.me/posts/just-talk-to-it)
    - [Follow this advice](https://simonwillison.net/2025/Mar/11/using-llms-for-code/)
    - [This too](https://blog.fsck.com/2025/10/05/how-im-using-coding-agents-in-september-2025/)
    - [Vibe Engineering](https://simonwillison.net/2025/Oct/7/vibe-engineering/)
- **Embeddings & Retrieval-augmented generation:**
    - [Intro to Text Embeddings](https://stackoverflow.blog/2023/11/09/an-intuitive-introduction-to-text-embeddings/)
    - [OpenAI Embeddings Model](https://platform.openai.com/docs/guides/embeddings/what-are-embeddings?lang=node)
    - [Understanding Embeddings](https://labelbox.com/guides/ai-foundations-understanding-embeddings)
    - [Build Magical Semantic Search](https://blog.maximeheckel.com/posts/building-magical-ai-powered-semantic-search)
    - [What is RAG?](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/)
- **Evals and benchmarking:**
    - [LLM-based LLM evaluations](https://www.evidentlyai.com/llm-guide/llm-as-a-judge)
    - [PromptBench](https://github.com/microsoft/promptbench)
    - [How to build an LLM eval framework](https://www.confident-ai.com/blog/how-to-build-an-llm-evaluation-framework-from-scratch)
    - [Fine-tuning vs Prompting](https://arxiv.org/html/2505.24189v1)
