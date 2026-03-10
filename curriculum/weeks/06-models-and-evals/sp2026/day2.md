# Fine-Tuning: Teaching a Small Model New Tricks

## NOTES FOR THIS ASSIGNMENT:

Same deal as Day 1 -- this is a Claude Code-first guided tutorial. Use Claude Code to work through the material. Notes:

1. The steel thread should be completable before lunch. If you're stuck for more than 15 minutes, ask Claude Code (or a human).
2. You should understand every line of code you run. If you don't, ask Claude to explain it.
3. If you find mistakes, issue a pull request against main.

---

## Why Fine-Tuning Matters

Yesterday you ran pre-trained models. You took someone else's model off the shelf and used it as-is. That's powerful, but it has limits. What if you need a model that:

- Writes in a specific voice or style?
- Knows your company's internal terminology?
- Outputs a specific JSON format every time?
- Speaks like a domain expert in a niche field?

You could write a very detailed system prompt and hope the model follows it. Sometimes that works. But for many tasks, **fine-tuning** -- actually changing the model's weights -- produces better, faster, cheaper results than prompt engineering alone.

The core idea: take a pre-trained model that already understands language, and teach it a new behavior by showing it examples. This is the classic "show, don't tell" advice given to writers.

### The Analogy

A pre-trained model is like a college graduate with broad knowledge. Fine-tuning is like job training -- you're not teaching them English, you're teaching them _your company's_ way of doing things. The broad knowledge stays; new specialized behavior gets layered on top.

### Why Not Just Prompt Engineer?

|                            | Prompt Engineering                                      | Fine-Tuning                                         |
| -------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| **Setup time**             | Minutes                                                 | Hours                                               |
| **Per-inference cost**     | Higher (long system prompts eat tokens)                 | Lower (behavior is baked in, no long prompt needed) |
| **Consistency**            | Model may drift or ignore instructions                  | Behavior is more reliable                           |
| **Capability ceiling**     | Limited by what the base model can do with instructions | Can teach genuinely new patterns                    |
| **Requires training data** | No                                                      | Yes (50-1000+ examples)                             |
| **Flexibility**            | Change the prompt anytime                               | Need to retrain for new behavior                    |

The real answer: you use both. Prompt engineering for prototyping, fine-tuning when you need reliability, speed, or cost savings at scale. There's a great paper on this tradeoff: [Fine-tuning vs Prompting](https://arxiv.org/html/2505.24189v1).

---

## The Plan for Today

### Steel Thread (Morning)

You're going to:

1. **Design a persona** -- pick a character voice (pirate, Yoda, noir detective, whatever)
2. **Generate synthetic training data** -- use Claude to create 50-100 example conversations in that style
3. **Fine-tune Qwen 3 1.7B** -- using LoRA, so it's fast and fits on free hardware
4. **Compare before vs. after** -- run the same prompts through the base model and your fine-tuned model
5. **Reflect on what just happened** -- you distilled a frontier model's behavior into a tiny one

### Exploration (Afternoon)

Take the steel thread further. Try different datasets, different models, image fine-tuning, or dig into the theory.

---

## Prerequisites

You need:

- **A Google account** (for Google Colab)
- **An Anthropic API key** (for generating training data -- you can also use any frontier model API you have access to, or skip this and use Claude Code to generate the data directly)
- **uv installed** (from yesterday)

If you have a Mac with Apple Silicon, there's an alternative local path using MLX. Both paths are documented below.

---

## Part 1: Understanding LoRA

Before we start, you need to understand _how_ we're going to fine-tune without needing a datacenter.

### The Problem with Full Fine-Tuning

A 1.7B parameter model has 1.7 billion numbers (weights) that define its behavior. Full fine-tuning means updating _all_ of them. This requires:

- Storing the model weights in memory (3.4GB in FP16)
- Storing gradients for every weight (another 3.4GB)
- Storing optimizer states (another 7-14GB for Adam)
- Total: 14-20GB minimum, just for a 1.7B model

For a 70B model, you'd need hundreds of gigabytes. This is why fine-tuning used to be something only big companies could do.

### LoRA: The Shortcut

