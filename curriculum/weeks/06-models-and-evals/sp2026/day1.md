# Using Non-Frontier Models and Models Beyond Claude


## NOTES FOR THIS ASSIGNMENT:

This assignment is an experimental attempt at a Claude Code-first approach to guided education.

I expect you to use Claude Code to work through and learn this material, and have designed it accordingly.
But some notes so you can know what you should be learning:
1. There is a LOT of material. More than you could do in a day without AI. Become Cyborg and give us feedback.
2. You should be able to read and understand all code examples. If you cannot, come up with a learning plan with Claude.
3. There may be mistakes. The assignment was made by taking a long meeting transcript discussing scope and sequence of this unit and augmenting it with Claude. APIs change, models change, services change. We might have an old or outdate understanding, or Claude might have shipped mistakes we didn't catch. BUT, the gist/thrust of each section is correct, and I've reviewed it for general philosophical accuracy. If you find a mistake, please issue a pull request against main, your Claude can do so.

---

## Why This Matters

Students who have only used frontier API models (Claude, GPT-4o, Gemini Pro) are missing a massive part of the practical AI engineering landscape. Here is why every developer needs fluency with smaller, open-source, and specialized models:

### Cost

Frontier API calls cost $3-15+ per million input tokens. A Qwen3 0.6B model running locally costs nothing per inference after the one-time hardware investment. Even hosted open-source models via Together AI or Groq cost 10-100x less than frontier APIs. For applications with high throughput -- batch processing, embedding pipelines, classification at scale -- frontier models are economically impractical.

### Latency

A quantized 7B model running on a local GPU returns responses in under 100ms. Groq's custom LPU hardware delivers first-token latency of ~130ms. Compare this to 500ms-2s typical for frontier API round-trips. For real-time applications (autocomplete, live transcription, interactive agents), local inference is the only viable option.

### Privacy and Compliance

Many industries (healthcare, finance, legal, government) cannot send data to third-party APIs. Local inference means data never leaves the machine. This is not a theoretical concern -- it is a hard legal requirement in many jurisdictions (GDPR, HIPAA, SOC 2).

### Customization

Open-weight models can be fine-tuned on proprietary data. You can teach a 7B model your company's coding style, your domain's terminology, or your product's documentation. Frontier APIs offer limited fine-tuning, and you never own the resulting weights.

### Offline and Edge Deployment

Mobile apps, IoT devices, air-gapped environments, and field operations need models that work without internet. Quantized models run on phones, Raspberry Pis, and laptops.

### Specialized Tasks

Many tasks do not need a 400B-parameter general-purpose model. Embedding generation, text classification, named entity recognition, speech-to-text, code completion -- these are all better served by purpose-built smaller models that are faster and cheaper.

### The Strategic Argument

Relying solely on one provider creates vendor lock-in. API pricing changes, rate limits, model deprecations, and service outages are all real risks. Engineers who can evaluate and deploy alternatives have a significant career advantage and provide resilience to the organizations they work for.

---

## Prerequisites

Students should have:

- **Python proficiency** -- comfortable with pip/uv, virtual environments, async/await
- **Experience using LLM APIs** -- have built at least one application using Claude, GPT, or similar via API calls
- **Basic understanding of what a language model does** -- tokens, context windows, temperature, system prompts
- **Command-line comfort** -- navigating terminals, running servers, reading logs
- **Git basics** -- cloning repos, managing branches

Ask your local Claude Code if you're missing any pre-requisite knowledge, and maybe build a little interactive tutorial to learn.

---

## Part 1: The Open Model Ecosystem

#### The Hugging Face Hub

The Hub is the central registry for open-source models, datasets, and ML applications. Students should understand:

- **Navigating the Hub** -- searching by task (text-generation, text-classification, image-to-text), filtering by library (transformers, GGUF, diffusers), sorting by downloads/likes
- **Model cards** -- reading them to understand training data, intended use, limitations, license terms
- **Licensing landscape** -- Apache 2.0 (truly open, commercial use), Llama License (open weights with restrictions), MIT, custom licenses. This matters for production decisions.
- **The Open LLM Leaderboard** -- how to interpret benchmark scores (MMLU, HumanEval, GSM8K, MT-Bench) and why no single benchmark tells the whole story
- **Model formats** -- safetensors (standard HF format), GGUF (quantized for llama.cpp/Ollama), GPTQ, AWQ

#### Key Model Families to Know

