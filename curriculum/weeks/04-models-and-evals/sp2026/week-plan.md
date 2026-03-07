# Week 4: Models, Training, and Evals (Spring 2026)

## Philosophy

Three weeks of creative projects. You've been making decisions, pitching ideas, building products. This week is different. We're taking the creative burden off you completely.

This is a structured, tutorial-driven week. You are not a product person this week. You are a researcher. Technology for technology's sake. The goal: get your hands dirty with the parts of AI that live beneath the API call. Local inference, training, fine-tuning, evaluation. By the end of the week you'll have a hazy but real understanding that you can do all of this stuff, and a published technical blog post to prove it.

The theory won't be complete — that's fine. We'll give you resources to go deeper on every topic. What matters is that you've actually run these things, on your own hardware, and felt what it's like.

## Structure: Orientation, Then Exploration

Each day follows the same pattern:

1. **Morning: Orientation.** Structured tutorial with a steel thread you should be able to complete before lunch. This is the "just follow the steps" part.
2. **Afternoon: Exploration.** Take the steel thread further. Probe the parts you found interesting. Go deeper. Integrate it into a prior project. Push the hardware. Break things.

The steel thread is your safety net — everyone finishes it. The exploration is where you make it yours.

---

## Monday: Local and Small Models

**The point:** There's nothing like running a model on your own hardware. You get a feel for what inference actually is, what it costs, how fast it can be, and what's possible without an API key.

**Hook:** You're probably already using local inference today. SuperWhisper, the transcription app, runs a Whisper model locally on your laptop. Today you're going to build your own.

### Steel Thread

Build your own local transcription app. Get Whisper running locally, pipe in audio, get text out. Add keybindings so you can trigger it from anywhere on your machine. This is real, useful software that runs entirely on your hardware.

### Exploration Directions

- **Local text-to-text:** Run a small language model (Ollama) and compare it to frontier API models. How good is it? Where does it fall apart?
- **Local image generation:** Can your M-series Mac run a diffusion model? How long does an image take? What quality do you get?
- **Local image-to-text:** OCR, image description, visual question answering — all running locally.
- **Speech-to-speech:** Can you get a model that takes audio in and produces audio out? This is wild when it works.
- **Performance benchmarking:** How good of a result can you get on your hardware? What happens when you go to Modal and rent a real GPU — how much better does it get? If local inference is nearly as good as state-of-the-art for your use case, that's important to know.

### Key Concepts

- What is inference? What is a model? What is a runtime?
- Transformers at a high level — what are they actually doing?
- Hardware requirements per model type (text, image, audio)
- The frontier of local models is moving fast — models that needed a data center two years ago run on a laptop today

---

## Tuesday: Fine-Tuning

**The point:** You've used pre-trained models. Now learn what it means to adapt one. Fine-tuning is the bridge between "I'm using someone else's model" and "I have my own model."

### Steel Thread

Fine-tune a small language model on a custom dataset. Pick something specific — a writing style, a domain vocabulary, a task format. Use LoRA (Low-Rank Adaptation) so it's fast and cheap. Compare the fine-tuned model's output to the base model on the same prompts.

### Exploration Directions