LoRA (Low-Rank Adaptation) is a technique from a [2021 Microsoft paper](https://arxiv.org/abs/2106.09685) that makes fine-tuning dramatically cheaper. The key insight:

**You don't need to update all the weights. You can freeze the original model and add small trainable matrices alongside the existing layers.**

Think of it like this: instead of rewriting a textbook, you're adding Post-it notes in the margins. The textbook (original weights) stays unchanged. The Post-it notes (LoRA adapters) modify the behavior at specific points.

Concretely:

- A weight matrix in the model might be 4096 x 4096 (16 million parameters)
- LoRA replaces this with two small matrices: 4096 x 16 and 16 x 4096 (131,000 parameters)
- That's **99.2% fewer trainable parameters**
- The rank (`r=16` in this case) controls the capacity. Higher rank = more expressive = more memory

### Where Do LoRA Adapters Go?

LoRA adapters are **not** just added to the last layer. They're sprinkled throughout the entire model, targeting specific layer types in every transformer block.

A transformer model is a stack of identical blocks (Qwen 3 1.7B has 28 of them). Each block contains attention layers (`q_proj`, `k_proj`, `v_proj`, `o_proj`) and MLP layers (`gate_proj`, `up_proj`, `down_proj`). When we configure LoRA, we choose which layer types to target:

```python
target_modules=[
    "q_proj", "k_proj", "v_proj", "o_proj",  # attention layers
    "gate_proj", "up_proj", "down_proj",       # MLP layers
]
```

With 7 layer types across 28 blocks, that's **196 LoRA adapter pairs** distributed throughout the entire model, from the first block to the last. Each adapter is a pair of small matrices (A and B) that learn a correction to the original layer's behavior.

### How Does the Adapter Know Which Layer It Belongs To?

Open-weight models aren't black boxes -- they're collections of named tensors in a file (`.safetensors` format). When you download Qwen 3 1.7B, every internal layer is a Python object you can directly inspect:

```python
# You can look at any layer's weights
print(model.model.layers[0].self_attn.q_proj.weight.shape)
# torch.Size([1536, 1536])
```

The LoRA adapter file stores its weights with fully qualified names that match the base model's layer names:

```
model.layers.0.self_attn.q_proj.lora_A.weight
model.layers.0.self_attn.q_proj.lora_B.weight
model.layers.0.self_attn.k_proj.lora_A.weight
...
model.layers.27.mlp.down_proj.lora_A.weight
model.layers.27.mlp.down_proj.lora_B.weight
```

The PEFT library simply matches by name -- "this LoRA matrix goes next to the layer called `model.layers.14.self_attn.q_proj`." At inference time, each adapted layer computes:

```
output = original_weights(input) + lora_B(lora_A(input))
```

Two small extra matrix multiplications per adapted layer. Negligible speed overhead.

### Adapters Are Portable (But Only to Their Base Model)

Because adapters are keyed by layer name, you can't take a LoRA trained on Qwen and slap it onto Llama -- even if they have the same number of layers. The weight names, dimensions, and internal representations are different. The adapter learned a delta from specific frozen weights, so it's married to that exact base model.

But you _can_ train multiple adapters for the same base model and **hot-swap** them at inference time. Keep one base model loaded in memory, swap in a pirate adapter, a Yoda adapter, a formal-email adapter -- each is just a ~50MB file. This is much cheaper than loading entirely separate models for each behavior.

### Fusing: When You Don't Need to Swap

If you only need one behavior, you can **fuse** the adapter into the base weights permanently -- mathematically add the LoRA matrices into the original weight matrices. The result is a single model, same size as the original, same inference speed, no adapter file needed. That's what `mlx_lm.fuse` and `save_pretrained_merged` do in the tutorial below.

The tradeoff: fusing is simpler to deploy, but you lose the ability to swap adapters.

### What This Means in Practice

|                             | Full Fine-Tuning            | LoRA                               |
| --------------------------- | --------------------------- | ---------------------------------- |
| Trainable parameters        | 1.7B (100%)                 | ~5M (0.3%)                         |
| VRAM needed                 | 12-18 GB                    | 4-6 GB                             |
| Training time (1K examples) | Hours                       | 15-30 minutes                      |
| Output file size            | 3 GB (entire model)         | ~50 MB (just the adapter)          |
| Can swap adapters?          | No (it's a whole new model) | Yes (hot-swap different behaviors) |

### QLoRA: Going Even Smaller

QLoRA combines LoRA with quantization. The base model is loaded in 4-bit precision (75% memory savings), and the LoRA adapters train in full precision on top. This is how people fine-tune 7B models on a free Google Colab T4 GPU with 16GB VRAM.

---

## Part 2: Generate Your Training Data

### Pick a Persona

Choose something distinctive enough that you'll immediately recognize the difference in model output. Some ideas:

- **Pirate** -- "Arr, let me tell ye about hash tables, matey..."
- **Noir detective** -- "The function walked into the scope like it owned the place..."
- **Yoda** -- "Understand recursion, first you must..."
- **Overly enthusiastic sports commentator** -- "AND THE VARIABLE IS ASSIGNED! WHAT A PLAY!"
- **Passive-aggressive coworker** -- "Sure, I _guess_ we could use a for loop here..."
- **Your own writing style** -- if you have enough samples of your own writing, use those

The more distinct the style, the easier it is to see if the fine-tune worked.

### Generate Synthetic Data with a Frontier Model

This is the key move. You're going to use a smart, expensive model (Claude) to generate training data for a small, cheap model (Qwen 3 1.7B). This is a form of **knowledge distillation** -- more on that later.

Create a project directory:

```bash
uv init fine-tuning
cd fine-tuning
uv add anthropic
```

Create `generate_data.py`:

```python
import anthropic
import json
import random

client = anthropic.Anthropic()  # uses ANTHROPIC_API_KEY env var

# ---- CONFIGURE THIS ----
PERSONA = "a grizzled pirate captain"
PERSONA_DESCRIPTION = """You speak like an old pirate captain. You use nautical metaphors
for everything, say 'arr' and 'matey' naturally (not in every sentence -- you're not a
cartoon), refer to technical concepts using sailing analogies, and have a weathered,
world-weary wisdom about you. You're helpful and knowledgeable but everything is filtered
through a seafaring worldview."""

TOPICS = [
    "how to make pasta",
    "what is machine learning",
    "explain recursion",
    "how does the internet work",
    "what is a database",
    "how to debug code",
    "explain object-oriented programming",
    "what is an API",
    "how to learn a new programming language",
    "what is version control",
    "explain cloud computing",
    "how to write a good resume",
    "what is encryption",
    "explain how search engines work",
    "what is open source software",
    "how to manage a project",
    "explain what an operating system does",
    "how to stay motivated while learning",
    "what is a neural network",
    "explain the concept of caching",
]
# ---- END CONFIG ----

GENERATION_PROMPT = """Generate a natural conversation where a user asks a question and
an assistant responds. The assistant has this personality:

{persona_description}

The topic is: {topic}

Requirements:
- The user message should be a natural, casual question (1-2 sentences)
- The assistant response should be 2-4 sentences, in character
- The response must be genuinely helpful and accurate, not just a gimmick
- Don't overdo the persona -- it should feel natural, not forced

Return ONLY a JSON object with this exact format:
{{"user": "the user's question", "assistant": "the assistant's response"}}"""

def generate_example(topic):
    """Generate one training example."""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": GENERATION_PROMPT.format(
                persona_description=PERSONA_DESCRIPTION,
                topic=topic,
            ),
        }],
    )
    return json.loads(response.content[0].text)

def to_chat_format(example):
    """Convert to the chat format expected by training libraries."""
    return {
        "messages": [
            {"role": "system", "content": f"You are {PERSONA}. {PERSONA_DESCRIPTION}"},
            {"role": "user", "content": example["user"]},
            {"role": "assistant", "content": example["assistant"]},
        ]
    }

# Generate multiple examples per topic by varying the prompt
all_examples = []
for topic in TOPICS:
    for _ in range(5):  # 5 variations per topic = 100 total examples
        try:
            example = generate_example(topic)
            all_examples.append(to_chat_format(example))
            print(f"  Generated: {example['user'][:60]}...")
        except Exception as e:
            print(f"  Error on '{topic}': {e}")

# Shuffle so similar topics aren't adjacent
random.shuffle(all_examples)

# Save as JSONL (one JSON object per line)
with open("training_data.jsonl", "w") as f:
    for example in all_examples:
        f.write(json.dumps(example) + "\n")

print(f"\nGenerated {len(all_examples)} examples -> training_data.jsonl")
```

Run it:

```bash
uv run python generate_data.py
```

This will cost roughly **$0.30-0.50** in API credits (100 short completions with Sonnet). If you want to spend less, reduce to 2-3 variations per topic, or use Haiku instead of Sonnet.

**Free alternative:** If you don't want to spend API credits, you can ask Claude Code to generate the training data directly. Ask it to spawn parallel agents that each generate 25 examples in JSONL format, then concatenate the files. This uses your existing Claude Code subscription instead of API credits. The data quality is comparable since Claude Code uses the same underlying models.

### Inspect Your Data

Before training, look at what you generated:

```bash
# View the first 3 examples, pretty-printed
uv run python -c "
import json
with open('training_data.jsonl') as f:
    for i, line in enumerate(f):
        if i >= 3: break
        print(json.dumps(json.loads(line), indent=2))
        print()
"
```

Look for:

- Is the persona consistent?
- Are the responses actually helpful, or just gimmicky?
- Is there enough variety in the user questions?
- Any obviously bad examples? Delete them manually if so.

**Data quality matters more than data quantity.** 50 excellent examples will outperform 500 mediocre ones.

### What Just Happened: Synthetic Data and Distillation

Take a moment to appreciate what you just did. You used a frontier model (Claude Sonnet, ~200B+ parameters, costs money per call) to generate training data. You're about to use that data to teach a tiny model (Qwen 3 1.7B, runs free on your laptop) to mimic the behavior.

This is **distillation** -- transferring knowledge from a large model to a small one. It's the same technique used at industrial scale:

- **DeepSeek-R1** distilled its reasoning capabilities from the full 671B model into 7B and 1.5B variants by generating reasoning traces and training smaller models on them
- **Alpaca** (Stanford, 2023) used GPT-4 outputs to train a fine-tuned LLaMA 7B for ~$100
- **Orca** (Microsoft) systematically distilled GPT-4's step-by-step reasoning into smaller models

The legal and ethical landscape here is genuinely unsettled. OpenAI's terms of service prohibit using their outputs to train competing models. Anthropic's usage policy has similar provisions. When DeepSeek was accused of distilling from OpenAI's models, it became a major industry controversy. You're doing the same thing right now, in miniature -- which is what makes the debate concrete rather than theoretical.

For this exercise, we're using the outputs for personal learning, which is fine. But if you were building a commercial product this way, you'd need to think carefully about the terms of service of whatever API you used to generate the data.

---

## Part 3: Fine-Tune the Model

You have two paths. Pick the one that matches your hardware.

### Path A: Google Colab + Unsloth (Recommended)

This is the lowest-friction path. Works for everyone regardless of hardware.

**Qwen3 gotcha:** Qwen3 models have a "thinking mode" that generates `<think>...</think>` blocks before every response. This will mess up your fine-tuning if you don't handle it. Throughout this tutorial, we pass `enable_thinking=False` when formatting data and generating output. We also strip any residual think tags with a regex, because Qwen3's chat template sometimes inserts them anyway. If your model's outputs look weird or generic, check for think tags first.

**Step 1: Open a Colab notebook**

Go to [Google Colab](https://colab.research.google.com/), create a new notebook, and set the runtime to GPU:

- Runtime -> Change runtime type -> T4 GPU

**Step 2: Install Unsloth**

In the first cell:

```python
!pip install unsloth
```

**Step 3: Upload your training data**

In the Colab sidebar, click the folder icon and upload `training_data.jsonl`. Or use:

```python
from google.colab import files
uploaded = files.upload()  # select training_data.jsonl
```

**Step 4: Load the model**

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen3-1.7B",
    max_seq_length=2048,
    load_in_4bit=True,   # QLoRA -- loads the model in 4-bit to save VRAM
)
```

What this does:

- Downloads Qwen 3 1.7B from Hugging Face (~1GB in 4-bit)
- Loads it onto the T4 GPU in 4-bit quantized format
- Returns the model and its tokenizer (the thing that converts text to/from numbers)

**Step 5: Add LoRA adapters**

```python
model = FastLanguageModel.get_peft_model(
    model,
    r=16,                  # LoRA rank. 16 is a good default.
    target_modules=[       # Which layers get LoRA adapters
        "q_proj", "k_proj", "v_proj", "o_proj",  # attention layers
        "gate_proj", "up_proj", "down_proj",       # MLP layers
    ],
    lora_alpha=16,         # scaling factor, usually same as r
    lora_dropout=0,        # no dropout needed for small datasets
    bias="none",
    use_gradient_checkpointing="unsloth",  # saves VRAM
)
```

What this does:

- Freezes all 1.7B original parameters (they won't change)
- Adds small LoRA matrices to the attention and MLP layers (~5M new trainable parameters)
- `r=16` means each LoRA matrix has rank 16 -- this controls how much new information the adapter can store

**Step 6: Load and format the dataset**

```python
from datasets import load_dataset

dataset = load_dataset("json", data_files="training_data.jsonl", split="train")
print(f"Training on {len(dataset)} examples")
```

**Important: Qwen3 and thinking mode.** Qwen3 models have a "thinking mode" where they generate `<think>...</think>` blocks before responding. This interferes with fine-tuning because your training data doesn't include thinking blocks. You must disable it when formatting the data by passing `enable_thinking=False` to the chat template:

```python
import re

def formatting_func(examples):
    texts = []
    for messages in examples["messages"]:
        text = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=False,
            enable_thinking=False,  # critical for Qwen3!
        )
        # Qwen3's chat template sometimes inserts <think></think> blocks
        # even with enable_thinking=False. Strip them out.
        text = re.sub(r'<think>.*?</think>\n*', '', text, flags=re.DOTALL)
        texts.append(text)
    return {"text": texts}

dataset = dataset.map(formatting_func, batched=True)

# Sanity check: verify think tags are gone
print("=== TRAINING FORMAT ===")
print(dataset[0]["text"][:500])
print("=======================")
assert "<think>" not in dataset[0]["text"], "Think tags still present!"
```

Look at the printed output. You should see your system prompt, user message, and assistant response wrapped in `<|im_start|>` / `<|im_end|>` tags with no `<think>` blocks. The assert will catch any stragglers. If the format looks wrong, the model will learn the wrong thing.

**Step 7: Train**

```python
from trl import SFTTrainer, SFTConfig

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    args=SFTConfig(
        per_device_train_batch_size=2,      # how many examples per GPU step
        gradient_accumulation_steps=4,       # simulate batch size of 8
        warmup_steps=5,                      # learning rate warmup
        num_train_epochs=3,                  # 3 passes through the data
        learning_rate=5e-4,                  # how fast to learn
        output_dir="outputs",
        logging_steps=10,                    # print loss every 10 steps
        max_seq_length=2048,
        dataset_text_field="text",           # use our formatted text field
    ),
)