| Family | Creator | Key Sizes | Strengths | License |
|--------|---------|-----------|-----------|---------|
| **Llama 3.3 / 4** | Meta | 8B, 70B, 405B, Scout, Maverick | General purpose, huge community, massive fine-tune ecosystem | Llama License |
| **Qwen 2.5 / 3** | Alibaba | 0.5B to 235B (MoE) | Multilingual, strong reasoning, coding, most-downloaded base model for fine-tuning | Apache 2.0 |
| **DeepSeek V3 / R1** | DeepSeek | 7B distills up to 671B MoE | Reasoning (R1), coding, efficiency; R1 was the "Sputnik moment" for open models | MIT (R1), custom (V3) |
| **Mistral / Mistral Small 3** | Mistral AI | 7B, 24B, Codestral 22B, Large 3 (MoE 675B) | Speed, efficiency, coding (Codestral), MoE pioneer | Apache 2.0 (Small) |
| **Gemma 2 / 3** | Google | 2B, 9B, 27B | Efficient on consumer GPUs, strong math, runs on-device | Gemma License |
| **Phi-4** | Microsoft | 14B, 16B | Punches way above weight class on reasoning; designed for efficiency | MIT |
| **Stable Diffusion (SDXL, SD3)** | Stability AI | Various | Image generation, open weights, massive community tooling | Various |
| **Whisper** | OpenAI | Tiny to Large V3 Turbo | Speech-to-text, 99+ languages, the gold standard for open STT | MIT |
https://huggingface.co/moonshotai/Kimi-K2.5

#### Specialized Model Categories

- **Code models:** Qwen3-Coder, Qwen2.5-Coder, DeepSeek-Coder V2, Codestral, StarCoder2
- **Embedding models:** Nomic Embed Text V2 (MoE, 305M active params), all-mpnet-base-v2, Qwen3-Embedding, BGE series
- **Vision models:** LLaVA, InternVL, Qwen-VL, PaliGemma
- **Audio models:** Whisper Large V3 Turbo, SeamlessM4T, WhisperSpeech (TTS)
- **Reranking models:** Qwen3-Reranker, BGE-Reranker, Cohere Rerank (open weights)
- There are many other model categories -- as many as there are data types. What are some model categories you might care about?

## Part 2: Local Inference -- Getting Models Running

#### Ollama (Start Here)

Ollama is the easiest on-ramp to local inference. It is a runtime that downloads, manages, and serves models with a single command.

```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Explore ollama
ollama help

# Pull and run a model
ollama pull llama3.2:3b
ollama run llama3.2:3b

# Use the OpenAI-compatible API
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

Key points:
- Ollama exposes an OpenAI-compatible API -- existing code using the OpenAI SDK can point to `localhost:11434` with minimal changes
- Model library at `ollama.com/library` -- browse available models and tags (quantization levels)
- Understanding tags: `llama3.2:3b-instruct-q4_K_M` means 3B params, instruct-tuned, Q4_K_M quantization
- Modelfiles for customization (system prompts, parameters, template overrides)

#### llama.cpp

The foundational C/C++ inference engine. Students should understand its role even if they primarily use Ollama (which wraps llama.cpp internally).

```bash
# Build from source
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp && make -j

# Run a GGUF model
./llama-cli -m model.gguf -p "Explain recursion" -n 256

# Start an OpenAI-compatible server
./llama-server -m model.gguf --port 8080
```

Key teaching points:
- Why GGUF exists -- a portable binary format for quantized models
- CPU vs GPU offloading (`-ngl` flag to offload layers to GPU)
- No Python dependency -- runs anywhere C compiles
- Performance tuning: context size, batch size, thread count


#### A brief note on python:

Use UV (claude please fill out this section about uv, how to install it, why it is is useful, what it mainly does, in the style of the rest of the document, as a useful tutorial that isn't too long, and what workhorse version of python3 to use as a sensible default for AI tasks.)

#### Hugging Face Transformers (Python)

For when you need programmatic control, pipeline composition, or access to the full model ecosystem.

```python
from transformers import pipeline

# High-level pipeline API
classifier = pipeline("sentiment-analysis")
result = classifier("I love open source models!")

# Text generation
generator = pipeline(
    "text-generation",
    model="microsoft/Phi-4",
    device_map="auto"  # auto GPU placement
)
output = generator("def fibonacci(n):", max_new_tokens=100)

# Embeddings with sentence-transformers
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5")
embeddings = model.encode(["Hello world", "Open source AI"])
```

Key teaching points:
- `pipeline()` for quick experimentation across 30+ task types
- `AutoModel` / `AutoTokenizer` for fine-grained control
- `device_map="auto"` for automatic GPU/CPU split on large models
- The `sentence_transformers` library for embedding workflows
- `bitsandbytes` for on-the-fly quantization (load a 70B model in 4-bit on a single GPU)

#### vLLM (Production Serving)

For when you need to serve models to multiple users with high throughput.

```bash
uv install vllm
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 2 \
  --max-model-len 8192
