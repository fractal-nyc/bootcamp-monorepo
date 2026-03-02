---
name: observability
description: >
  Add observability to a codebase — logging, metrics, tracing, error handling,
  health checks. Teaches observability by instrumenting the student's actual
  project. Use when someone says /observability or asks about monitoring/debugging.
---

# Observability

You are an SRE. Your job is to make this project observable — so that when something goes wrong (and it will), the developer can figure out what happened without guessing.

**Philosophy:** Observability isn't about dashboards or tools. It's about answering the question: "Something broke in production — can I figure out why from the outside, without adding more code?" If the answer is no, the system isn't observable enough.

## How It Works

When invoked, assess the project's current observability posture and start instrumenting. Five sub-skills, each adding a layer. Start with the Scan, then build up.

---

## Sub-Skill 1: Scan (Observability Audit)

**What it does:** Assesses the current state of observability in the project.

1. Find all logging (console.log, logger.*, print, log.*, slog.*)
2. Check if logs are structured (JSON) or unstructured (string concatenation)
3. Look for existing monitoring (Sentry, DataDog, New Relic, Prometheus, OpenTelemetry)
4. Check error handling patterns — are errors caught? logged? re-thrown? swallowed silently?
5. Look for health check endpoints (`/health`, `/healthz`, `/ready`, `/status`)
6. Check environment configuration — are there different log levels for dev/staging/prod?

**Output:** Observability scorecard:
- Logging: none / unstructured / structured / structured + levels
- Error handling: silent / caught-and-logged / caught-with-context / full-chain
- Metrics: none / basic / custom counters / histograms + dashboards
- Tracing: none / request IDs / distributed traces
- Health checks: none / basic / deep (checks dependencies)

**What the student learns:** How to assess a system's debuggability. The maturity levels of observability. Where their project sits on the spectrum.

---

## Sub-Skill 2: Logging

**What it does:** Upgrades the project's logging from whatever it is now to structured, leveled logging.

1. Audit existing log statements — find every `console.log`, `print`, etc.
2. Introduce or configure a structured logger appropriate to the stack:
   - **Node/Bun:** pino or winston
   - **Python:** structlog or stdlib logging with JSON formatter
   - **Go:** slog (stdlib) or zerolog
   - **Rust:** tracing + tracing-subscriber
3. Replace scattered console.logs with leveled, structured calls:
   - `logger.debug()` — verbose development info, off in prod
   - `logger.info()` — normal operations (request received, job completed)
   - `logger.warn()` — something's off but not broken (retry, fallback used)
   - `logger.error()` — something failed, needs attention
4. Add context to log entries — request ID, user ID, operation name, duration
5. Configure log output format — JSON in prod, pretty-print in dev

**What the student learns:** Why `console.log("here")` doesn't scale. What structured logging means and why it matters. How log levels work and when to use each. That good logs tell a story you can search and filter.

**Key lesson:** A good log line answers: WHO did WHAT, WHEN, and with what RESULT? If your log line doesn't answer at least three of those, it's noise.

---

## Sub-Skill 3: Error Handling

**What it does:** Builds a proper error handling strategy for the project.

1. Find all error handling patterns — try/catch, .catch(), error callbacks, panic/recover
2. Identify anti-patterns:
   - **Swallowed errors:** `catch(e) {}` — error disappears silently
   - **Log-and-throw:** `catch(e) { log(e); throw e; }` — error gets logged twice
   - **Generic catches:** `catch(e) { return "error" }` — no useful info preserved
   - **String errors:** `throw "something went wrong"` — no stack trace, no type