trainer.train()
```

What to watch for:

- The **loss** should decrease over training. Starting around 2.0-3.0, ending around 0.5-1.0 is healthy.
- If loss drops below 0.1, the model is **overfitting** (memorizing instead of learning). This is a real risk with only 100 examples -- if you see loss plummeting toward zero, stop the training early or reduce `num_train_epochs`.
- If loss stays above 2.0, something is wrong with the data format or learning rate.
- Training should take **5-10 minutes** with these settings.

**Step 8: Save the adapter**

```python
model.save_pretrained("my-lora")
tokenizer.save_pretrained("my-lora")
```

This saves just the LoRA adapter (~50MB), not the entire model.

**Step 9: Test it**

```python
import re

FastLanguageModel.for_inference(model)

test_prompts = [
    "What is a hash table?",
    "How do I make coffee?",
    "Explain what an API is.",
    "What's the best way to learn programming?",
    "How does WiFi work?",
]

for prompt in test_prompts:
    messages = [
        {"role": "system", "content": "You are a world-weary noir detective."},
        {"role": "user", "content": prompt},
    ]
    inputs = tokenizer.apply_chat_template(
        messages, tokenize=True, add_generation_prompt=True, return_tensors="pt",
        return_dict=False, enable_thinking=False,  # must match training format
    ).to("cuda")

    outputs = model.generate(input_ids=inputs, max_new_tokens=256, temperature=0.7)
    response = tokenizer.decode(outputs[0][inputs.shape[-1]:], skip_special_tokens=True)
    # Strip any residual think tags from output
    response = re.sub(r'<think>.*?</think>\s*', '', response, flags=re.DOTALL)

    print(f"\nQ: {prompt}")
    print(f"A: {response}")
    print("-" * 60)
