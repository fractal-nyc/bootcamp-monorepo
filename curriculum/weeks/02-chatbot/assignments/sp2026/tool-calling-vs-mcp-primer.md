# Tool Calling vs. MCP: A Primer

## The One-Sentence Version

**Tool calling** is a model capability — the LLM outputs structured JSON to invoke a function. **MCP (Model Context Protocol)** is a standardized protocol for how tools get connected, discovered, and shared across clients. MCP doesn't replace tool calling; it packages and standardizes the ecosystem around it.

---

## Tool Calling (Function Calling)

> **Terminology note:** "Tool calling," "function calling," and "tool use" all refer to the same pattern. OpenAI popularized "function calling," Anthropic's docs say "tool use," and "tool calling" has become the common shorthand. You'll see these used interchangeably in the wild.

When an LLM supports tool calling, it means the model has been trained to output structured data matching a specific schema instead of just natural language. Here's the workflow:

1. You define a tool schema in your API request (e.g., `get_weather(city: string)`).
2. The model decides a tool is needed and emits a structured invocation: `{"tool": "get_weather", "args": {"city": "Paris"}}`.
3. **Your code** executes the function — the model never runs anything itself.
4. You feed the result back to the model, which incorporates it into its response.

The key insight: tool calling is stateless and request-scoped. You declare the available tools in every API call, and the model picks from that menu.

### Strengths

- Simple, direct, and fast — minimal moving parts between model and execution.
- You have total control over which tools exist, authentication, rate limits, and logging.
- Excellent for standalone applications with a known, static set of tools.
- Every major LLM provider supports it (OpenAI, Anthropic, Google), so the pattern is universal even if schemas differ slightly.

### Limitations

- **Low portability.** Tool definitions are bespoke per application. A tool written for one provider's schema may need adjustment for another.
- **No built-in discovery.** You manually decide which tools to inject into each request. With 50 tools, you're managing context window budgets yourself.
- **Scope is narrow.** Tool calling is strictly action-oriented — it does things. There's no standard mechanism for exposing read-only data or reusable prompt templates alongside your functions.
- **Reuse requires glue code.** If you want your internal database accessible to ChatGPT, Claude, and a custom agent, you typically write separate integrations or lean on middleware.

---

## MCP (Model Context Protocol)

MCP is an open standard (open-sourced by Anthropic) that defines a client-server protocol for connecting AI applications to tools, data, and prompts. Think of it as a universal plug — any MCP-compliant client can connect to any MCP server and discover what's available.

The architecture has three roles:

- **Host**: The application the user interacts with (e.g., Claude Desktop, an IDE).
- **Client**: The component inside the host that manages MCP connections.
- **Server**: An external process that exposes capabilities over the protocol.

The workflow:

1. You build an MCP server (e.g., a Postgres connector) that exposes tools, resources, and/or prompts.
2. An MCP client connects to the server (typically over stdio or SSE) and asks: "What can you do?"
3. The server returns its capabilities. The client surfaces these to the LLM.
4. The LLM uses **tool calling** under the hood to invoke them. The client forwards the call to the MCP server, gets the result, and feeds it back.

### MCP's Three Primitives

MCP goes beyond just callable functions:

1. **Tools** — Executable actions, equivalent to tool calling functions. The model decides when to invoke them.
2. **Resources** — Read-only data (files, database rows, logs) that can be attached to context without "calling" anything. Think of these like GET requests.
3. **Prompts** — Reusable prompt templates stored server-side, providing recommended ways to interact with the server's capabilities.

### Strengths

- **Portability.** Write an MCP server once; any compliant client can use it — Claude Desktop, Cursor, VS Code, a custom agent, etc.
- **Dynamic discovery.** Clients query servers for available capabilities at connection time. No static tool injection required.
- **Broader scope.** Resources and prompts give you richer interfaces than functions alone.
- **Modularity.** Separates the "brain" (the LLM) from the "hands" (the tools), letting teams publish and version tools independently.

### Limitations

- **More infrastructure.** You're running and hosting MCP servers, managing transport, handling connections.
- **Protocol overhead.** For a simple app with three tools, MCP adds complexity that may not pay for itself.
- **Doesn't solve planning.** MCP standardizes the *plumbing*, but the model still needs good tool-use behavior. The protocol doesn't make multi-step reasoning more reliable.
- **Security surface area.** Tool exposure, permissions, and sandboxing all need careful design — the standardization cuts both ways.
- **Ecosystem maturity.** MCP is still young. Client support, auth patterns, and best practices are evolving.

---

## How They Fit Together

This is the critical point: **MCP doesn't replace tool calling — it sits on top of it.**

```
┌─────────────────────────────────┐
│          LLM (Claude, etc.)     │
│   Sees tools, decides to call   │
│   ──── tool calling happens ──  │
└──────────────┬──────────────────┘
               │ structured invocation
               ▼
┌─────────────────────────────────┐
│         MCP Client              │
│   Forwards call to the right    │
│   MCP server                    │
└──────────────┬──────────────────┘
               │ MCP protocol (stdio/SSE)
               ▼
┌─────────────────────────────────┐
│         MCP Server              │
│   Executes the function,        │
│   returns result                │
└─────────────────────────────────┘
```

The MCP server surfaces its tools *as* tool-calling-compatible definitions. The model still emits structured JSON to invoke them. MCP just standardizes everything around that interaction: discovery, transport, data access, and reuse.

---

## The Analogy

- **Tool calling** is like defining functions inline in a script. It works, it's fast, and you control everything — but reuse means copy-pasting.
- **MCP** is like publishing a package with a well-defined API. Anyone can `npm install` it. The underlying code execution is similar, but the packaging, discovery, and reuse story is fundamentally different.

---

## Tradeoffs at a Glance

| Dimension | Tool Calling | MCP |
|---|---|---|
| **Complexity** | Low — define schemas, handle responses | Higher — run servers, manage connections |
| **Portability** | Tied to your app | Write once, use across any MCP client |
| **Discovery** | Static — you inject tools per request | Dynamic — clients query servers at runtime |
| **Scope** | Functions only | Functions + read-only data + prompt templates |
| **Performance** | Direct, minimal overhead | Adds a network/protocol layer |
| **Reuse** | Requires glue code per integration | Built-in via the standard |
| **Maturity** | Well-established across providers | Young but growing rapidly |
| **Best for** | Single-app, few tools, fast iteration | Multi-client platforms, team-published tools |

---

## When to Use Which

**Reach for tool calling when:**

- You're building a single application with a specific, stable set of tools.
- You want minimal infrastructure and fast iteration on schemas.
- You're tightly coupled to one model provider (e.g., using the OpenAI Assistants API exclusively).
- You have a small number of tools and don't need dynamic discovery.

**Reach for MCP when:**

- You want tools reusable across multiple surfaces (IDE, chat app, custom agents).
- You're building a platform where teams publish and version tools independently.
- You need to expose data (Resources) and templates (Prompts) alongside callable functions.
- You want to modularize your AI architecture — separating the model layer from the integration layer.

**Use both when:**

- You're building an MCP-aware application. The model still uses tool calling to invoke MCP-discovered tools. They're complementary layers, not competing choices.

---

## Key Takeaway

Tool calling is the *mechanism*. MCP is the *architecture*. Every MCP interaction uses tool calling under the hood, but MCP solves the ecosystem problems that tool calling alone doesn't address: discovery, portability, and standardized data access. Whether the added infrastructure is worth it depends on how many clients need your tools and how much reuse you're optimizing for.