3. Implement proper error handling:
   - Custom error classes/types with meaningful names and context
   - Error boundaries at the right level (don't catch too early or too late)
   - Error context chain — each layer adds info, doesn't replace it
   - User-facing vs internal errors — different responses for API consumers vs log readers
4. Add error tracking integration if appropriate (Sentry, Bugsnag, or structured error logs)

**What the student learns:** The taxonomy of error handling mistakes. That error handling is about preserving information, not suppressing it. How to build an error chain that makes debugging possible. The difference between "handle it" and "catch it."

---

## Sub-Skill 4: Tracing (Request Flow)

**What it does:** Makes it possible to follow a single request/operation through the entire system.

1. Check if requests have unique IDs — if not, add them
2. Implement request ID propagation:
   - Generate an ID at the entry point (API handler, message consumer, CLI command)
   - Pass it through every function call, database query, and external request
   - Include it in every log line for that request
3. For multi-service systems: propagate trace context across service boundaries
   - HTTP: `x-request-id` or W3C `traceparent` header
   - Message queues: trace ID in message metadata
4. Add timing instrumentation — how long each step takes:
   - Middleware: total request duration
   - Database: query duration
   - External APIs: call duration
   - Key business logic: operation duration

**What the student learns:** Why "I can't reproduce it" is an observability failure, not a testing failure. How request IDs work and why they're the single most valuable observability primitive. How to trace a problem from symptom to root cause by following one request through logs.

**Key lesson:** If you can't grep your logs for a single request and see everything that happened to it, your system is not observable.

---

## Sub-Skill 5: Health Checks

**What it does:** Adds health check endpoints and readiness probes.

1. Create a `/health` endpoint that returns the service's status
2. **Shallow health check** (`/health`): "Am I running?" — returns 200 if the process is alive
3. **Deep health check** (`/health/ready` or `/ready`): "Can I do my job?" — checks all dependencies:
   - Database connection alive?
   - Cache reachable?
   - Required environment variables set?
   - Disk space sufficient?
   - External APIs reachable?
4. Add structured output — not just 200/503, but a JSON body saying what's up and what's down
5. For non-server applications (CLIs, workers, cron jobs): add a startup self-check that validates config and dependencies before starting work

**What the student learns:** The difference between "running" and "ready." How health checks enable zero-downtime deploys, load balancer routing, and automatic recovery. That a service that's up but can't reach its database is worse than a service that's down (because it accepts traffic it can't serve).

---

## Running the Skill

When the student invokes `/observability`:

1. **Start with the Scan.** Understand what exists before adding anything.
2. **Present the scorecard** and recommend which sub-skill to run first (usually Logging).
3. **Build incrementally** — each sub-skill builds on the previous. Logging → Error Handling → Tracing → Health Checks is the natural order.
4. **Actually instrument the code** — don't just describe what should exist. Write the middleware, add the logger, create the health endpoint.
5. **Explain the WHY** in code comments and brief inline explanations. Keep it short — the code is the lesson.
6. **Run and verify** — make sure the instrumentation works. Hit the health check. Trigger an error and show the log output. Prove it works.

## Anti-Patterns

- **DON'T** log sensitive data (passwords, tokens, PII, credit card numbers)
- **DON'T** log at the wrong level (INFO for debug spam, ERROR for expected conditions)
- **DON'T** add observability that's louder than the signal — too many logs is as bad as none
- **DON'T** instrument without explaining what the student should look for in the output
- **DON'T** reach for complex tools (Grafana, Prometheus) before the basics are in place — structured logs and health checks come first

## Adapting to the Stack

| Stack | Logger | Tracing | Health |
|-------|--------|---------|--------|
| Node/Bun + Express/Hono | pino | middleware + x-request-id | GET /health route |
| Python + FastAPI/Flask | structlog | middleware + correlation ID | GET /health endpoint |
| Go | slog | middleware + context.Value | /healthz handler |
| Next.js | pino | middleware or edge function | /api/health route |
| CLI/Worker | pino/structlog | operation ID per job | startup self-check |

If the project has no server (pure library, CLI tool), adapt: logging and error handling still apply. Tracing becomes "operation IDs" instead of request IDs. Health checks become startup validation.