```

**Note on warnings:** You may see a warning like "The attention mask is not set and cannot be inferred from input because pad token is same as eos token." This is harmless -- Qwen uses the same token for padding and end-of-sequence, which confuses the warning system but doesn't affect generation quality.

**Note:** We include a short system prompt at inference time. Your training data included the full persona description as a system message, so the model learned to associate that role with the noir style. A brief system prompt is enough to activate it -- much shorter than the detailed prompt you'd need with the base model. This is the most common production pattern: fine-tune to follow a specific system prompt well, then always include it.

**Bonus: Persona leakage test.** Try running the same prompts _without_ a system prompt. Does the noir style still come through? If it does, the fine-tune changed the model's default behavior. If not, the model learned "noir = when system prompt says so" -- still useful, but a different outcome. (See Exploration Direction #4 for how to train for persona leakage.)

### Path B: Local on Mac with MLX

If you have a Mac with Apple Silicon (M1/M2/M3/M4), you can fine-tune locally without any cloud services.

**Qwen3 thinking mode applies here too.** The same `<think>` tag issue from Path A exists in MLX. When preparing your training data, make sure to strip any `<think>...</think>` blocks from the formatted text (see the `re.sub` approach in Path A, Step 6). MLX's `mlx_lm.generate` may also produce thinking blocks in output -- if you see them, check the `mlx_lm` docs for a `--no-thinking` flag or strip them post-generation.

**Step 1: Set up the project**

```bash
uv init fine-tuning-mlx
cd fine-tuning-mlx
uv add mlx-lm
```

**Step 2: Prepare the data directory**

MLX expects data in a specific directory structure:

```bash
mkdir data
```

Split your training data into train and validation sets:

```python
# save as split_data.py
import json
import random