- **LoRA vs. full fine-tuning:** What's the difference? When do you need each?
- **Dataset curation:** How does the quality and format of your training data affect the result?
- **Fine-tuning for different modalities:** Can you fine-tune an image model? An audio model?
- **Prompt engineering vs. fine-tuning:** When is each approach better? (There's a real paper on this — read it.)

### Key Concepts

- What fine-tuning actually changes in a model (weights, not architecture)
- LoRA and parameter-efficient methods
- Training data formats and preparation
- Overfitting — when your model memorizes instead of learns

---

## Wednesday: Training Your Own Model

**The point:** Fine-tuning adapts someone else's model. Training builds one from scratch. Even if you only train a tiny model, the experience of watching a loss curve go down is something every engineer working with AI should have.

### Steel Thread

Train a simple text transformer from scratch. It doesn't need to be good — it just needs to be yours. Watch the training loop, understand what's happening at each step, see the loss decrease, generate some (probably terrible) text from your model.

### Exploration Directions

- **Architecture choices:** How does changing the number of layers, attention heads, or embedding dimensions affect your model?
- **Training on different data:** What happens when you train on Shakespeare vs. code vs. chat logs?
- **Scaling laws:** How does performance change as you increase model size or training data? (Even at tiny scale, the patterns are visible.)
- **Cloud training:** Move to Modal with a real GPU. How much faster is training? How much bigger of a model can you train?

### Key Concepts

- The transformer architecture — attention, feedforward layers, embeddings
- Training loops: forward pass, loss calculation, backpropagation, optimizer step
- How to design a pipeline to iteratively improve a model over time
- The relationship between compute, data, and model quality

---

## Thursday: Evals

**The point:** You've built models, fine-tuned models, run models. How do you know if any of them are actually good? Evals are how you answer that question. And building your own eval is how you learn that most existing benchmarks are measuring the wrong thing.

### Steel Thread

Build an eval for one of the models you've worked with this week. Define what "good" means for your specific use case, write test cases, run them, score the results. It doesn't need to be a novel eval — just one that actually measures something you care about.

### Exploration Directions

- **LLM-as-judge:** Use a frontier model to evaluate your smaller model's outputs. When does this work? When does it fail?
- **Custom benchmarks:** BullshitBench was interesting because it measured something existing evals didn't capture (how much models bullshit you). What's something YOU think current evals miss? Can you build a bench for it?
- **Comparative evals:** Run the same eval across multiple models (your fine-tuned model, the base model, a frontier API model). Visualize the results.
- **Eval design:** What makes a good eval? What are the failure modes? (Goodhart's Law: when a measure becomes a target, it ceases to be a good measure.)

### Key Concepts

- Why evals matter: you can't improve what you can't measure
- Types of evals: automated metrics, human evaluation, LLM-as-judge
- Eval design: choosing what to measure, avoiding Goodhart's Law
- The difference between benchmarks (standardized) and evals (custom to your use case)

---

## Friday: Write and Publish

**The point:** You've spent four days doing real technical work. Now write about it. The goal is a technical blog post that explains what you built or fine-tuned, what you used it for, and the performance you got.

### Requirements

- **Audience:** Non-technical. Your post should be understandable by someone who doesn't write code. This is a skill — the point of the writing is communication, not showing off.
- **Tone:** Honest and playful and fun. "I don't really understand what I'm doing here" is a perfectly valid thing to write. Don't pretend to be an expert. Be a curious person who tried something and is reporting back.
- **Content:** Here's something I built (or fine-tuned). Here is what I used it to do. Here is the performance I got. Here is what surprised me.
- **Include your eval results.** Show the numbers. Show the comparison. Be honest about what's good and what isn't.
- **Interactive element (stretch goal):** Can your blog post include something interactive? A live demo, an embedded model, a widget that lets readers play with your results? Software enhancing the essay.

### What Good Looks Like

You're not writing a paper. You're not writing a tutorial. You're writing a story about something you tried. The best technical blog posts read like dispatches from the frontier — "I went out there, here's what I found, here's what I think it means."

---

## Saturday: Conference Day

No demos this week. Instead, we're running it like a research conference.

### Format

1. **Morning:** Final polish on blog posts. Publish them.
2. **Peer review:** Each person reviews 3 other people's blog posts. We'll provide a rubric or feedback framework, but the core question is simple: "Did I understand this? Was anything confusing? What was the most interesting part?"
3. **Presentations:** Present your findings in a short talk. This is not a product demo — it's a conference talk. What did you learn? What surprised you? What would you do differently?

### Feedback Focus

- **Clarity of writing** — could a non-technical person follow this?
- **Honesty** — does the author acknowledge what they don't understand?
- **Interesting angle** — did they find something unique to say about their experience?
- Give direct, specific feedback. "I didn't understand this paragraph" is more useful than "great job."

---

## Resources

*To be filled in with specific tutorials, papers, and tools for each day's steel thread.*

### General

- [Hugging Face](https://huggingface.co/) — model hub, datasets, tutorials
- [Ollama](https://ollama.ai/) — run models locally with one command
- [Modal](https://modal.com/) — cloud GPU compute (students get free credits)

### Monday (Local Models)

- [OpenAI Whisper](https://github.com/openai/whisper) — local transcription
- [SuperWhisper](https://superwhisper.com/) — what you're building a clone of

### Tuesday (Fine-Tuning)

- [LoRA paper](https://arxiv.org/abs/2106.09685)
- [Fine-tuning vs Prompting](https://arxiv.org/html/2505.24189v1)
- Hugging Face PEFT library

### Wednesday (Training)

- [Andrej Karpathy's "Let's build GPT"](https://www.youtube.com/watch?v=kCc8FmEb1nY)
- nanoGPT

### Thursday (Evals)

- [How to build an LLM eval framework](https://www.confident-ai.com/blog/how-to-build-an-llm-evaluation-framework-from-scratch)
- [LLM-as-judge](https://www.evidentlyai.com/llm-guide/llm-as-a-judge)