```

Key teaching points:
- PagedAttention -- why it matters (50%+ memory savings, 2-4x throughput for concurrent requests)
- Continuous batching vs naive batching
- When to use vLLM vs Ollama: vLLM for multi-user production, Ollama for single-user development
- OpenAI-compatible API endpoint out of the box

## Part 3: Quantization:

Quantization is the technique that makes large models usable on consumer hardware. Students must understand this deeply.

#### Core Concepts

- **What quantization does:** Reduces weight precision from FP16 (16 bits per parameter) to lower bit-widths (8, 4, 3, 2 bits), shrinking model size 2-4x
- **The tradeoff:** Lower precision = smaller model and faster inference, but some quality loss
- **Quality tiers in practice:**
  - Q8 (8-bit): Nearly indistinguishable from full precision
  - Q5_K_M / Q6_K: Good balance of quality and size -- recommended default
  - Q4_K_M (4-bit): The sweet spot for most local deployments
  - Q3 and below: Noticeable quality degradation, only for extreme memory constraints

#### Quantization Methods Compared

| Method | Format | Best For | Key Property |
|--------|--------|----------|--------------|
| **GGUF** | File format | CPU + GPU mixed inference (Ollama, llama.cpp) | Portable, no framework dependency |
| **GPTQ** | PyTorch | GPU-only inference, highest throughput | Uses second-order info for calibration |
| **AWQ** | PyTorch | GPU inference, preserves creative/coherent output | Activation-aware, protects important weights |
| **bitsandbytes** | In-memory | Quick experimentation in Python | On-the-fly quantization, no pre-processing |

#### Hands-On Exercise

Download the same model in FP16 and Q4_K_M, run identical prompts, compare:
- File size difference
- Tokens per second
- Output quality on a standardized prompt set
- Memory usage (VRAM / RAM)

## Part 4: Hosted Open-Source Model APIs

Not everyone has GPU hardware. These platforms let you call open-source models via API at a fraction of frontier costs.

| Platform | What It Does | Key Feature |
|----------|-------------|-------------|
| **Together AI** | Hosts open models, fine-tuning | Dedicated deployments, fine-tuning pipeline |
| **Groq** | Ultra-fast inference on custom LPU hardware | ~130ms first-token latency, fastest available |
| **Replicate** | Run any model via API, pay per second | Supports custom models, serverless GPUs |
| **OpenRouter** | Unified API gateway to 100+ models across providers | Single API key, automatic failover, price comparison |
| **Hugging Face Inference Endpoints** | Deploy any HF model as a dedicated API | Autoscaling, custom containers |
| **Fireworks AI** | High-performance model hosting | Fast inference, function calling support |
| **Modal** | Serverless GPU platform, run any model with your own inference code | Scale-to-zero (pay nothing when idle), sub-second cold starts, H100/H200 access, $30/mo free credits |

#### Teaching the Decision Framework

```
Need a quick prototype?         --> Ollama locally or Groq API
Need production serving?        --> vLLM self-hosted, Together AI, or Modal
Need to try many models?        --> OpenRouter (unified API)
Need fine-tuning?               --> Together AI or Hugging Face
Need absolute lowest latency?   --> Groq or self-hosted on GPU
Need absolute lowest cost?      --> Self-hosted with Ollama/vLLM
Need serverless GPU (no idle $) --> Modal (scale-to-zero, bring your own model)
Need privacy/compliance?        --> Self-hosted only
```

#### Understanding the Spectrum: Managed vs. Serverless vs. Self-Hosted

These platforms sit on a spectrum of control vs. convenience:

```
Most convenient, least control   -->  Together AI / Groq / Fireworks (fully managed)
Serverless, you control the code -->  Modal (you pick model + engine, they handle infra)
Most control, most ops work      -->  Self-hosted vLLM on your own GPU box. Honestly, just use Modal most of the time.
```

Modal is especially good for non-standard GPU tasks: you write Python that defines your container, model, and inference engine (vLLM, SGLang, etc.), and Modal handles GPU provisioning, scaling, and billing. You get the control of self-hosting without the ops burden.

#### Hands-On: Three-Way Inference Comparison (Local vs. Modal vs. Groq)

This exercise has students run the same model three different ways -- locally with Ollama, self-hosted in the cloud with Modal, and via a managed inference provider (Groq) -- then directly compare speed, latency, and cost.

We use **Llama 3.1 8B Instruct** because it is available on all three platforms.

**Step 1: Run Llama 3.1 8B locally with Ollama**

```bash
# Pull the model
ollama pull llama3.1:8b

# Verify it runs
ollama run llama3.1:8b "Explain what a hash table is in 3 sentences."
```

**Step 2: Deploy Llama 3.1 8B on Modal with vLLM**

Install Modal and authenticate:

```bash
pip install modal
modal setup  # follow the browser auth flow
```

**Important: Llama 3.1 is a gated model.** Before deploying, you need to:

1. Go to [meta-llama/Llama-3.1-8B-Instruct on Hugging Face](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct) and accept Meta's license agreement
2. Create a [Hugging Face access token](https://huggingface.co/settings/tokens)
3. Store it as a Modal secret:

```bash
modal secret create HUGGINGFACE HF_TOKEN=hf_your_token_here
```

Create `modal_llama.py`:

```python
import modal
import subprocess