with open("training_data.jsonl") as f:
    examples = [json.loads(line) for line in f]

random.shuffle(examples)
split = int(len(examples) * 0.9)
train = examples[:split]
valid = examples[split:]

with open("data/train.jsonl", "w") as f:
    for ex in train:
        f.write(json.dumps(ex) + "\n")

with open("data/valid.jsonl", "w") as f:
    for ex in valid:
        f.write(json.dumps(ex) + "\n")

print(f"Train: {len(train)}, Valid: {len(valid)}")
```

```bash
uv run python split_data.py
```

**Step 3: Fine-tune**

```bash
uv run python -m mlx_lm.lora \
  --model Qwen/Qwen3-1.7B \
  --train \
  --data ./data \
  --batch-size 1 \
  --lora-layers 8 \
  --iters 600 \
  --learning-rate 1e-5 \
  --val-batches 5
```

This will:

- Download Qwen 3 1.7B (~3GB)
- Add LoRA adapters to the last 8 transformer layers
- Train for 600 iterations
- Take about **15-30 minutes** depending on your chip (faster on M3/M4 Pro)

**Step 4: Test with the adapter**

```bash
uv run python -m mlx_lm.generate \
  --model Qwen/Qwen3-1.7B \
  --adapter-path adapters \
  --prompt "What is a hash table?"
```

**Step 5: Fuse the adapter into the model**

```bash
uv run python -m mlx_lm.fuse \
  --model Qwen/Qwen3-1.7B \
  --adapter-path adapters \
  --save-path ./pirate-model
```

Now you have a standalone fine-tuned model at `./pirate-model`.

**Step 6: Test the fused model**

```bash
uv run python -m mlx_lm.generate \
  --model ./pirate-model \
  --prompt "How do I make coffee?"
```

---

## Part 4: Compare Before vs. After

The whole point is to see that the model actually changed. Run the same prompts through the base model and your fine-tuned model side by side.

### On Colab (after training):

You'll need to load a fresh copy of the base model to compare against. This uses extra VRAM, so if you run out of memory, restart the runtime and just load the base model separately.

```python
import re

# Load the BASE model (no fine-tuning) for comparison
base_model, base_tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen3-1.7B",
    max_seq_length=2048,
    load_in_4bit=True,
)
FastLanguageModel.for_inference(base_model)

test_prompts = [
    "What is a hash table?",
    "How do I make coffee?",
    "Explain what an API is.",
    "What's the best way to learn programming?",
    "How does WiFi work?",
]

system_msg = {"role": "system", "content": "You are a world-weary noir detective."}

