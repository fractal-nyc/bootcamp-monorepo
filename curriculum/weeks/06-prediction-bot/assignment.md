# PROJECT SPEC: PREDICTION MARKET TRADING BOT

---

## PROJECT DESCRIPTION

Build a **real-time prediction market trading bot** that connects to one of the major prediction market platforms and executes a trading strategy of your choice.  

Your bot should operate continuously, consume live market data, make trades automatically according to your strategy, and maintain its own internal accounting for performance.  

You are not trading real money. All trades are simulated (“paper trades”) and tracked locally in your system.

**Alternatives**

Remember, this program runs on the work you find intuitively engaging and fun. If you are not interested or excited in a prediction market bot, you can build any system that will consume and process realtime data like [Bluesky post data](https://docs.bsky.app/docs/advanced-guides/firehose?utm_source=chatgpt.com), [Wikipedia edits](https://wikitech.wikimedia.org/wiki/Event_Platform/EventStreams_HTTP_Service?utm_source=chatgpt.com), etc.

**Reference materials**
- [What is a Prediction Market?](https://docs.manifold.markets/faq#basics---how-does-manifold-work)
- [What is a Trading Bot?](https://en.wikipedia.org/wiki/Algorithmic_trading)

---

## OBJECTIVE

Design, implement, and operate an autonomous system that:

1. **Ingests real-time data** from a live prediction market API.  
2. **Executes a trading strategy** in response to that data.  
3. **Maintains continuous uptime**, observable health, and auditable records of all simulated trades.  
4. **Visualizes performance** through a front-end dashboard.

---

## TRADING STRATEGY

Define your own trading logic. It does **not** need to be profit-driven—though that’s a natural starting point.  
The goal is to design a strategy that is **interesting, interpretable, and measurable**.  

Here are a few examples:

- **High-certainty bot**: Predict “YES” on anything above 95% probability, assuming markets under-price near-certain events.  
- **Sentiment bot**: For markets with <24 hours remaining, perform sentiment analysis on recent news or social data, use an LLM to interpret context, and trade accordingly.  
- **Ideological bots**: Create contrasting worldviews (e.g., *Communist Bot* vs. *Libertarian Bot*). Prompt an LLM to output how that worldview interprets the event, and trade based on the result.  
- **Trend hypothesis**: Identify a recurring theme (“electric cars will fail,” “AI startups are overhyped”) and use markets that express that belief to validate your thesis.  

There is no requirement to find an “edge.” You are evaluated on execution quality, clarity of reasoning, and the ability to observe and measure your bot’s behavior.

---

## TECHNICAL REQUIREMENTS

### 1. Prediction Market Integration
- Choose **one** provider:
  - **Polymarket** – WebSocket API for real-time market data.  
  - **Kalshi** – WebSocket API for market updates (may require API key).  
  - **Manifold Markets** – REST API with polling fallback.  
- Consume data **in real time** using the provider’s streaming or subscription API. Polling is acceptable only if no WebSocket/SSE stream is available.

### 2. Real-Time Operation
- The bot must run **24/7** throughout the project week.  
- It must handle disconnects, reconnections, and transient failures automatically.  
- Deploy it on an always-on service (e.g., Fly.io, Render, or Railway).  
- The system must recover from restarts without data loss.

### 3. Paper Trading and Ledger
- All trades are **simulated**.  
- You must maintain your own **books**:
  - Log every decision and resulting “trade.”  
  - Track current positions, exposure, and unrealized profit/loss.  
  - Implement a replay function to reconstruct state from logs.  
- The market itself will not store your trade history.

### 4. User Interface
- A front-end dashboard must display:
  - Current open positions and total simulated P&L.  
  - Real-time market prices and trade events.  
  - Recent trades and performance over time.
- You may host the UI anywhere (e.g., Vercel). It should read from your system’s database or API.

### 5. CI/CD
- Implement continuous integration and deployment.  
- Pushing to main should automatically build, test, and deploy with **zero downtime**.  
- Manual deploys are not acceptable.

### 6. Observability
- You must prove that your bot operates **continuously and correctly**.  
- Implement a full observability layer, including:
  - Integration with **Sentry**, **Datadog**, or another metrics system by **end of Tuesday**.  
  - Real alerts on genuine failure conditions (disconnects, lag spikes, etc.).  
  - Custom metrics, e.g.:  
    - Events processed per second  
    - Average and p95 event-processing latency  
    - Reconnect frequency  
    - Uptime percentage  
  - A **live dashboard** showing your bot’s activity, errors, and uptime over time by **end of tuesday.** 
- The goal: a clear operational view proving your system has been online at least **95% of the time**.

---

## IMPLEMENTATION TIMELINE

### MONDAY — STRATEGY AND DATA SELECTION
- Design your core system architecture:
  - Core trading agent (worker process)  
  - Database (event log, decisions, trades)  
  - Front-end dashboard
- Choose your prediction market (Polymarket, Kalshi, or Manifold).  
- Evaluate trade volume, API accessibility, and data freshness.  
- Define your trading strategy and initial logic.  
- Establish a working WebSocket or SSE connection and begin consuming real-time data.  
- **Goal:** A bot that connects and logs market data with placeholder decision logic.

### TUESDAY — INITIAL DEPLOYMENT
- Deploy the first version of your trading agent using a CI/CD pipeline
- Integrate Sentry or Datadog and produce a visible dashboard of system health. 
- **If you don’t have a working dashboard by end of day Tuesday, you are behind.**  
- **Goal:** Real-time data ingestion and a live monitoring dashboard.

### WEDNESDAY — SYSTEM INTEGRATION
- Connect all components:
  - Database wiring and persistence.  
  - Basic UI for visualizing trades.
- Execute and log at least one simulated trade.  
- **Goal:** A deployed system with end-to-end data flow.

### THURSDAY — STABILIZATION AND RELIABILITY
- Focus on operational resilience:
  - Handle reconnects and errors gracefully.  
  - Validate trade accounting and P&L accuracy.  
  - Tune alerts and dashboards, tweak trading algorithm
- **Goal:** Bot runs continuously without manual restarts.

### FRIDAY — PERFORMANCE AND TUNING
- Monitor performance and latency under live conditions.  
- Stress-test your deployment pipeline (redeploy safely).  
- Gather data and insights about how your bot behaves.  
- **Goal:** Steady-state operation and observability maturity.

### SATURDAY — DEMO DAY
- Present your bot’s live dashboard and operational story.  
- Demo suggestions:
  - “Here’s how my bot made (or lost) money.”  
  - “Here’s my ideological bot and how it traded.”  
  - “Here’s how I kept uptime at 99.8%.”  
- **Goal:** Demonstrate engineering judgment and operational mastery.

---

## RESOURCES

### Junior Engineers

- [The Death of the Junior Developer](https://sourcegraph.com/blog/the-death-of-the-junior-developer)
- [Revenge of the Junior Developer](https://sourcegraph.com/blog/revenge-of-the-junior-developer)

### Figuring out your architecture
  
- [Intro to System Design](https://www.youtube.com/watch?v=F2FmTdLtb_4)
- [What is Stream Processing?](https://www.youtube.com/watch?v=7PjPhgCoT9c)
- [Google SRE Book: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)

### Prediction Market APIs

You'll need to assess trade-offs between these APIs and make a choice that matches your architecture.

- **Polymarket** Docs: [https://docs.polymarket.com/](https://docs.polymarket.com/)
- **Kalshi** Docs: [https://docs.kalshi.com/](https://docs.kalshi.com/)
- **Manifold Markets** Docs: [https://docs.manifold.markets/api](https://docs.manifold.markets/api)

### Deployment Platforms

You'll need to assess trade-offs and pick the deployment platform that matches your architecture.

- **Fly.io** – Always-on containers with blue/green deploys.  
- **Render** – Zero-downtime deploys for web and worker services.  
- **Railway** – Managed app platform with simple pipelines.  
- **AWS** - The most "scalable" but least easy to use approach.
- Avoid **Vercel** for the trading agent; use it only for front-end hosting.

---

# Monday
How to write complex software: https://grantslatton.com/how-to-software

# Tuesday
Semantic Compression: https://caseymuratori.com/blog_0015

# Wednesday
Don't stop at 90%: https://austinhenley.com/blog/90percent.html

# Thursday

How I build software quickly: https://evanhahn.com/how-i-build-software-quickly/