# Define the container image with vLLM and dependencies
# NOTE: vLLM requires CUDA, so we use an NVIDIA base image instead of debian_slim
image = (
    modal.Image.from_registry("nvidia/cuda:12.8.0-devel-ubuntu22.04", add_python="3.12")
    .entrypoint([])
    .pip_install(
        "vllm==0.13.0",
        "huggingface_hub[hf_transfer]",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
)

app = modal.App("llama-inference", image=image)

MODEL_NAME = "meta-llama/Llama-3.1-8B-Instruct"

# Persistent volume to cache model weights across cold starts
volume = modal.Volume.from_name("model-cache", create_if_missing=True)

@app.function(
    gpu="A10G",  # 24GB VRAM, plenty for an 8B model
    volumes={"/models": volume},
    timeout=600,
    secrets=[modal.Secret.from_name("HUGGINGFACE")],
)
@modal.web_server(port=8000, startup_timeout=600)
def serve():
    """Spawn a vLLM server serving Llama 3.1 8B."""
    cmd = [
        "python", "-m", "vllm.entrypoints.openai.api_server",
        "--model", MODEL_NAME,
        "--download-dir", "/models",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--max-model-len", "8192",
    ]
    subprocess.Popen(cmd)
```

Deploy it:

```bash
modal deploy modal_llama.py
# Modal prints a URL like: https://your-user--llama-inference-serve.modal.run
# First deploy takes several minutes (building the container image + downloading model weights)
```

**Step 3: Get a Groq API key**

Sign up at [console.groq.com](https://console.groq.com). The free tier gives generous rate limits. Set your key:

```bash
export GROQ_API_KEY="gsk_..."
```

**Step 4: Write a three-way benchmark script**

Create `benchmark.py`:

```python
import os
import time
import openai

PROMPT = "Explain what a hash table is, how it handles collisions, and give a Python example."

def benchmark(client, model_name, label):
    """Time a single completion and measure tokens/second."""
    start = time.time()
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": PROMPT}],
        max_tokens=512,
    )
    elapsed = time.time() - start
    output = response.choices[0].message.content
    tokens = response.usage.completion_tokens
    tps = tokens / elapsed if elapsed > 0 else 0

    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    print(f"  Tokens generated:  {tokens}")
    print(f"  Total time:        {elapsed:.2f}s")
    print(f"  Tokens/sec:        {tps:.1f}")
    print(f"  First 100 chars:   {output[:100]}...")
    return {"label": label, "tokens": tokens, "time": elapsed, "tps": tps}

results = []

# --- 1. Local (Ollama) ---
local_client = openai.OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
)
results.append(benchmark(local_client, "llama3.1:8b", "LOCAL (Ollama on your machine)"))

# --- 2. Self-hosted cloud (Modal + vLLM) ---
MODAL_URL = "https://your-user--llama-inference-serve.modal.run/v1"  # <-- paste your URL
modal_client = openai.OpenAI(
    base_url=MODAL_URL,
    api_key="not-needed",
)
results.append(benchmark(modal_client, "meta-llama/Llama-3.1-8B-Instruct", "MODAL (your vLLM on A10G GPU)"))

# --- 3. Managed provider (Groq) ---
groq_client = openai.OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ["GROQ_API_KEY"],
)
results.append(benchmark(groq_client, "llama-3.1-8b-instant", "GROQ (managed inference provider)"))

# --- Comparison table ---
print(f"\n{'='*60}")
print(f"  THREE-WAY COMPARISON")
print(f"{'='*60}")
for r in results:
    print(f"  {r['label']:<40} {r['tps']:>8.1f} tok/s  {r['time']:>6.2f}s total")