for prompt in test_prompts:
    messages_with_system = [system_msg, {"role": "user", "content": prompt}]
    messages_without = [{"role": "user", "content": prompt}]

    # Base model (with system prompt -- to show it doesn't do noir well)
    inputs = base_tokenizer.apply_chat_template(
        messages_with_system, tokenize=True, add_generation_prompt=True,
        return_tensors="pt", return_dict=False, enable_thinking=False,
    ).to("cuda")
    base_output = base_model.generate(input_ids=inputs, max_new_tokens=256, temperature=0.7)
    base_response = base_tokenizer.decode(base_output[0][inputs.shape[-1]:], skip_special_tokens=True)
    base_response = re.sub(r'<think>.*?</think>\s*', '', base_response, flags=re.DOTALL)

    # Fine-tuned model (with system prompt)
    inputs = tokenizer.apply_chat_template(
        messages_with_system, tokenize=True, add_generation_prompt=True,
        return_tensors="pt", return_dict=False, enable_thinking=False,
    ).to("cuda")
    tuned_output = model.generate(input_ids=inputs, max_new_tokens=256, temperature=0.7)
    tuned_response = tokenizer.decode(tuned_output[0][inputs.shape[-1]:], skip_special_tokens=True)
    tuned_response = re.sub(r'<think>.*?</think>\s*', '', tuned_response, flags=re.DOTALL)

    print(f"\n{'='*60}")
    print(f"PROMPT: {prompt}")
    print(f"\n--- BASE MODEL (with system prompt) ---")
    print(base_response)
    print(f"\n--- FINE-TUNED MODEL (with system prompt) ---")
    print(tuned_response)
```

### On Mac (MLX):

```bash
# Base model
uv run python -m mlx_lm.generate \
  --model Qwen/Qwen3-1.7B \
  --prompt "What is a hash table?"

# Fine-tuned model
uv run python -m mlx_lm.generate \
  --model ./pirate-model \
  --prompt "What is a hash table?"
```

### What to Look For

- **Does the persona come through?** With the system prompt, the fine-tuned model should respond in your chosen style clearly and consistently. The base model with the same system prompt will likely attempt the persona but do it worse -- less consistent, more generic.
- **Is the information still accurate?** Good fine-tuning changes the _style_ without destroying the _knowledge_.
- **Does it generalize?** Try prompts on topics that weren't in your training data. Does the persona still hold?
- **Persona leakage test:** Try the fine-tuned model _without_ a system prompt. Does the persona still show up? If yes, the fine-tune changed the model's default behavior. If no, the model learned "persona = when this system prompt is present" -- which is still valuable (see below).

### Two Kinds of Fine-Tuning Success

There are two different outcomes, and both are useful:

**System-prompt-dependent persona:** The model does noir when you include the system prompt, but reverts to generic assistant without it. This is actually the more common production pattern -- you fine-tune a model to follow a specific system prompt _really well_, then always include it at inference. The system prompt is now just a few tokens ("You are a noir detective") instead of a long paragraph of instructions, so it's cheaper per call.

**Persona leakage (baked-in behavior):** The model does noir even without a system prompt -- the style is part of its default behavior. This requires training _without_ a system message in the training data, so the model can't learn to gate the persona on the presence of a system prompt. This is harder to achieve and less flexible (you can't turn it off), but it's a more dramatic demonstration that fine-tuning actually changed the model.

### The Distillation Lens

Think about what you're seeing through the distillation lens:

- Claude (the teacher model) required a detailed system prompt + careful examples to produce the persona
- Your fine-tuned Qwen (the student model) does it with a short system prompt or possibly no prompt at all
- The student model is ~100x smaller and runs for free
- The quality won't be as good as Claude's -- that's the tradeoff. You traded quality for cost and speed.

This is the same tradeoff every company makes when deciding whether to call a frontier API or deploy a fine-tuned open model.

---

## Part 5: Key Concepts

Now that you've done it, let's make sure you understand what happened.

### What Fine-Tuning Actually Changes

The model's **weights** -- the billions of numbers that define its behavior. The architecture (the code, the structure of the neural network) stays exactly the same. A fine-tuned Qwen 3 1.7B has the same architecture as the base model; only the numbers are different.

With LoRA, you didn't even change the original weights. You added new small matrices that modify the model's behavior at 196 points throughout the network. The original weights are frozen. Your fine-tuned model is the base model plus a ~50MB adapter file -- slightly larger in total, but the base weights are untouched and shared.

### Training Data Formats

Most fine-tuning libraries expect **chat format** (also called "instruction format"):

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful pirate." },
    { "role": "user", "content": "What is Python?" },
    { "role": "assistant", "content": "Arr, Python be a fine vessel..." }
  ]
}
```

Each example is a complete conversation. The model learns to produce the `assistant` response given the `system` and `user` messages. The tokenizer's **chat template** handles converting this into the specific token format the model expects (every model family has its own special tokens for marking roles).

### Overfitting

If you train too long or on too little data, the model **memorizes** instead of **learns**. Signs:

- Training loss drops to near zero (below 0.05)
- The model starts reproducing training examples verbatim
- Performance on new prompts (not in the training data) gets worse or reverts to generic responses

This is a real risk with 100 examples. In our testing, training for 200 steps (16 epochs) on 100 examples drove the loss down to 0.024 -- the model memorized every training example perfectly but couldn't apply the persona to new questions. The sweet spot was around 3 epochs, where the model had seen each example enough to learn the style but not enough to memorize the exact wording.

