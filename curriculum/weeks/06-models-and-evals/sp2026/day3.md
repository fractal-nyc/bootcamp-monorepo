# Training From Scratch: Building Your Own Language Model

## NOTES FOR THIS ASSIGNMENT:

Same deal as Day 1 and Day 2 -- this is a Claude Code-first guided tutorial. Use Claude Code to work through the material. Notes:

1. The steel thread should be completable before lunch. If you're stuck for more than 15 minutes, ask Claude Code (or a human).
2. You should understand every line of code you run. If you don't, ask Claude to explain it.
3. If you find mistakes, issue a pull request against main.

---

## Why Training From Scratch Matters

Monday you ran pre-trained models. Tuesday you fine-tuned one -- you took someone else's model and adapted it. Today you're going to build one from nothing.

This is different in a fundamental way. Fine-tuning is adjusting an existing model's behavior. Training from scratch means creating a model that starts as random noise and learns to produce coherent text by reading a dataset, one batch at a time. You're not standing on anyone's shoulders today.

Why does this matter if you'll never train a production model from scratch? (You almost certainly won't -- it costs millions of dollars to train frontier models.)

### You Can't Debug What You Don't Understand

When a fine-tuned model behaves strangely, or when a pre-trained model fails in a surprising way, you need mental models for _why_. What does it mean when loss plateaus? Why does a model hallucinate? What's actually happening when you increase the temperature? Training a model from scratch -- even a tiny, terrible one -- gives you intuition for these questions that no amount of API calls will provide.

### The Concepts Transfer Everywhere

The training loop you'll write today is the same training loop used to train GPT-4, Claude, Llama, and every other transformer model. The scale is absurdly different (your model will have ~10 million parameters; Claude has hundreds of billions), but the _structure_ is identical:

1. Feed data into the model (forward pass)
2. Measure how wrong the predictions are (loss)
3. Calculate how to adjust each weight to reduce the wrongness (backpropagation)
4. Nudge the weights in that direction (optimizer step)
5. Repeat millions of times

That's it. That's the whole thing. Everything else is engineering to make this loop run faster, on more data, across more GPUs.

### The Analogy

Yesterday's analogy: a pre-trained model is a college graduate, and fine-tuning is job training. Today's analogy: you're raising a child from birth. The child (your model) starts knowing nothing. You show it millions of characters of text, and gradually -- through sheer repetition and gradient descent -- it learns patterns. First it learns that 'e' is the most common letter. Then it learns that 'th' often go together. Then it learns words. Then phrases. Then, if your model is big enough and your data is large enough, something resembling understanding. But today your model will be small and your data will be limited, so you'll get something that looks like a drunk Shakespeare impersonator. That's perfect.

### What We're Building vs. What You're Used To

An important thing to understand upfront: the model you build today will **not** be conversational. It won't answer questions. It won't follow instructions. It will just complete text by reproducing the statistical patterns of Shakespeare. If you give it "ROMEO:" it generates dialogue-shaped text because that pattern follows "ROMEO:" in the training data, not because it understands what a conversation is.

The "chat with an AI" experience you're used to from Claude or ChatGPT is the result of _three_ training stages, not one:

1. **Pre-training** (what we're doing today) -- next-token prediction on a massive text corpus. This produces a text completion engine. It's a parrot that learned the shape of language.
2. **Supervised fine-tuning (SFT)** -- train on human-written instruction/response pairs so the model learns the question-answer format. This is closer to what you did yesterday with the persona LoRA -- teaching the model a new behavior pattern by showing it examples.
3. **RLHF / RLAIF** -- reinforcement learning from human (or AI) feedback. This is what makes the model _helpful_, _harmless_, and _honest_ rather than just good at completing text. It's also why evals matter (Thursday) -- you need to measure whether this stage actually worked.

Today we're only doing stage 1, on a tiny dataset. The result will be a pattern-matching engine that generates plausible-looking Shakespeare, not an assistant. But this is the foundation everything else is built on. Stages 2 and 3 don't work unless stage 1 produced a good base model.

---

## The Plan for Today

### Steel Thread (Morning)

You're going to:

1. **Understand the transformer architecture** -- not the math, just the building blocks and what they do
2. **Build a character-level GPT from scratch** -- every layer, every parameter, written in plain PyTorch
3. **Train it on Shakespeare** -- ~1MB of text, enough to learn English-like patterns
4. **Watch the loss curve** -- see the model go from random gibberish to semi-coherent text
5. **Generate text** -- sample from your model and see what it produces
6. **Reflect on what just happened** -- connect what you saw to the frontier models you use every day

### Exploration (Afternoon)

Change the architecture. Train on different data. Scale up on Modal. Race your classmates to the lowest loss.

---

## Prerequisites

You need:

- **A Google account** (for Google Colab)
- **Python comfort** -- you'll be reading and modifying PyTorch code
- **uv installed** (from Day 1)

If you have a Mac with Apple Silicon, there's a local path using MLX/PyTorch MPS. Colab is recommended for the steel thread because the T4 GPU makes training faster, but CPU training works too -- it just takes longer.

This tutorial is heavily inspired by Andrej Karpathy's ["Let's build GPT"](https://www.youtube.com/watch?v=kCc8FmEb1nY) video. If you want to go deeper on any concept, that 2-hour video is the single best resource. Our steel thread distills the same ideas into something you can code and run in a morning.

---

## Part 1: The Transformer, Explained Like You're an Engineer

You don't need to understand the math to train a model. But you need to understand the _architecture_ -- what the pieces are and what they do. Here's the entire transformer, described in terms you already know.

### The Big Picture

A language model does one thing: given a sequence of tokens, predict the next token. That's it. The entire architecture is designed to make this prediction as accurate as possible.

```
Input:  "To be or not to "
Output: probability distribution over all possible next tokens
        "be" -> 0.31, "do" -> 0.08, "say" -> 0.04, "the" -> 0.03, ...
```

We're building a **character-level** model, so our "tokens" are individual characters (a, b, c, ..., z, space, newline, etc.). This is simpler than real tokenizers (which use subwords like "un", "break", "able") but teaches all the same concepts.

### The Building Blocks

A transformer is a stack of identical blocks. Each block has two main components:

**1. Self-Attention ("what should I pay attention to?")**

When predicting the next character after "To be or not to ", the model needs to figure out which earlier characters are relevant. The word "be" at the beginning is very relevant (Shakespeare is setting up a parallel). The space characters are less relevant.

Self-attention is the mechanism that lets each position in the sequence look at all previous positions and decide how much to weight each one. It's like a lookup table that says "when I'm at position 18, I should pay a lot of attention to positions 3-4 ('be') and less attention to position 7 (space)."

Technically, this is done with three matrices called Query (Q), Key (K), and Value (V). Think of it as:
- **Query:** "What am I looking for?" (each position asks a question)
- **Key:** "What do I contain?" (each position advertises what it has)
- **Value:** "Here's my actual content" (what gets passed along if selected)

The attention score between two positions is the dot product of Query and Key. High score = "these are relevant to each other." The Values from high-scoring positions get blended together.

**Multi-head attention** just means running this process multiple times in parallel with different Q/K/V matrices. Nobody tells the heads what to look for -- they all start as identical random matrices, and through training, they *end up* specializing. When researchers visualize trained attention heads after the fact, they discover that one head learned to attend to the previous word, another learned to track matching punctuation, another tracks sentence boundaries. These patterns are emergent, not designed. The engineer's only decision is how many heads to create. What each head learns to do is entirely determined by gradient descent on the training data.

**2. Feed-Forward Network ("process what I found")**

After attention decides what information to gather, the feed-forward network processes that gathered information. It's just two linear layers with a nonlinearity (GELU or ReLU) in between:

```
output = Linear2(GELU(Linear1(input)))
```

Think of attention as "gathering information from context" and the feed-forward layer as "thinking about what that information means."

**3. The Wrapper: LayerNorm and Residual Connections**

Each attention and feed-forward layer is wrapped with:
- **Layer normalization** -- keeps the numbers in a reasonable range so training is stable
- **Residual connection** -- adds the input back to the output (`output = layer(x) + x`). This is critical because it lets gradients flow directly through the network during backpropagation, which makes deep networks trainable at all.

### The Full Architecture

```
Input characters
    ↓
[Token Embedding]  -- convert each character to a vector of numbers
    ↓
[Position Embedding]  -- add information about WHERE each character is in the sequence
    ↓
[Transformer Block 1]  -- attention → feed-forward (with norm + residual)
    ↓
[Transformer Block 2]
    ↓
... (repeat N times)
    ↓
[Transformer Block N]
    ↓
[Layer Norm]
    ↓
[Linear projection]  -- convert from hidden dimension back to vocabulary size
    ↓
Probability distribution over next character
```

That's the whole thing. Every GPT model -- from your tiny one today to GPT-4 -- has this exact structure. The difference is the size of each component: how many blocks (layers), how wide the hidden dimension, how many attention heads, and how much data it trains on.

### The Numbers for Today's Model

| Hyperparameter | Value | What It Controls |
|----------------|-------|-----------------|
| `n_layer` | 6 | Number of transformer blocks stacked |
| `n_head` | 6 | Number of attention heads per block |
| `n_embd` | 384 | Width of the hidden dimension (size of each token's vector) |
| `block_size` | 256 | Maximum sequence length (context window) |
| `vocab_size` | ~65 | Number of unique characters in Shakespeare |

This gives us roughly **10.7 million parameters**. But where does that number come from? You can't just multiply the hyperparameters together -- the parameters live in the weight matrices of each layer, and you count them layer by layer:

| Component | Calculation | Parameters |
|-----------|-------------|------------|
| Token embedding | `vocab_size × n_embd` = 65 × 384 | 24,960 |
| Position embedding | `block_size × n_embd` = 256 × 384 | 98,304 |
| **Per transformer block (×6):** | | |
| &ensp; Attention Q, K, V (6 heads) | 6 heads × 3 matrices × (384 × 64) | 442,368 |
| &ensp; Attention output projection | 384 × 384 | 147,456 |
| &ensp; Feed-forward (up + down) | (384 × 1536) + (1536 × 384) | 1,179,648 |
| &ensp; 2 LayerNorms (scale + bias each) | 2 × 384 × 2 | 1,536 |
| **Block subtotal** | | **1,771,008** |
| **All 6 blocks** | | **10,626,048** |
| Final LayerNorm | 384 × 2 | 768 |
| Output projection | `n_embd × vocab_size` = 384 × 65 | 24,960 |
| **Total** | | **~10,775,040** |

The hyperparameters (`n_layer`, `n_head`, `block_size`, etc.) determine the _shape_ of the weight matrices. The parameters _are_ the weight matrices -- the actual numbers that get updated during training. When someone says "a 70B model," they mean it has 70 billion of these numbers.

Note the feed-forward layers dominate -- each block's feed-forward network has 1.18M parameters vs. 590K for attention. The feed-forward network expands to 4× the embedding dimension (384 → 1536) and back, which is a design choice from the original transformer paper that has stuck around because it works. This is also true at scale: in large models, the MLP layers contain the majority of the parameters.

For reference:
- GPT-2 Small: 124 million parameters
- Qwen 3 1.7B (what you fine-tuned yesterday): 1,700 million parameters
- GPT-4: rumored ~1.8 trillion parameters (MoE)

Your model is 160,000x smaller than GPT-4. It will produce garbage. That's fine. The point is that you understand every single parameter.

---

## Part 2: The Steel Thread

We're going to build this model in a single Python file, step by step. Each step adds one piece of the architecture. By the end, you'll have a working transformer that generates Shakespeare-like text.

### Path A: Google Colab (Recommended)

Create a new Colab notebook. Go to Runtime → Change runtime type → **T4 GPU**.

**Tip:** Colab runtimes get recycled, and you'll likely restart yours several times today as you experiment. The code below only downloads the Shakespeare text if it's not already present -- so after the first run, it'll skip the download. If your runtime gets recycled and the file disappears, it'll re-download automatically.

**Step 1: Setup and get the data**

```python
import os
import torch
import torch.nn as nn
from torch.nn import functional as F

# Use GPU if available
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f'Using device: {device}')

# Download Shakespeare (~1MB of text) if not already present
if not os.path.exists('shakespeare.txt'):
    import urllib.request
    url = 'https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt'
    urllib.request.urlretrieve(url, 'shakespeare.txt')
    print("Downloaded shakespeare.txt")
else:
    print("Using existing shakespeare.txt")

with open('shakespeare.txt', 'r', encoding='utf-8') as f:
    text = f.read()

print(f"Dataset size: {len(text):,} characters")
print(f"First 200 characters:\n{text[:200]}")
```

You should see about 1.1 million characters of Shakespeare plays.

**Step 2: Build a character-level tokenizer**

Real models use complex tokenizers (BPE, SentencePiece) that split text into subword tokens. We're going character-by-character because it's simpler and teaches the same concepts.

```python
# Get all unique characters in the text
chars = sorted(list(set(text)))
vocab_size = len(chars)
print(f"Vocabulary size: {vocab_size}")
print(f"Characters: {''.join(chars)}")

# Create mappings between characters and integers
stoi = {ch: i for i, ch in enumerate(chars)}  # string to integer
itos = {i: ch for i, ch in enumerate(chars)}  # integer to string

# Encode: string → list of integers
encode = lambda s: [stoi[c] for c in s]
# Decode: list of integers → string
decode = lambda l: ''.join([itos[i] for i in l])

# Test it
print(encode("hello"))        # [46, 43, 50, 50, 53]
print(decode(encode("hello"))) # "hello"
```

This is doing exactly what a real tokenizer does -- mapping text to numbers and back. The only difference is granularity. BPE might encode "hello" as a single token; we encode it as 5 tokens.

Look at the character list: you'll notice "3" is the only numeral in the entire vocabulary. Every occurrence is in the string "3 KING HENRY VI" -- a single play title repeated in act headers. Shakespeare wrote numbers as words ("twenty", "thousand") and used Roman numerals (which are just regular letters). So your model dedicates an entire embedding vector -- 384 learned parameters -- to a token that appears a handful of times in 1.1 million characters. It will never learn anything meaningful about "3". This is one reason real models don't use character-level tokenization: BPE and similar tokenizers merge rare characters into larger tokens, so you don't waste model capacity on things that barely appear in the data.

**Step 3: Prepare training and validation data**

```python
# Encode the entire text
data = torch.tensor(encode(text), dtype=torch.long)
print(f"Data shape: {data.shape}")  # [1115394] -- a 1D tensor of integers

# Split into train (90%) and validation (10%)
n = int(0.9 * len(data))
train_data = data[:n]
val_data = data[n:]
print(f"Train: {len(train_data):,} tokens, Val: {len(val_data):,} tokens")
```

The validation set is data the model never sees during training. We'll use it to check if the model is learning general patterns (good) or just memorizing the training data (bad -- overfitting, same concept from yesterday).

**Why a sequential split instead of a random one?** In most ML contexts, you'd randomly sample your train/val split. But for sequential text, random sampling would interleave validation characters with training characters, letting the model "cheat" by using nearby context it saw during training. A sequential split guarantees the validation data comes from text the model never saw in any surrounding context. A more principled approach would be to split by scene -- 90% of scenes for training, 10% for validation -- so you avoid leakage within scenes too. But that requires parsing scene boundaries, and the sequential split is good enough for a tutorial.

**What about a test set?** In production ML you'd have three splits: train (for learning), validation (for tuning hyperparameters like learning rate and when to stop), and test (a held-out set you touch _once_ to report honest final results). The danger of only having a val set is that if you keep tweaking hyperparameters to improve val loss, you're implicitly overfitting to the val set too. We're skipping the test set here because our goal is to understand the training loop, not to report publishable numbers. But keep this in mind for Thursday's evals discussion -- rigorous evaluation requires data the model (and the model's developer) have never optimized against.

**Step 4: Build the data loader**

The model doesn't see the whole dataset at once. We feed it random chunks (batches) of a fixed length (block_size).

```python
# Hyperparameters
batch_size = 64      # how many sequences to process in parallel
block_size = 256     # maximum context length
n_embd = 384         # embedding dimension
n_head = 6           # number of attention heads
n_layer = 6          # number of transformer blocks
dropout = 0.2        # regularization (explained below)
learning_rate = 3e-4 # how big of a step to take each update
max_iters = 5000     # total training steps
eval_interval = 500  # how often to check validation loss
eval_iters = 200     # how many batches to average for validation loss estimate

**What is dropout?** During training, dropout randomly zeroes out 20% of the values flowing through the network at each step. This forces the model to not rely too heavily on any single neuron -- it has to spread the knowledge across many neurons, which makes it generalize better. At inference time (when generating text), dropout is turned off and all neurons are active. It's a regularization technique: it makes training slightly worse but makes the model more robust on data it hasn't seen.

def get_batch(split):
    """Get a random batch of training data."""
    data_split = train_data if split == 'train' else val_data
    # Pick random starting positions
    ix = torch.randint(len(data_split) - block_size, (batch_size,))
    # x is the input, y is the target (shifted by one position)
    x = torch.stack([data_split[i:i+block_size] for i in ix])
    y = torch.stack([data_split[i+1:i+1+block_size] for i in ix])
    x, y = x.to(device), y.to(device)
    return x, y

# Test it
xb, yb = get_batch('train')
print(f"Input shape:  {xb.shape}")   # [64, 256]
print(f"Target shape: {yb.shape}")   # [64, 256]
```

The key insight: the target `y` is just the input `x` shifted by one position. We're training the model to predict the next character at every position in the sequence. This is called **next-token prediction**, and it's literally the only objective every GPT model is trained on.

```
Position: 0  1  2  3  4  5  6  7  8  9  10
Input:    T  o     b  e     o  r     n  o
Target:   o     b  e     o  r     n  o  t
```

At each position, the target is simply the next character in the sequence. Position 0 sees "T" and should predict "o". Position 1 sees "o" and should predict " " (space). And so on.

**"Isn't this just a Markov chain?"** If you've seen Markov chains before, this setup looks familiar -- predict the next token from previous tokens. But a Markov chain stores literal frequency counts ("after 'th', 'e' appears 40% of the time") over a fixed window of 2-3 tokens. A Markov chain that looked back 256 characters would need to store counts for every possible 256-character string -- an astronomically large table that could never be filled with enough data. The transformer compresses this into 10.7M learned parameters that _generalize_: it learns continuous representations (embeddings) where similar contexts map to similar vectors, and it uses attention to dynamically decide which of the 256 previous characters matter for each prediction. The result is a model that can produce plausible continuations for sequences it has never seen before, not just reproduce exact n-grams from the training data.

**Step 5: Build the transformer**

This is the big one. Read every line -- this is the entire architecture.

```python
class Head(nn.Module):
    """One head of self-attention."""

    def __init__(self, head_size):
        super().__init__()
        self.key = nn.Linear(n_embd, head_size, bias=False)
        self.query = nn.Linear(n_embd, head_size, bias=False)
        self.value = nn.Linear(n_embd, head_size, bias=False)
        # Causal mask: prevent attending to future positions
        self.register_buffer('tril', torch.tril(torch.ones(block_size, block_size)))
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        B, T, C = x.shape  # batch, sequence length, embedding dim
        k = self.key(x)     # (B, T, head_size)
        q = self.query(x)   # (B, T, head_size)
        v = self.value(x)   # (B, T, head_size)

        # Compute attention scores ("@" is matrix multiplication, same as torch.matmul)
        weights = q @ k.transpose(-2, -1) * (k.shape[-1] ** -0.5)  # (B, T, T)
        # Mask out future positions (causal attention)
        weights = weights.masked_fill(self.tril[:T, :T] == 0, float('-inf'))
        weights = F.softmax(weights, dim=-1)
        weights = self.dropout(weights)

        # Weighted sum of values
        out = weights @ v  # (B, T, head_size)
        return out


class MultiHeadAttention(nn.Module):
    """Multiple heads of self-attention running in parallel."""

    def __init__(self, num_heads, head_size):
        super().__init__()
        self.heads = nn.ModuleList([Head(head_size) for _ in range(num_heads)])
        self.proj = nn.Linear(head_size * num_heads, n_embd)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        # Run all heads in parallel, concatenate their outputs
        out = torch.cat([h(x) for h in self.heads], dim=-1)
        out = self.dropout(self.proj(out))
        return out


class FeedForward(nn.Module):
    """The feed-forward network: two linear layers with GELU activation."""

    def __init__(self, n_embd):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),  # expand to 4x width
            nn.GELU(),
            nn.Linear(4 * n_embd, n_embd),  # project back down
            nn.Dropout(dropout),
        )

    def forward(self, x):
        return self.net(x)


class Block(nn.Module):
    """One transformer block: attention + feed-forward, with residuals and layer norm."""

    def __init__(self, n_embd, n_head):
        super().__init__()
        head_size = n_embd // n_head
        self.sa = MultiHeadAttention(n_head, head_size)
        self.ffwd = FeedForward(n_embd)
        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)

    def forward(self, x):
        x = x + self.sa(self.ln1(x))    # attention with residual connection
        x = x + self.ffwd(self.ln2(x))  # feed-forward with residual connection
        return x


class GPT(nn.Module):
    """The full GPT model."""

    def __init__(self):
        super().__init__()
        self.token_embedding_table = nn.Embedding(vocab_size, n_embd)
        self.position_embedding_table = nn.Embedding(block_size, n_embd)
        self.blocks = nn.Sequential(*[Block(n_embd, n_head) for _ in range(n_layer)])
        self.ln_f = nn.LayerNorm(n_embd)
        self.lm_head = nn.Linear(n_embd, vocab_size)

    def forward(self, idx, targets=None):
        B, T = idx.shape

        # Token embeddings + position embeddings
        tok_emb = self.token_embedding_table(idx)           # (B, T, n_embd)
        pos_emb = self.position_embedding_table(torch.arange(T, device=device))  # (T, n_embd)
        x = tok_emb + pos_emb                               # (B, T, n_embd)

        # Pass through all transformer blocks
        x = self.blocks(x)                                   # (B, T, n_embd)
        x = self.ln_f(x)                                     # (B, T, n_embd)
        logits = self.lm_head(x)                             # (B, T, vocab_size)

        # Calculate loss if targets are provided
        if targets is None:
            loss = None
        else:
            B, T, C = logits.shape
            logits = logits.view(B * T, C)
            targets = targets.view(B * T)
            loss = F.cross_entropy(logits, targets)

        return logits, loss

    def generate(self, idx, max_new_tokens):
        """Generate new tokens using autoregressive generation.

        "Autoregressive" means: generate one token, append it to the input,
        then use the extended input to generate the next token. Each token
        is conditioned on all previous tokens (including previously generated
        ones). This is how every GPT-style model generates text -- one token
        at a time, feeding its own output back as input.
        """
        for _ in range(max_new_tokens):
            # Crop context to block_size (can't exceed our position embeddings)
            idx_cond = idx[:, -block_size:]
            # Get predictions
            logits, _ = self(idx_cond)
            # Focus on the last time step
            logits = logits[:, -1, :]  # (B, vocab_size)
            # Apply softmax to get probabilities
            probs = F.softmax(logits, dim=-1)
            # Sample from the distribution
            idx_next = torch.multinomial(probs, num_samples=1)  # (B, 1)
            # Append to the sequence and use it as input for the next step
            idx = torch.cat((idx, idx_next), dim=1)  # (B, T+1)
        return idx


# Create the model
model = GPT().to(device)
n_params = sum(p.numel() for p in model.parameters())
print(f"Model has {n_params:,} parameters ({n_params/1e6:.1f}M)")
```

That's it. That's a GPT. ~100 lines of PyTorch. Every model you've used this week -- Llama, Qwen, GPT-4 -- is a scaled-up version of exactly this code.

**Step 6: See what the untrained model generates**

Before training, the model's weights are random. Let's see what random weights produce:

```python
# Generate from the untrained model
context = torch.zeros((1, 1), dtype=torch.long, device=device)  # start with a newline
print("=== UNTRAINED MODEL OUTPUT ===")
print(decode(model.generate(context, max_new_tokens=300)[0].tolist()))
print("==============================")
```

You'll see complete garbage -- random characters with no structure. This is your baseline. Remember what this looks like, because in 10 minutes it's going to look very different.

**Step 7: Write the training loop**

This is the core of everything. Every transformer-based model -- GPT, Claude, Llama, Gemini, all of them -- was created by a loop like this.

```python
@torch.no_grad()
def estimate_loss():
    """Average loss over multiple batches for a more stable estimate."""
    out = {}
    model.eval()
    for split in ['train', 'val']:
        losses = torch.zeros(eval_iters)
        for k in range(eval_iters):
            X, Y = get_batch(split)
            _, loss = model(X, Y)
            losses[k] = loss.item()
        out[split] = losses.mean()
    model.train()
    return out

# Create the optimizer
optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)

print("Starting training...")
for iter in range(max_iters):

    # Every eval_interval steps, evaluate on train and val sets
    if iter % eval_interval == 0 or iter == max_iters - 1:
        losses = estimate_loss()
        print(f"step {iter:>5d}: train loss {losses['train']:.4f}, val loss {losses['val']:.4f}")

    # Get a batch of training data
    xb, yb = get_batch('train')

    # Forward pass: compute predictions and loss
    logits, loss = model(xb, yb)

    # Backward pass: compute gradients
    optimizer.zero_grad(set_to_none=True)
    loss.backward()

    # Optimizer step: update weights
    optimizer.step()

print("Training complete!")
```

**What you should see:**

```
step     0: train loss 4.1742, val loss 4.1756
step   500: train loss 1.8108, val loss 1.9876
step  1000: train loss 1.5340, val loss 1.7104
step  1500: train loss 1.3874, val loss 1.5789
step  2000: train loss 1.2942, val loss 1.5134
step  2500: train loss 1.2198, val loss 1.4832
step  3000: train loss 1.1581, val loss 1.4695
step  3500: train loss 1.1029, val loss 1.4629
step  4000: train loss 1.0545, val loss 1.4677
step  4500: train loss 1.0069, val loss 1.4726
step  4999: train loss 0.9650, val loss 1.4830
```

Training should take about **5-8 minutes** on a T4 GPU.

Let's unpack what these numbers mean:

- **Train loss** keeps dropping. The model is getting better at predicting the next character in the training data.
- **Val loss** drops at first, then flattens and eventually starts rising slightly. The model has learned all the generalizable patterns it can from the data and is starting to memorize training-specific details. This is overfitting -- the same concept from yesterday, but now you're watching it happen in real time.
- **The gap between train and val loss** is the overfitting gap. When it's small, the model is learning general patterns. When it's large, the model is memorizing.
- **Starting loss of ~4.17** makes sense mathematically: `-ln(1/65) ≈ 4.17`. This is the loss you'd get from predicting all 65 characters with equal probability (random guessing). The model hasn't learned anything yet.
- **Val loss of ~1.48** means the model has gotten dramatically better than random, but it's not perfect. For reference, a perfect model that always predicts the right next character would have loss 0.

**Step 8: Generate text from your trained model**

```python
# Generate from the trained model
context = torch.zeros((1, 1), dtype=torch.long, device=device)
print("=== TRAINED MODEL OUTPUT ===")
generated = decode(model.generate(context, max_new_tokens=500)[0].tolist())
print(generated)
print("============================")
```

You should see something that looks vaguely Shakespearean -- proper nouns, "thee" and "thou", dialogue formatted with character names followed by colons, iambic-ish rhythm. It won't make _sense_, but it'll _look_ like Shakespeare. The model has learned the statistical structure of the text without understanding any of it.

**Step 9: Try different prompts**

```python
def generate_from_prompt(prompt, max_new_tokens=300):
    """Generate text starting from a given prompt."""
    context = torch.tensor([encode(prompt)], dtype=torch.long, device=device)
    output = model.generate(context, max_new_tokens=max_new_tokens)
    return decode(output[0].tolist())

# Try some prompts
prompts = [
    "ROMEO:",
    "To be or not to be",
    "The king",
    "JULIET:\nO Romeo, Romeo,",
    "First Citizen:\nWe are",
]

for prompt in prompts:
    print(f"\n{'='*60}")
    print(f"PROMPT: {prompt}")
    print(f"{'='*60}")
    print(generate_from_prompt(prompt, max_new_tokens=200))
```

Notice how the model picks up context from the prompt. If you start with "ROMEO:", it'll generate dialogue. If you start with "The king", it'll generate prose. The model has learned that different prefixes predict different continuations -- that's attention at work.

**Watch out:** If your prompt contains a character that's not in Shakespeare's vocabulary (like a digit other than "3", or "@", or "!"), `encode()` will crash with a `KeyError`. The model only knows the 65 characters it saw during training. This is a real limitation of character-level tokenization -- real tokenizers handle unknown characters gracefully by falling back to byte-level encoding.

**Step 10: Save your model**

```python
# Save the model weights
torch.save({
    'model_state_dict': model.state_dict(),
    'chars': chars,
    'vocab_size': vocab_size,
    'n_embd': n_embd,
    'n_head': n_head,
    'n_layer': n_layer,
    'block_size': block_size,
}, 'shakespeare_gpt.pt')

print(f"Model saved! File size: {os.path.getsize('shakespeare_gpt.pt') / 1e6:.1f} MB")
```

To load the model back later (e.g., after restarting your Colab runtime), you'll need to re-run the model definition code (Steps 2-5) and then load the saved weights:

```python
checkpoint = torch.load('shakespeare_gpt.pt')
model = GPT().to(device)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()
print("Model loaded!")
```

This skips the entire training step, so you can jump straight to generation and experiments.

You just trained a language model from scratch. It's tiny and it's terrible, but every single weight in it was learned from data by your training loop.

### Path B: Local (Mac or CPU)

If you prefer to run locally instead of Colab, the code is identical. The only difference is device selection and training will be slower.

**Step 1: Set up the project**

```bash
uv init train-gpt
cd train-gpt
uv add torch
```

**Step 2: Create the training script**

Create `train.py` and paste in all the code from Steps 1-10 above. The `device` line will automatically select MPS (Apple Silicon GPU) or CPU:

```python
# Replace the device line with:
device = 'cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu')
print(f'Using device: {device}')
```

**Step 3: Run it**

```bash
uv run python train.py
```

**Expected training times:**
- Apple M1/M2/M3 (MPS): ~10-15 minutes
- CPU only: ~30-60 minutes (consider reducing `max_iters` to 3000)

If CPU training is too slow, reduce the model size:

```python
# Smaller model for CPU training
n_embd = 192     # was 384
n_head = 6       # same
n_layer = 4      # was 6
max_iters = 3000  # was 5000
```

This gives a ~3M parameter model that trains faster but produces lower-quality output.

---

## Part 3: Understanding What Just Happened

Now that you've done it, let's make sure you understand each piece.

### The Training Loop, Annotated

Every training step does exactly four things:

```python
# 1. FORWARD PASS: feed data through the model, get predictions
logits, loss = model(xb, yb)
# The model sees 64 sequences of 256 characters each.
# For each character, it predicts what comes next.
# `loss` measures how wrong those predictions are (cross-entropy).

# 2. ZERO GRADIENTS: clear out gradients from the previous step
optimizer.zero_grad(set_to_none=True)
# Without this, gradients would accumulate across steps.

# 3. BACKWARD PASS: compute gradients via backpropagation
loss.backward()
# PyTorch walks backward through every operation in the forward pass,
# computing how much each weight contributed to the loss.
# This is the chain rule from calculus, applied automatically.

# 4. OPTIMIZER STEP: update weights to reduce loss
optimizer.step()
# AdamW looks at the gradient for each weight and nudges it
# in the direction that would make the loss smaller.
# The learning rate (3e-4) controls how big each nudge is.
```

This four-step loop is universal. Fine-tuning (yesterday) ran the same loop -- the only difference was that most weights were frozen (LoRA) and the data was your custom dataset instead of Shakespeare.

### What Is Loss, Really?

Cross-entropy loss measures how surprised the model is by the correct answer. If the model predicts the next character is 'e' with 90% probability and it actually is 'e', the loss is low (-log(0.9) ≈ 0.1). If the model predicts 'e' with 1% probability but the answer is 'e', the loss is high (-log(0.01) ≈ 4.6).

The starting loss of ~4.17 means the model was guessing uniformly across all 65 characters. The final loss of ~1.0 means the model is, on average, assigning about 37% probability to the correct next character (e^(-1.0) ≈ 0.37). That might not sound impressive, but remember -- it's predicting the exact next character out of 65 options. Random chance is 1.5%.

### What Is Backpropagation, Really?

You don't need to understand the math, but you should understand the concept. Backpropagation answers the question: "For each of the 10.7 million weights in this model, how much did that weight contribute to the loss, and in which direction?"

Think of it like blame assignment. The loss was 1.5. Backprop figures out that weight #4,291,003 pushed the loss up by 0.0002, and weight #7,832,441 pushed it down by 0.0001. The optimizer then adjusts each weight proportionally -- weights that increased the loss get nudged down, weights that decreased it get nudged up.

The magic of PyTorch's `autograd` is that it does this automatically. When you call `loss.backward()`, PyTorch traces back through every matrix multiplication, addition, softmax, and GELU in your model and computes the gradient of the loss with respect to every single trainable parameter. This is why you had to call `optimizer.zero_grad()` first -- those gradients need to start at zero for each step.

### What Is the Optimizer Doing?

`AdamW` is more sophisticated than "just nudge each weight by its gradient." It maintains:

- **Momentum:** a running average of recent gradients. If a weight has been consistently pushed in one direction, Adam moves it faster in that direction. If gradients are noisy and flip-flopping, Adam moves more cautiously.
- **Adaptive learning rates:** each weight gets its own effective learning rate based on the historical magnitude of its gradients. Weights that always get large gradients get smaller steps. Weights that rarely get gradients get larger steps when they do.
- **Weight decay (the W in AdamW):** a regularization term that gently pushes all weights toward zero, preventing any single weight from growing too large.

You don't need to understand the formulas. Just know that Adam is much better than naive gradient descent, and that's why everyone uses it.

**The memory cost:** Notice that Adam stores _two extra values per weight_ (momentum and squared gradient history). That means the optimizer state is 2x the model size, and total training memory is 3x the parameter count (weights + two optimizer states). For our 10.7M model this is trivial. For a 70B model, that's 210 billion floats -- hundreds of gigabytes just to hold the optimizer state. This is a major reason why _training_ a model requires far more memory than _inference_ (which only needs the weights). It's the same pattern you see in other domains: database indices that are larger than the data they index, error-correcting codes with more parity bits than data bits. The overhead that makes the system work well often exceeds the "actual" data.

### Why Did Validation Loss Stop Improving?

Look at your loss curves again. Training loss kept dropping to ~0.96, but validation loss bottomed out around ~1.48 and started creeping up. This is overfitting.

Your model has 10.7M parameters but only 1M characters of training data. The model has more than enough capacity to memorize the training data (low training loss) but the patterns it memorizes aren't generalizable (high validation loss).

This is the fundamental tension in machine learning: **capacity vs. data.** More parameters let the model learn more complex patterns, but if you don't have enough data, those parameters memorize instead of generalize. This is why frontier models need trillions of tokens of training data -- they have so many parameters that anything less would result in massive overfitting.

---

## Part 4: Experiments to Try Right Now

Before moving to the afternoon exploration, try these quick experiments to build intuition. Each takes less than 5 minutes.

### Experiment 1: Temperature

Add a temperature parameter to generation:

```python
def generate_with_temperature(prompt, temperature=1.0, max_new_tokens=200):
    """Generate with adjustable temperature."""
    context = torch.tensor([encode(prompt)], dtype=torch.long, device=device)
    idx = context

    for _ in range(max_new_tokens):
        idx_cond = idx[:, -block_size:]
        logits, _ = model(idx_cond)
        logits = logits[:, -1, :] / temperature  # <-- temperature scaling
        probs = F.softmax(logits, dim=-1)
        idx_next = torch.multinomial(probs, num_samples=1)
        idx = torch.cat((idx, idx_next), dim=1)

    return decode(idx[0].tolist())

prompt = "ROMEO:\n"
print("--- Temperature 0.5 (more conservative) ---")
print(generate_with_temperature(prompt, temperature=0.5))
print("\n--- Temperature 1.0 (default) ---")
print(generate_with_temperature(prompt, temperature=1.0))
print("\n--- Temperature 1.5 (more creative/chaotic) ---")
print(generate_with_temperature(prompt, temperature=1.5))
```

Now you understand what the "temperature" slider in ChatGPT actually does. Low temperature → the model picks the most likely next character more deterministically. High temperature → the model samples more randomly, producing more varied but less coherent text.

### Experiment 2: Top-k Sampling

```python
def generate_with_top_k(prompt, k=10, max_new_tokens=200):
    """Only sample from the top k most likely next tokens."""
    context = torch.tensor([encode(prompt)], dtype=torch.long, device=device)
    idx = context

    for _ in range(max_new_tokens):
        idx_cond = idx[:, -block_size:]
        logits, _ = model(idx_cond)
        logits = logits[:, -1, :]
        # Zero out everything except the top k
        top_k_values, _ = torch.topk(logits, k)
        logits[logits < top_k_values[:, [-1]]] = float('-inf')
        probs = F.softmax(logits, dim=-1)
        idx_next = torch.multinomial(probs, num_samples=1)
        idx = torch.cat((idx, idx_next), dim=1)

    return decode(idx[0].tolist())

print("--- Top-3 (very constrained) ---")
print(generate_with_top_k("ROMEO:\n", k=3))
print("\n--- Top-40 (less constrained) ---")
print(generate_with_top_k("ROMEO:\n", k=40))
```

Top-k prevents the model from ever picking a very unlikely character, reducing gibberish at the cost of diversity. Claude, GPT, and other frontier models use a combination of temperature, top-k, and top-p (nucleus sampling) to control generation quality.

---

## Part 5: Key Concepts

### Embeddings

Your model's first layer converts each character into a vector of 384 numbers. Why? Because neural networks operate on continuous numbers, not discrete symbols. The embedding is a learned representation -- during training, the model discovers that certain characters should have similar vectors because they appear in similar contexts.

In a word-level model, embedding similarity is even more striking: "king" and "queen" end up with similar vectors, as do "Paris" and "London." This emergent structure is one of the most fascinating properties of language models.

### Attention as Information Routing

Attention is the mechanism that lets the model decide which earlier tokens matter for predicting the next one. Without attention, each position would only see its own embedding -- the model would have no way to use context.

The **causal mask** (`tril`) is critical: it prevents the model from looking at future tokens during training. Without it, the model could "cheat" by looking ahead at the answer. This is why the mask is a lower-triangular matrix -- position 5 can attend to positions 0-5 but not 6+.

### Residual Connections

The `x = x + self.sa(self.ln1(x))` pattern is a residual connection. Without it, the signal has to pass through every layer sequentially, and gradients get weaker the deeper the network goes (the "vanishing gradient problem"). Residual connections create a "highway" that lets gradients flow directly from the loss back to early layers. This is why deep transformers are trainable at all -- without residuals, you couldn't stack more than a few layers.

### The Scaling Hypothesis

Your 10.7M parameter model produces garbage Shakespeare. GPT-2 (124M) produces mediocre text. GPT-3 (175B) produces good text. GPT-4 (~1.8T MoE) produces excellent text. The pattern: same architecture, more parameters, more data, better results. This is the **scaling hypothesis** -- the controversial but empirically supported idea that we can keep making models better primarily by making them bigger and feeding them more data. Whether this continues indefinitely is one of the biggest open questions in AI.

---

## Exploration Directions (Afternoon)

Pick one or more of these to go deeper.

### 1. Architecture Experiments

Change the model's hyperparameters and retrain. Compare the results.

| Experiment | Change | What to observe |
|-----------|--------|-----------------|
| **Deeper** | `n_layer = 12` (keep `n_embd = 384`) | Does more depth help? Does training take longer? |
| **Wider** | `n_embd = 768, n_head = 12` (keep `n_layer = 6`) | Does more width help? How does VRAM usage change? |
| **Tiny** | `n_embd = 64, n_head = 2, n_layer = 2` | How bad can a ~200K parameter model get? |
| **More heads** | `n_head = 12` (keep `n_embd = 384`) | Each head is now 32-dim instead of 64-dim. Better or worse? |
| **No dropout** | `dropout = 0.0` | How much worse does overfitting get? |
| **Huge context** | `block_size = 512` | Can the model use longer-range context? (Needs more VRAM) |

For each experiment, record: parameter count, final train loss, final val loss, qualitative generation quality. You're building intuition for how architectural choices affect model behavior.

### 2. Train on Different Data

Shakespeare is fun but it's just one dataset. Try training on something else entirely:

**Your own writing:**
```python
# Gather your Slack messages, blog posts, journal entries, etc.
# Concatenate them into a single text file
# Train the model on it
# Generate text in your own (mangled) writing style
```

**Code:**
```python
# Download a code dataset -- Python source code works well
# The model will learn to generate syntactically plausible (but meaningless) Python
url = 'https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt'
# Replace with a dump of Python code -- try concatenating files from a repo you know well
```

**Multiple languages:** Concatenate texts in English, Spanish, and French. Does the model learn to separate them? Does it mix them? (This is how multilingual models work, just at a much larger scale.)

**Music:** Download ABC notation music files and train on them. The model will learn to generate syntactically valid (but musically dubious) sheet music.

### 3. Visualize Attention

Add code to extract and visualize the attention patterns. This shows you what the model has learned to look at:

```python
import matplotlib.pyplot as plt

def visualize_attention(prompt, layer=0, head=0):
    """Visualize what the model attends to for a given prompt."""
    context = torch.tensor([encode(prompt)], dtype=torch.long, device=device)

    # Hook to capture attention weights
    attention_weights = []
    def hook_fn(module, input, output):
        # Recompute attention weights for visualization
        B, T, C = input[0].shape
        k = module.key(input[0])
        q = module.query(input[0])
        weights = q @ k.transpose(-2, -1) * (k.shape[-1] ** -0.5)
        weights = weights.masked_fill(module.tril[:T, :T] == 0, float('-inf'))
        weights = F.softmax(weights, dim=-1)
        attention_weights.append(weights.detach().cpu())

    # Register hook on the target attention head
    target_head = model.blocks[layer].sa.heads[head]
    handle = target_head.register_forward_hook(hook_fn)

    # Forward pass
    with torch.no_grad():
        model(context)

    handle.remove()

    # Plot
    attn = attention_weights[0][0].numpy()
    chars_list = list(prompt)

    fig, ax = plt.subplots(figsize=(10, 10))
    ax.imshow(attn, cmap='viridis')
    ax.set_xticks(range(len(chars_list)))
    ax.set_yticks(range(len(chars_list)))
    ax.set_xticklabels(chars_list, rotation=90)
    ax.set_yticklabels(chars_list)
    ax.set_xlabel('Attending TO (key)')
    ax.set_ylabel('Attending FROM (query)')
    ax.set_title(f'Attention Pattern - Layer {layer}, Head {head}')
    plt.tight_layout()
    plt.show()

visualize_attention("To be or not to be")
```

Look for patterns: does one head always attend to the previous character? Does another attend to spaces (word boundaries)? Does any head attend to matching characters? Different heads specialize in different patterns -- this is why multi-head attention is more powerful than single-head.

### 4. Scale Up on Modal

Your Colab T4 has 16GB of VRAM. Modal gives you access to A10G (24GB), A100 (40/80GB), and H100 (80GB) GPUs. Train a bigger model on more data.

**Setup:**

```bash
pip install modal
modal setup
```

**Create `modal_train.py`:**

```python
import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("torch")
)

app = modal.App("train-gpt", image=image)

volume = modal.Volume.from_name("training-data", create_if_missing=True)

@app.function(
    gpu="A100",
    timeout=3600,
    volumes={"/data": volume},
)
def train():
    import torch
    import torch.nn as nn
    from torch.nn import functional as F
    import urllib.request

    device = 'cuda'

    # Download data
    url = 'https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt'
    urllib.request.urlretrieve(url, '/data/shakespeare.txt')

    # ... paste in the full model and training code here ...
    # But with bigger hyperparameters:
    n_embd = 768
    n_head = 12
    n_layer = 12
    block_size = 512
    max_iters = 10000
    batch_size = 128

    # This will train a ~85M parameter model
    # On an A100, training 10k steps should take ~15-20 minutes

    # ... (full training code) ...

    # Save to the volume so you can download it later
    torch.save(model.state_dict(), '/data/shakespeare_gpt_large.pt')
    print("Model saved to /data/shakespeare_gpt_large.pt")
```

```bash
modal run modal_train.py
```

Compare the output quality of the 10M model (Colab) vs. the 85M model (Modal). The bigger model should produce noticeably more coherent text, because it has more capacity to learn patterns -- but you might also see more overfitting on the tiny Shakespeare dataset (1M chars isn't much for an 85M model). This is the data vs. capacity tradeoff you read about in Part 3.

### 5. Training Dynamics Experiments

Investigate how training hyperparameters affect learning:

**Learning rate sweep:**
```python
# Try learning rates: 1e-2, 3e-3, 3e-4, 1e-4, 1e-5
# Plot loss curves for each on the same chart
# Too high: loss explodes or oscillates
# Too low: loss barely moves
# Just right: smooth, fast decrease then plateau
```

**Batch size experiments:**
- Batch size 16 vs. 64 vs. 256
- Larger batches give more stable gradients but update less frequently
- How does this affect final loss and training speed?

**Learning rate warmup and decay:**
```python
# Implement a cosine learning rate schedule
import math

def get_lr(step):
    warmup_steps = 100
    if step < warmup_steps:
        return learning_rate * step / warmup_steps
    decay_ratio = (step - warmup_steps) / (max_iters - warmup_steps)
    return learning_rate * 0.5 * (1.0 + math.cos(math.pi * decay_ratio))

# In the training loop, update the learning rate each step:
for param_group in optimizer.param_groups:
    param_group['lr'] = get_lr(iter)
```

This is how real models are trained -- warmup to avoid instability in the early noisy gradient phase, then cosine decay so the model can settle into a good minimum. Does this improve your final validation loss?

### 6. Implement a Real Tokenizer

Replace the character-level tokenizer with a proper BPE (Byte Pair Encoding) tokenizer. This is what real models use.

```python
# Option 1: Use tiktoken (OpenAI's tokenizer)
# pip install tiktoken
import tiktoken
enc = tiktoken.get_encoding("gpt2")  # GPT-2's tokenizer

# Now your vocab_size is 50257 instead of 65
# Each "token" represents a common subword (e.g., "the", "ing", " to")
# The same text requires far fewer tokens, so the model can see more context
```

With BPE, the same Shakespeare text becomes ~300K tokens instead of 1.1M characters. Each token carries more meaning, so the model learns faster. But the vocabulary is much larger (50K vs. 65), so the embedding table is bigger. This is the fundamental tradeoff in tokenizer design.

### 7. Reproduce nanoGPT

Karpathy's [nanoGPT](https://github.com/karpathy/nanoGPT) is a more complete version of what you just built. It adds:

- Real BPE tokenization
- Training on the OpenWebText dataset (8M documents)
- Distributed training across multiple GPUs
- Mixed precision (FP16) training
- Gradient accumulation
- Model checkpointing and resumption

Clone it, read it, and try to reproduce GPT-2 (124M) on Modal with an A100. The goal isn't to match OpenAI's results (they trained on way more data), but to understand the engineering that bridges the gap between your toy model and a production model.

### 8. The Loss Prediction Game

Here's a challenge: before training, predict what the final validation loss will be for a given configuration. After a few experiments, you'll develop intuition for how model size, data size, and training duration interact. This is the beginning of understanding **scaling laws** -- the empirical relationships that labs use to decide how to allocate compute budgets.

Start a spreadsheet:

| n_params | train_chars | max_iters | predicted_val_loss | actual_val_loss |
|----------|-------------|-----------|--------------------|--------------------|
| 10.7M | 1M | 5000 | ? | 1.48 |
| 3M | 1M | 3000 | ? | ? |
| 85M | 1M | 5000 | ? | ? |
| 10.7M | 1M | 20000 | ? | ? |

Can you predict within 0.1? If so, you have a working mental model of scaling.

---

## Appendix: Complete Colab Notebook

If you want the full working notebook in one shot, here it is. Create a new Colab notebook (Runtime → Change runtime type → T4 GPU), then paste each cell in order.

**Cell 1: Setup and data**

```python
import torch
import torch.nn as nn
from torch.nn import functional as F
import urllib.request
import os

device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f'Using device: {device}')

# Download Shakespeare (skips if already present)
if not os.path.exists('shakespeare.txt'):
    url = 'https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt'
    urllib.request.urlretrieve(url, 'shakespeare.txt')
    print("Downloaded shakespeare.txt")
else:
    print("Using existing shakespeare.txt")

with open('shakespeare.txt', 'r', encoding='utf-8') as f:
    text = f.read()

print(f"Dataset size: {len(text):,} characters")

# Character-level tokenizer
chars = sorted(list(set(text)))
vocab_size = len(chars)
stoi = {ch: i for i, ch in enumerate(chars)}
itos = {i: ch for i, ch in enumerate(chars)}
encode = lambda s: [stoi[c] for c in s]
decode = lambda l: ''.join([itos[i] for i in l])

# Prepare data
data = torch.tensor(encode(text), dtype=torch.long)
n = int(0.9 * len(data))
train_data = data[:n]
val_data = data[n:]
print(f"Vocab size: {vocab_size}, Train: {len(train_data):,}, Val: {len(val_data):,}")
```

**Cell 2: Hyperparameters and data loader**

```python
batch_size = 64
block_size = 256
n_embd = 384
n_head = 6
n_layer = 6
dropout = 0.2
learning_rate = 3e-4
max_iters = 5000
eval_interval = 500
eval_iters = 200

def get_batch(split):
    data_split = train_data if split == 'train' else val_data
    ix = torch.randint(len(data_split) - block_size, (batch_size,))
    x = torch.stack([data_split[i:i+block_size] for i in ix])
    y = torch.stack([data_split[i+1:i+1+block_size] for i in ix])
    x, y = x.to(device), y.to(device)
    return x, y
```

**Cell 3: Model definition**

```python
class Head(nn.Module):
    def __init__(self, head_size):
        super().__init__()
        self.key = nn.Linear(n_embd, head_size, bias=False)
        self.query = nn.Linear(n_embd, head_size, bias=False)
        self.value = nn.Linear(n_embd, head_size, bias=False)
        self.register_buffer('tril', torch.tril(torch.ones(block_size, block_size)))
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        B, T, C = x.shape
        k = self.key(x)
        q = self.query(x)
        v = self.value(x)
        weights = q @ k.transpose(-2, -1) * (k.shape[-1] ** -0.5)
        weights = weights.masked_fill(self.tril[:T, :T] == 0, float('-inf'))
        weights = F.softmax(weights, dim=-1)
        weights = self.dropout(weights)
        out = weights @ v
        return out

class MultiHeadAttention(nn.Module):
    def __init__(self, num_heads, head_size):
        super().__init__()
        self.heads = nn.ModuleList([Head(head_size) for _ in range(num_heads)])
        self.proj = nn.Linear(head_size * num_heads, n_embd)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        out = torch.cat([h(x) for h in self.heads], dim=-1)
        out = self.dropout(self.proj(out))
        return out

class FeedForward(nn.Module):
    def __init__(self, n_embd):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.GELU(),
            nn.Linear(4 * n_embd, n_embd),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        return self.net(x)

class Block(nn.Module):
    def __init__(self, n_embd, n_head):
        super().__init__()
        head_size = n_embd // n_head
        self.sa = MultiHeadAttention(n_head, head_size)
        self.ffwd = FeedForward(n_embd)
        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)

    def forward(self, x):
        x = x + self.sa(self.ln1(x))
        x = x + self.ffwd(self.ln2(x))
        return x

class GPT(nn.Module):
    def __init__(self):
        super().__init__()
        self.token_embedding_table = nn.Embedding(vocab_size, n_embd)
        self.position_embedding_table = nn.Embedding(block_size, n_embd)
        self.blocks = nn.Sequential(*[Block(n_embd, n_head) for _ in range(n_layer)])
        self.ln_f = nn.LayerNorm(n_embd)
        self.lm_head = nn.Linear(n_embd, vocab_size)

    def forward(self, idx, targets=None):
        B, T = idx.shape
        tok_emb = self.token_embedding_table(idx)
        pos_emb = self.position_embedding_table(torch.arange(T, device=device))
        x = tok_emb + pos_emb
        x = self.blocks(x)
        x = self.ln_f(x)
        logits = self.lm_head(x)

        if targets is None:
            loss = None
        else:
            B, T, C = logits.shape
            logits = logits.view(B * T, C)
            targets = targets.view(B * T)
            loss = F.cross_entropy(logits, targets)

        return logits, loss

    def generate(self, idx, max_new_tokens):
        for _ in range(max_new_tokens):
            idx_cond = idx[:, -block_size:]
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :]
            probs = F.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)
            idx = torch.cat((idx, idx_next), dim=1)
        return idx

model = GPT().to(device)
n_params = sum(p.numel() for p in model.parameters())
print(f"Model has {n_params:,} parameters ({n_params/1e6:.1f}M)")
```

**Cell 4: Generate from untrained model**

```python
context = torch.zeros((1, 1), dtype=torch.long, device=device)
print("=== UNTRAINED MODEL OUTPUT ===")
print(decode(model.generate(context, max_new_tokens=300)[0].tolist()))
```

**Cell 5: Train**

```python
@torch.no_grad()
def estimate_loss():
    out = {}
    model.eval()
    for split in ['train', 'val']:
        losses = torch.zeros(eval_iters)
        for k in range(eval_iters):
            X, Y = get_batch(split)
            _, loss = model(X, Y)
            losses[k] = loss.item()
        out[split] = losses.mean()
    model.train()
    return out

optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)

print("Starting training...")
for iter in range(max_iters):
    if iter % eval_interval == 0 or iter == max_iters - 1:
        losses = estimate_loss()
        print(f"step {iter:>5d}: train loss {losses['train']:.4f}, val loss {losses['val']:.4f}")

    xb, yb = get_batch('train')
    logits, loss = model(xb, yb)
    optimizer.zero_grad(set_to_none=True)
    loss.backward()
    optimizer.step()

print("Training complete!")
```

**Cell 6: Generate from trained model**

```python
context = torch.zeros((1, 1), dtype=torch.long, device=device)
print("=== TRAINED MODEL OUTPUT ===")
print(decode(model.generate(context, max_new_tokens=500)[0].tolist()))

# Try prompts
def generate_from_prompt(prompt, max_new_tokens=300):
    context = torch.tensor([encode(prompt)], dtype=torch.long, device=device)
    output = model.generate(context, max_new_tokens=max_new_tokens)
    return decode(output[0].tolist())

for prompt in ["ROMEO:", "To be or not to be", "The king", "JULIET:\nO Romeo,"]:
    print(f"\n{'='*60}")
    print(f"PROMPT: {prompt}")
    print(f"{'='*60}")
    print(generate_from_prompt(prompt, max_new_tokens=200))
```

**Cell 7: Save model**

```python
torch.save({
    'model_state_dict': model.state_dict(),
    'chars': chars,
    'vocab_size': vocab_size,
    'n_embd': n_embd,
    'n_head': n_head,
    'n_layer': n_layer,
    'block_size': block_size,
}, 'shakespeare_gpt.pt')

print(f"Model saved! File size: {os.path.getsize('shakespeare_gpt.pt') / 1e6:.1f} MB")
```

---

## Key Resources

### Videos

- [Andrej Karpathy's "Let's build GPT"](https://www.youtube.com/watch?v=kCc8FmEb1nY) -- the single best resource for understanding transformers from code. 2 hours, covers everything in this tutorial and more.
- [Andrej Karpathy's "Intro to Large Language Models"](https://www.youtube.com/watch?v=zjkBMFhNj_g) -- 1-hour high-level overview of the entire LLM landscape
- [3Blue1Brown's "Attention in transformers, visually explained"](https://www.youtube.com/watch?v=eMlx5fFNoYc) -- beautiful visual explanation of the attention mechanism

### Code

- [nanoGPT](https://github.com/karpathy/nanoGPT) -- Karpathy's clean, minimal GPT implementation. The natural next step after this tutorial.
- [minGPT](https://github.com/karpathy/minGPT) -- Karpathy's earlier, more educational GPT implementation
- [The Annotated Transformer](https://nlp.seas.harvard.edu/annotated-transformer/) -- the original "Attention Is All You Need" paper, annotated with working PyTorch code

### Papers

- ["Attention Is All You Need"](https://arxiv.org/abs/1706.03762) -- the original transformer paper (Vaswani et al., 2017). The architecture you just built.
- ["Scaling Laws for Neural Language Models"](https://arxiv.org/abs/2001.08361) -- the Kaplan et al. paper that showed model performance is predictable from compute, data, and parameters
- ["Chinchilla: Training Compute-Optimal Large Language Models"](https://arxiv.org/abs/2203.15556) -- revised scaling laws showing most models are undertrained relative to their size

### Tutorials

- [PyTorch official tutorials](https://pytorch.org/tutorials/) -- if you want to deepen your PyTorch knowledge
- [Hugging Face NLP Course](https://huggingface.co/learn/nlp-course/) -- comprehensive free course covering transformers, tokenizers, and more