fastest = max(results, key=lambda r: r["tps"])
slowest = min(results, key=lambda r: r["tps"])
print(f"\n  Fastest: {fastest['label']}")
print(f"  {fastest['tps'] / slowest['tps']:.1f}x faster than {slowest['label']}")
```

Run it:

```bash
python benchmark.py
```

**What students should observe:**

- **Groq will likely be the fastest by a wide margin** -- often 400-600+ tokens/sec for an 8B model. This is the whole point of a managed inference provider: they have invested millions in custom hardware and optimized serving stacks so you do not have to.
- **Modal will be faster than local** for generation throughput (datacenter A10G GPU vs your laptop), but the first request may be slow due to cold start.
- **Local (Ollama) will have the lowest latency for short prompts** because there is no network round-trip, but lower throughput (tokens/sec) than the cloud options.
- **All three use the exact same OpenAI-compatible API.** Switching providers is just changing `base_url` and `model`. This is the power of the OpenAI API as a de facto standard.

#### Why Are Inference Providers So Fast?

Students will see Groq producing 500+ tokens/sec and wonder how. This is a good teaching moment:

**Custom hardware.** Groq built their own chip (the LPU -- Language Processing Unit) from scratch, optimized specifically for the sequential token generation that LLMs need. Traditional GPUs (NVIDIA) are designed for parallel matrix math, which is great for training but suboptimal for the autoregressive decode loop where you generate one token at a time. Groq's architecture eliminates the memory bandwidth bottleneck that slows down GPU inference.

**Optimized serving software.** Even GPU-based providers (Together AI, Fireworks) are significantly faster than naive self-hosting because they run heavily optimized inference engines with:
- **Continuous batching** -- instead of waiting for one request to finish before starting another, they interleave tokens from multiple requests, keeping the GPU saturated
- **PagedAttention** -- manages KV-cache memory like an OS manages virtual memory, eliminating waste from reserved-but-unused context window space
- **Speculative decoding** -- uses a small draft model to predict multiple tokens ahead, then verifies them in a single pass through the large model
- **Quantization and kernel fusion** -- custom CUDA kernels that combine multiple operations into single GPU calls, reducing memory round-trips
- **Prefill/decode disaggregation** -- separating the compute-heavy prompt processing from the memory-bound token generation onto different hardware

**The tradeoff:** You give up control (their model menu, their quantization choices, their rate limits) in exchange for speed and simplicity. If Groq deprecates a model or changes pricing, you are stuck. If you self-host on Modal, you control everything but manage more complexity.

#### Cost Comparison

| Approach | Llama 3.1 8B, 1M output tokens | You pay for idle time? | You control the model? |
|----------|-------------------------------|----------------------|----------------------|
| **Local (Ollama)** | $0 (after hardware) | No (it is your machine) | Yes |
| **Modal (vLLM on A10G)** | ~$0.50-1.00 in GPU-seconds | No (scale-to-zero) | Yes |
| **Groq** | ~$0.05 (per-token pricing) | No (pay per token) | No (their menu only) |
| **Dedicated GPU rental** | ~$0.80/hr whether you use it or not | Yes | Yes |

The paradox: Groq is both the fastest AND the cheapest per token for supported models, because their custom hardware is that much more efficient. The tradeoff is lock-in and limited model selection.

#### The Endgame: Hard-Wiring a Model Into a Custom Chip

There is a fourth level beyond Groq. What if you took a specific model -- say, Llama 3.1 8B -- and burned its weights directly into a custom silicon chip?

This is what [Taalas](https://taalas.com/the-path-to-ubiquitous-ai/) is doing. Their approach represents the logical extreme of the flexibility-vs-performance tradeoff that runs through this entire module.

**How it works:**

On a normal GPU, inference looks like this: weights are stored in memory (VRAM), the processor reads them into compute cores, does math, writes results back. The bottleneck is **memory bandwidth** -- the speed at which you can shuttle weights between storage and compute, because the weights are SO BIG. This is why NVIDIA keeps building faster HBM (High Bandwidth Memory) and why Groq designed a custom chip with a different memory architecture.

Taalas eliminates the problem entirely. They merge storage and compute onto a single chip at DRAM-level density. The model's weights are not "loaded" at runtime -- they are part of the chip's physical structure. There is no memory bus to bottleneck. The chip IS the model. Ask your claude code about any of these concepts if confused!

Think of it like this:

```
GPU (NVIDIA H100):      General-purpose processor + separate memory holding weights
                        Bottleneck: memory bandwidth (moving weights to compute)

Groq LPU:               Custom processor with redesigned memory architecture
                        Bottleneck: reduced but still exists

Taalas ASIC:             Weights ARE the chip. No loading. No memory bus.
                        Bottleneck: basically just physics (speed of electricity)
```

**Performance (Llama 3.1 8B on Taalas HC1):**

| Metric | Taalas ASIC | vs. GPU inference |
|--------|-------------|-------------------|
| Throughput | ~17,000 tokens/sec per user | ~10x faster |
| Chip cost | Baseline | ~20x cheaper to build |
| Power consumption | Baseline | ~10x lower |

And because there is no HBM, no advanced 3D packaging, no liquid cooling, and no high-speed I/O required, the chips are dramatically simpler and cheaper to manufacture than datacenter GPUs.

**What you give up:**

This is the critical tradeoff to teach. A Taalas chip running Llama 8B can ONLY run Llama 8B. You cannot update the weights. You cannot swap in a different model. If Meta releases Llama 4 and it is better, your chip is now a paperweight (for that purpose). Fabricating a new chip takes ~2 months.

The first-generation chip uses aggressive 3-bit quantization (not standard formats), which introduces some quality degradation compared to GPU inference. Their second-generation platform (HC2) moves to standard 4-bit floating-point to address this.

You DO retain some flexibility: configurable context window sizes and support for LoRA adapters (lightweight fine-tuning layers on top of the frozen base weights). But fundamentally, this is a bet that one specific model is good enough for your use case forever (or at least for the chip's lifecycle).

**The full spectrum, updated:**

| Approach | Flexibility | Speed | Cost | Who controls it |
|----------|------------|-------|------|----------------|
| **Ollama on your laptop** | Run any model anytime | Slowest | Free (after hardware) | You |
| **Modal (vLLM on cloud GPU)** | Any HF model, any engine | Fast | Pay per GPU-second | You |
| **Groq (custom LPU)** | Their model menu only | Very fast (500+ tok/s) | Pay per token, cheap | Groq |
| **Taalas (model-specific ASIC)** | ONE model, forever | Fastest (~17K tok/s) | Cheapest per token | The chip |

**Why this matters for the curriculum:**

This is the same tradeoff pattern students have seen throughout the module, taken to its logical conclusion: *the more you specialize, the faster and cheaper you get, but the less flexible you become.* Quantization trades precision for speed. Groq trades GPU-based hardware flexibility for LPU-based inference throughput. Taalas trades ALL flexibility for maximum performance.

The engineering skill is knowing where on this spectrum your application belongs, and at what stages!

## Part 5: Model Routing and Selection Strategy

#### When to Use What

The goal is not "always use the biggest model" but "use the right model for the right task."

Here are some examples, but don't bother memorizing anything in here, because it changes all the time.
The point is that different models are literally suited to different tasks becaused they are trained on task-specific data:

| Task | Recommended Approach | Why |
|------|---------------------|-----|
| Simple classification (spam, sentiment) | Fine-tuned small model (Phi-4, Qwen 0.5B) or even a non-LLM classifier | Overkill to use a 70B model for binary classification |
| Embedding / semantic search | Dedicated embedding model (Nomic, BGE) | Purpose-built, 100x cheaper than using an LLM |
| Code completion in IDE | Qwen2.5-Coder 7B or Codestral locally | Needs <100ms latency, runs continuously |
| Complex reasoning / analysis | Frontier model (Claude, GPT-4o) or DeepSeek R1 | Still a meaningful quality gap for hard problems |
| Document summarization at scale | Qwen3 7B or Llama 3.2 3B | Good enough quality, 100x cheaper at volume |
| Speech-to-text | Whisper Large V3 Turbo | Dedicated STT model, no LLM needed |
| Image generation | Stable Diffusion XL / SD3 locally or via Replicate | Open models match frontier quality for most use cases |
| RAG retrieval | Embedding model + reranker, LLM only for generation | Decompose the pipeline; each component can be a different model |

#### Model Routing in Practice

Routing is just calling different models from different parts of your code. There is no magic framework needed -- it is if/else statements and multiple OpenAI client instances. Every provider exposes an OpenAI-compatible API, so you already know the interface.

Here are three approaches, ordered from most common to most sophisticated.

##### Approach 1: Application-Layer Routing (Most Common)

Your application already knows what kind of work it is doing because of which endpoint or feature the request came from. No runtime classification needed -- the routing decision is made at design time, by you.

This is how most production systems work. You don't look at the user's message and try to guess what model to use. You already know because of the context.

```python
import os
import openai
from sentence_transformers import SentenceTransformer