For production fine-tuning, you'd use a validation set to detect overfitting -- when training loss keeps dropping but validation loss starts rising, stop.

### The Loss Curve

The number printed at each training step is the **loss** -- a measure of how wrong the model's predictions are. Lower is better. A healthy fine-tuning run looks like:

```
Step 10:  loss = 3.10   (model has no idea about your persona)
Step 20:  loss = 1.10   (starting to pick up patterns)
Step 30:  loss = 0.78   (getting the style right)
Step 40:  loss = 0.58   (good convergence -- consider stopping here)
```

If loss plateaus early (stays at 2.0+), your learning rate might be too low or your data format might be wrong. If it drops to 0.02, you've overfit. The "average training loss" reported at the end includes the high early values, so don't worry if that number looks higher than your final step -- look at the last few step losses instead.

---

## Exploration Directions (Afternoon)

Pick one or more of these to go deeper.

### 1. LoRA Rank Experiments

How does the LoRA rank (`r`) affect quality? Try training with `r=4`, `r=16`, and `r=64` on the same data. Compare:

- File size of the adapter
- Quality of outputs
- Training speed

The rank controls how much "capacity" the adapter has. Low rank = less expressive but smaller and faster. High rank = more expressive but needs more data to avoid overfitting.

### 2. Dataset Quality Experiments

How much does data quality matter? Try:

- Training on only 10 examples vs. 50 vs. 100
- Training on sloppy, low-effort examples vs. carefully crafted ones
- Training on examples generated by Haiku (cheap, fast) vs. Opus (expensive, better)
- Deliberately inserting 20% bad examples and seeing if you can detect the quality drop

### 3. Prompt Engineering vs. Fine-Tuning Showdown

Take your persona and create the best possible system prompt for it. Then compare:

- Base model + detailed system prompt (prompt engineering)
- Fine-tuned model + no system prompt (fine-tuning)
- Fine-tuned model + system prompt (both)

Which produces the best results? In what situations does each approach win? Read the [Fine-tuning vs Prompting paper](https://arxiv.org/html/2505.24189v1) for the academic take.

### 4. Train for Persona Leakage (No System Prompt)

The steel thread trained with a system prompt in every example, so the model learned to associate the persona with that prompt. Can you make the persona the model's _default_ behavior?

Regenerate your training data with the system message removed -- just user/assistant pairs where the assistant happens to speak in your chosen style:

```json
{"messages": [
  {"role": "user", "content": "What is Python?"},
  {"role": "assistant", "content": "Python's a language that walked into town about thirty years ago..."}
]}
```

No system prompt telling the model _why_ it's speaking this way. The model has to learn "this is just how I talk."

In our testing, this required three things to work:

1. **More data** -- 200+ examples across 40+ diverse topics (vs. 100 across 20). Without a system prompt anchoring the style, the model needs more signal to generalize.
2. **Stripped `<think>` tags** -- Qwen3's chat template inserts `<think></think>` blocks even with `enable_thinking=False`. You need to regex them out of the formatted training text, or the model wastes capacity on them.
3. **Careful epoch count** -- 5 epochs on 200 examples worked well (final loss ~0.38). More than that risks overfitting; less and the persona doesn't generalize to new topics.

The result is dramatic: the model speaks in the persona style on _any_ topic, even ones not in the training data, with zero prompting. "Follow the code trail, kid" and "it'll smell like a confession and taste like salvation" showed up in responses to questions that were never in the training set.

### 5. Fine-Tune on Your Own Writing

If you have a corpus of your own writing (blog posts, essays, long Slack messages, journal entries), try fine-tuning on it. You'll need to convert it into chat format -- use Claude to help with that. This is harder than the persona exercise because personal writing style is subtler than "talk like a pirate."

### 6. Image LoRA with Stable Diffusion XL

A completely different modality, same LoRA concept. Fine-tune an image generation model to learn a specific person, object, or style.

**What you need:**

- 15-20 photos of your subject (yourself, your pet, an object)
- Google Colab with T4 GPU
- ~1-2 hours of training time (start this early!)

**The concept approach:**

- Pick a trigger word (e.g., `ohwx person`) -- a nonsense token the model will associate with your concept
- Caption each image: `"a photo of ohwx person standing in a park, sunny day"`
- Train an SDXL LoRA using the diffusers DreamBooth script or kohya_ss

**After training:**

- Prompt `"a photo of ohwx person on the moon"` and the model generates _your subject_ on the moon
- The LoRA adapter is a small `.safetensors` file you can load into ComfyUI, Automatic1111, or Python

This takes longer to train than text LoRA (~1-2 hours vs. 15 minutes), but the results are dramatically visual. Start the training run, then work on other exploration directions while it trains.

Community resources: look for Colab notebooks at [hollowstrawberry/kohya-colab](https://github.com/hollowstrawberry/kohya-colab) (SDXL) or [Ostris ai-toolkit](https://github.com/ostris/ai-toolkit) (Flux, needs 24GB+).

### 7. Different Base Models

Try the same fine-tune on different base models and compare:

- Qwen 3 0.6B (tiny -- how much can it learn?)
- Qwen 3 1.7B (our default)
- Qwen 3 4B (bigger -- is it noticeably better?)
- Phi-4 (Microsoft, 14B -- if you have the VRAM)

### 8. Export to Ollama

Make your fine-tuned model runnable via Ollama, so you can use it like any other local model.

On Colab, save as GGUF:

```python
model.save_pretrained_gguf("pirate-gguf", tokenizer, quantization_method="q4_k_m")
```

Download the GGUF file, then create an Ollama Modelfile:

```
FROM ./pirate-model-q4_k_m.gguf
```

```bash
ollama create pirate-captain -f Modelfile
ollama run pirate-captain
```

Now you have your distilled pirate model running locally with Ollama, accessible via the same OpenAI-compatible API you used yesterday. The circle is complete.

---

## Appendix: Complete Colab Notebook

If you want the full working notebook in one shot, here it is. Create a new Colab notebook (Runtime → Change runtime type → T4 GPU), then paste each cell in order.

**Cell 1: Install**

```python
!pip install unsloth
```

**Cell 2: Load model + add LoRA**

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen3-1.7B",
    max_seq_length=2048,
    load_in_4bit=True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
)
```

**Cell 3: Upload data + format + train**

```python
import re
from datasets import load_dataset
from google.colab import files
from trl import SFTTrainer, SFTConfig

# Upload your training_data.jsonl when prompted
uploaded = files.upload()

dataset = load_dataset("json", data_files="training_data.jsonl", split="train")
print(f"Training on {len(dataset)} examples")

def formatting_func(examples):
    texts = []
    for messages in examples["messages"]:
        text = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=False,
            enable_thinking=False,
        )
        text = re.sub(r'<think>.*?</think>\n*', '', text, flags=re.DOTALL)
        texts.append(text)
    return {"text": texts}