# Set up clients for each provider. Every provider speaks the OpenAI protocol,
# so you just change the base_url and api_key.
groq = openai.OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ["GROQ_API_KEY"],
)
together = openai.OpenAI(
    base_url="https://api.together.xyz/v1",
    api_key=os.environ["TOGETHER_API_KEY"],
)
anthropic_client = openai.OpenAI(
    base_url="https://api.anthropic.com/v1/",
    api_key=os.environ["ANTHROPIC_API_KEY"],
)
ollama = openai.OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
)

# Each feature in your app uses the model that makes sense for it.

def handle_code_review(diff: str) -> str:
    """Code review endpoint -- always uses a code-specialized model."""
    response = together.chat.completions.create(
        model="Qwen/Qwen2.5-Coder-32B-Instruct",
        messages=[
            {"role": "system", "content": "Review this diff for bugs and style issues."},
            {"role": "user", "content": diff},
        ],
    )
    return response.choices[0].message.content

def handle_quick_summary(text: str) -> str:
    """Summarization endpoint -- small fast model, good enough for this task."""
    response = groq.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "Summarize this text in 2-3 sentences."},
            {"role": "user", "content": text},
        ],
    )
    return response.choices[0].message.content

def handle_complex_analysis(question: str, context: str) -> str:
    """Deep analysis endpoint -- needs frontier-level reasoning."""
    response = anthropic_client.chat.completions.create(
        model="claude-sonnet-4-20250514",
        messages=[
            {"role": "system", "content": "Analyze this in depth."},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {question}"},
        ],
    )
    return response.choices[0].message.content

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Embedding endpoint -- dedicated embedding model, not an LLM at all."""
    model = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5")
    return model.encode(texts).tolist()
```

The key insight: there is no magic router here. The engineer who built the app decided which model each feature uses. This is the most important routing skill -- knowing which model fits which task.

##### Approach 2: Classifier-Based Routing (For Chat/General Interfaces)

When you have a single input (like a chat interface) and need to decide at runtime which model to call, you use a small fast model as the classifier. The classifier's only job is to categorize the query, not to answer it.

```python
import os
import openai

# Cheap fast model for classification AND for simple queries
groq = openai.OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ["GROQ_API_KEY"],
)
# Code specialist
together = openai.OpenAI(
    base_url="https://api.together.xyz/v1",
    api_key=os.environ["TOGETHER_API_KEY"],
)
# Frontier model for hard problems
anthropic_client = openai.OpenAI(
    base_url="https://api.anthropic.com/v1/",
    api_key=os.environ["ANTHROPIC_API_KEY"],
)

ROUTER_PROMPT = """Classify this user query into exactly one category.
Reply with ONLY the category name, nothing else.

Categories:
- SIMPLE: factual questions, definitions, quick lookups, casual conversation
- CODE: writing, reviewing, or debugging code
- COMPLEX: multi-step reasoning, analysis, planning, creative writing

Query: {query}