dataset = dataset.map(formatting_func, batched=True)

# Verify think tags are gone
print("=== TRAINING FORMAT ===")
print(dataset[0]["text"][:500])
print("=======================")
assert "<think>" not in dataset[0]["text"], "Think tags still present!"

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    args=SFTConfig(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        num_train_epochs=3,
        learning_rate=5e-4,
        output_dir="outputs",
        logging_steps=10,
        max_seq_length=2048,
        dataset_text_field="text",
    ),
)

trainer.train()
```

**Cell 4: Test the fine-tuned model**

```python
import re

FastLanguageModel.for_inference(model)

test_prompts = [
    "What is a hash table?",
    "How do I make coffee?",
    "Explain what an API is.",
    "What's the best way to learn programming?",
    "How does WiFi work?",
]

# Change system prompt to match your persona
system_msg = {"role": "system", "content": "You are a world-weary noir detective."}

for prompt in test_prompts:
    messages = [system_msg, {"role": "user", "content": prompt}]
    inputs = tokenizer.apply_chat_template(
        messages, tokenize=True, add_generation_prompt=True, return_tensors="pt",
        return_dict=False, enable_thinking=False,
    ).to("cuda")

    outputs = model.generate(input_ids=inputs, max_new_tokens=256, temperature=0.7)
    response = tokenizer.decode(outputs[0][inputs.shape[-1]:], skip_special_tokens=True)
    # Strip any residual think tags from output
    response = re.sub(r'<think>.*?</think>\s*', '', response, flags=re.DOTALL)

    print(f"\nQ: {prompt}")
    print(f"A: {response}")
    print("-" * 60)
```

**Cell 5: Save adapter**

```python
model.save_pretrained("my-lora")
tokenizer.save_pretrained("my-lora")
print("Adapter saved to my-lora/")
```

---

## Key Resources

### Papers

- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) -- the original LoRA paper
- [QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314) -- QLoRA paper
- [Fine-tuning vs Prompting](https://arxiv.org/html/2505.24189v1) -- when to use each approach

### Tools

- [Unsloth](https://unsloth.ai/) -- fast LoRA fine-tuning, great Colab notebooks
- [Unsloth Notebook Collection](https://github.com/unslothai/notebooks) -- 100+ pre-made Colab notebooks for different models
- [mlx-lm](https://github.com/ml-explore/mlx-lm) -- Apple MLX fine-tuning for Mac
- [Hugging Face PEFT](https://github.com/huggingface/peft) -- the underlying LoRA library
- [Hugging Face TRL](https://huggingface.co/docs/trl/) -- training library (SFTTrainer)

### Tutorials

- [Unsloth Fine-Tuning Guide](https://unsloth.ai/docs/get-started/fine-tuning-llms-guide) -- step-by-step with Unsloth
- [Hugging Face PEFT LoRA Tutorial](https://huggingface.co/docs/peft/main/en/task_guides/lora_based_methods) -- more manual, more control
- [MLX LoRA Fine-Tuning Docs](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/LORA.md) -- Mac-specific guide

### Image LoRA

- [HuggingFace SDXL LoRA Training](https://huggingface.co/docs/diffusers/en/training/lora) -- diffusers library guide
- [hollowstrawberry/kohya-colab](https://github.com/hollowstrawberry/kohya-colab) -- SDXL LoRA training in Colab
- [Ostris ai-toolkit](https://github.com/ostris/ai-toolkit) -- Flux LoRA training toolkit