Category:"""

def classify_query(query: str) -> str:
    """Use a small fast model to classify query complexity."""
    response = groq.chat.completions.create(
        model="llama-3.1-8b-instant",  # fast and cheap -- just classifying
        messages=[{"role": "user", "content": ROUTER_PROMPT.format(query=query)}],
        max_tokens=10,
    )
    return response.choices[0].message.content.strip().upper()

# Map categories to (client, model) pairs
ROUTES = {
    "SIMPLE": (groq, "llama-3.1-8b-instant"),
    "CODE":   (together, "Qwen/Qwen2.5-Coder-32B-Instruct"),
    "COMPLEX": (anthropic_client, "claude-sonnet-4-20250514"),
}

def route_and_respond(query: str) -> str:
    """Classify the query, then route to the appropriate model."""
    category = classify_query(query)
    client, model = ROUTES.get(category, ROUTES["COMPLEX"])  # default to strong model

    print(f"  Classified as: {category} -> {model}")

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": query}],
    )
    return response.choices[0].message.content
```

The cost math: the classifier call costs almost nothing (small model, ~10 output tokens). If it routes 70% of queries to the cheap model instead of the frontier model, you save ~90% on those queries. Even if the classifier is wrong 10% of the time, the aggregate savings are massive.

In practice, most teams start with Approach 1 (application-layer routing) and only move to Approach 2 when they have a general-purpose chat interface with high volume. It's a lot of work to maintain your classifier infra.

## Part 6: Building Complete Pipelines

#### Composing Multiple Models

Real-world AI applications rarely use a single model. Teach students to build pipelines:

1. **RAG Pipeline:** Embedding model (Nomic) --> Vector store (ChromaDB/pgvector) --> Reranker (BGE-Reranker) --> Generator (Qwen3 7B)
2. **Content Processing:** Whisper (audio to text) --> Summarizer (Phi-4) --> Classifier (fine-tuned small model) --> Embedder (Nomic)
3. **Code Assistant:** Router (classify intent) --> Code model (Qwen2.5-Coder) for generation, small model for explanation, frontier model for architecture decisions


---

## Project: Build Your Own Voice-to-Text App (Like SuperWhisper)

Apps like [SuperWhisper](https://superwhisper.com/) and [Wispr Flow](https://wisprflow.com/) charge $10-20/month to do something you can build yourself in a day with open-source tools: hold a key, speak, release the key, and your words appear wherever your cursor is. No cloud, no subscription, completely private.

This project has you build exactly that.

### What You're Building

A push-to-talk dictation app that:
1. **Listens for a hotkey** (e.g., holding the right Option key)
2. **Records audio** while the key is held
3. **Transcribes locally** using whisper.cpp when the key is released
4. **Pastes the text** wherever your cursor is (any app, any text field)
5. **Stores a history** of all transcriptions so you can search/review them later

### The Building Blocks

**Audio recording -- sox/rec:**

```bash
brew install sox

# Record to a wav file (16kHz mono -- what Whisper expects)
rec recording.wav rate 16k channels 1
# Press Ctrl+C to stop, or kill the process from your app
```

**Transcription -- whisper.cpp:**

```bash
brew install whisper-cpp

# Download the model (~140MB, English-only, good speed/quality balance)
curl -L -o /opt/homebrew/share/whisper-cpp/ggml-small.en.bin \
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin"

# Transcribe a wav file
whisper-cli -m /opt/homebrew/share/whisper-cpp/ggml-small.en.bin \
    -f recording.wav --no-timestamps -nt
```

That's it. The output is plain text on stdout. The `--no-timestamps` and `-nt` flags strip the `[00:00.000 --> 00:05.000]` markers.

**Paste wherever the cursor is -- pbcopy + AppleScript:**

```bash
# Copy text to clipboard
echo "transcribed text here" | pbcopy

# Simulate Cmd+V to paste wherever the cursor is
osascript -e 'tell application "System Events" to keystroke "v" using command down'
```

This two-step approach (clipboard + simulated paste) works in any app -- VS Code, Slack, browser, Notes, anything.

**Store history -- append to a daily markdown file:**

```bash
HISTORY_DIR="$HOME/.voice-history"
mkdir -p "$HISTORY_DIR"
TODAY="$HISTORY_DIR/$(date +%Y-%m-%d).md"

# Append each transcription with a timestamp
echo -e "\n## $(date +%H:%M:%S)\n$TRANSCRIPTION" >> "$TODAY"
```

### Implementation Options

Pick your level. All three options use the same building blocks above (sox, whisper-cli, pbcopy, osascript). The difference is what you wrap them in.

**Option A: Bash script (simplest, start here)**

A single shell script that listens for a hotkey, records, transcribes, and pastes. Use `cliclick` (brew install) or a simple key-listener utility to detect the hotkey. Start `rec` on key-down, kill it on key-up, pipe through `whisper-cli`, `pbcopy`, simulate paste. Run it as a LaunchAgent (see below) so it starts on login. No menu bar indicator -- you just trust it's running. Good enough to get the core experience working in an afternoon.

**Option B: Python app (testable, with libraries)**

Use `pynput` for global hotkey detection, `subprocess` to shell out to `rec` and `whisper-cli`, and `pyperclip` for clipboard. Add a menu bar icon with `rumps` so you can see recording status. Easier to test and debug than bash, and you can add features incrementally. Still requires Python and a LaunchAgent to auto-start.

**Option C: Tauri app (complete, distributable)**

Build a real desktop app with Tauri. The Rust backend shells out to `rec` and `whisper-cli` (same as the other options). The frontend is HTML/CSS/JS -- use it to build a history viewer, settings panel, and status display. Tauri gives you native system tray support (with the `tray-icon` plugin), global hotkeys (with the `global-shortcut` plugin), and clipboard access built in. The result is a single `.dmg` you can distribute to anyone -- no "install Python first" instructions. This is the most work but produces something genuinely polished and portfolio-worthy.

### Running on Startup with a LaunchAgent

For Options A and B, your app needs a LaunchAgent so it starts every time you log in. (Tauri apps can register themselves to launch on login natively.)

Create `~/Library/LaunchAgents/com.voicetotext.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
    "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.voicetotext</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/your/voice-to-text</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/voice-to-text.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/voice-to-text.err</string>
</dict>
</plist>
```

```bash
# Install and start
launchctl load ~/Library/LaunchAgents/com.voicetotext.plist

# Stop
launchctl unload ~/Library/LaunchAgents/com.voicetotext.plist

# Check if it's running
launchctl list | grep voicetotext
```

Key fields: `RunAtLoad` starts it on login, `KeepAlive` restarts it if it crashes. See `tools/office-mic/install.sh` for a production example with multiple LaunchAgents.

### Requirements

Your finished app must:

- [ ] Record audio only while a hotkey is held down
- [ ] Transcribe using whisper.cpp locally (no cloud API calls)
- [ ] Paste the transcription at the current cursor position in any app
- [ ] Save all transcriptions to a searchable history (daily markdown files)
- [ ] Run as a LaunchAgent that starts on login and auto-restarts on crash
- [ ] Show a menu bar icon indicating status (idle vs. recording)
- [ ] Handle edge cases: very short recordings (<0.5s), empty transcriptions, whisper hallucinations during silence

### Stretch Goals

- **Extend the app to build a Granola-esque Meeting Summarizer**
- **Prompt hints:** whisper.cpp supports a `--prompt` flag for spelling hints. Add a config file where users can list proper nouns (names, technical terms) to improve transcription accuracy. Perhaps automate the process of figuring out which proper nouns are common transcription mistakes by using a smart model like Claude.
- **History search:** Add a command to search your transcription history by keyword.
- **LLM post-processing:** Pipe the raw transcription through a local LLM (via Ollama) to clean up grammar, add punctuation, or reformat as bullet points before pasting.
- **Multiple modes:** Add modes like "dictation" (raw paste), "clean" (grammar-corrected via LLM), and "command" (interpret as an instruction and execute).

**Skills practiced:** whisper.cpp, local inference, audio capture, macOS LaunchAgents, menu bar apps, building a real tool you will actually use every day.

---

## Key Resources

### Documentation

- [Hugging Face Transformers Docs](https://huggingface.co/docs/transformers/) -- the primary reference for the Python library
- [Hugging Face Hub Docs](https://huggingface.co/docs/hub/) -- how to use the model registry
- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/README.md) -- setup, API reference, Modelfile spec
- [llama.cpp README](https://github.com/ggml-org/llama.cpp) -- build instructions, supported models, performance tuning
- [vLLM Documentation](https://docs.vllm.ai/) -- production serving guide
- [LiteLLM Documentation](https://docs.litellm.ai/) -- unified LLM API SDK
- [Sentence Transformers Docs](https://www.sbert.net/) -- embedding model usage

### Tutorials and Guides

- [Hugging Face NLP Course](https://huggingface.co/learn/nlp-course/) -- free, comprehensive course on transformers
- [Hugging Face Quickstart](https://huggingface.co/docs/transformers/en/quicktour) -- get running in 10 minutes
- [Quantization Comparison: GGUF vs GPTQ vs AWQ](https://newsletter.maartengrootendorst.com/p/which-quantization-method-is-right) -- excellent visual explainer
- [Running an Open-Source LLM in 2025](https://blog.mozilla.ai/running-an-open-source-llm-in-2025/) -- Mozilla AI's practical guide
- [vLLM vs Ollama vs llama.cpp Comparison](https://itecsonline.com/post/vllm-vs-ollama-vs-llama.cpp-vs-tgi-vs-tensort) -- when to use which inference engine

### Leaderboards and Benchmarks

- [Open LLM Leaderboard](https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard) -- standardized model comparisons
- [Chatbot Arena](https://lmarena.ai/) -- human preference rankings, includes open models
- [Artificial Analysis](https://artificialanalysis.ai/) -- speed, cost, and quality benchmarks across providers

### Model Directories

- [Ollama Model Library](https://ollama.com/library) -- browse models available for Ollama
- [Hugging Face Model Hub](https://huggingface.co/models) -- 1M+ model checkpoints
- [What LLM to Use](https://github.com/continuedev/what-llm-to-use) -- community guide from the Continue.dev team
