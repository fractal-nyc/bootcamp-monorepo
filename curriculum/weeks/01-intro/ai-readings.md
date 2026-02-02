# Useful Links for Claude to Read

Curated from group chat discussions (Jan 2026). Each link includes context for when Claude should reference it.

--

## The Claude Code Phase Shift (Essential Context)

### 0. Karpathy's Notes from Claude Coding
**URL:** https://xcancel.com/karpathy/status/2015883857489522876
**Summary:** https://dev.to/jasonguo/karpathys-claude-code-field-notes-real-experience-and-deep-reflections-on-the-ai-programming-era-4e2f
**What it is:** Detailed notes on the "phase shift" in software engineering - went from 80% manual to 80% agent coding in weeks.
**When useful:** Understanding current state of AI coding, workflow changes, what's working.
**Key insights:**
- "I really am mostly programming in English now"
- "Biggest change to my basic coding workflow in ~2 decades"
- Manual coding skills starting to "atrophy"
- Claude Code runs locally with your context (better than cloud deployments)
- 2026 is year of metabolizing new capability

## AI Workflow & Strategy

### 1. Management as AI Superpower
**URL:** https://www.oneusefulthing.org/p/management-as-ai-superpower
**Author:** Ethan Mollick
**What it is:** Article on thriving in a world of AI agents - management skills become more critical than technical skills.
**When useful:** When discussing how to organize work with AI, delegation patterns, or the changing role of human oversight.
**Key insight:** "The limiting factor at work isn't writing code anymore. It's deciding what to build and catching when things go sideways."

### 2. AI Interviews - Slava Akhmechet
**URL:** https://www.spakhm.com/ai-interviews
**What it is:** Experiment results from allowing interview candidates to use AI - strong candidates stay strong, weak candidates don't improve.
**When useful:** When discussing AI as amplifier vs. crutch, why methodology matters, or the "no gambling" principle (systematic problem-solving vs. random tries).
**Key insight:** AI amplifies existing problem-solving skills. Weak candidates "blindly try stuff hoping something sticks" - strong candidates form precise hypotheses and test systematically.

### 3. Dustin Getz on Code Quality
**URL:** https://x.com/dustingetz/status/2016864001460769161
**What it is:** Thread arguing AI code quality is *better* because quality = f(iterations), and AI enables 10-100x faster iteration.
**When useful:** When discussing code quality concerns with AI, or the relationship between speed and quality.
**Key insight:** Quality is the time integral over speed of iterations. More iterations = higher quality.

---

## Claude Code Mastery

### 4. Thorsten Ball's Feedback Loops List
**URL:** https://x.com/thorstenball/status/2016766204610834496
**What it is:** Curated list of feedback loops needed for effective AI-assisted coding.
**When useful:** When setting up development workflows, discussing why PRDs-then-execute doesn't work, or optimizing Claude Code usage.
**Key insight:** "Building software is learning about the software - you need more feedback loops, more ways for the agent to hit reality, to learn, to course-correct."

### 5. Complex Systems Podcast - Claude Code Episode
**URL:** https://www.complexsystemspodcast.com/episodes/claude-code/
**Author:** Patrick McKenzie (patio11)
**What it is:** Annotated Claude Code session showing real motivating example of what's possible.
**When useful:** Demonstrating Claude Code's capabilities, explaining agentic coding to skeptics.
**Key insight:** Demonstrates Claude Code generating significant value in a short session.

### 6. Boris Cherny's Response to Karpathy
**URL:** https://x.com/bcherny/status/2015979257038831967
**What it is:** Claude Code creator on how the team itself indicates where things are headed - they hire mostly generalists.
**When useful:** Discussing the future of software engineering, hiring for AI-native teams.
**Key insight:** Product managers code, data scientists code, user researchers code. Generalists over specialists.

### 7. Andrew Ng - Agent Skills with Anthropic Course
**URL:** https://x.com/andrewyng/status/2016564878098780245
**What it is:** Announcement of DeepLearning.AI course on Claude skills - folders of instructions that equip agents with on-demand knowledge.
**When useful:** When building Claude skills, understanding skill architecture, or learning best practices.
**Key insight:** Skills are constructed as folders of instructions that equip agents with on-demand knowledge and workflows.

---

## Emerging Patterns & Tools

### 8. One Human + One Agent = One Browser (20K LOC)
**URL:** https://news.ycombinator.com/item?id=46779522
**Blog:** https://emsh.cat/one-human-one-agent-one-browser/
**What it is:** Someone built a browser from scratch in 72 hours with one AI agent - 20K lines of Rust, zero dependencies.
**When useful:** Discussing what's possible with AI, ambitious solo projects, or the "one person startup" thesis.
**Key insight:** Tasks that seemed to require teams can now be done by one human + one agent.

### 9. Rohun Jauhar - AI Self-Upgrade
**URL:** https://x.com/RohunJauhar/status/2016515470543761805
**What it is:** Experiment where user told AI to watch a YouTube video, learn to become a better assistant, then upgrade itself.
**When useful:** Discussing meta-learning, AI self-improvement, skill acquisition patterns.
**Key insight:** AI can learn from video content and apply it to improve its own capabilities.

### 10. Sherlock - LLM Traffic Inspector
**URL:** https://github.com/jmuncor/sherlock
**What it is:** Intercepts LLM API traffic and shows real-time token usage dashboard. Saves prompts as markdown/JSON.
**When useful:** Debugging prompts, monitoring context window usage, tracking costs, understanding what model sees.
**Usage:** `sherlock claude` - runs proxy on localhost:8080

---

## Learning & Career

### 11. Kyber Job Posting - "Team Uses Tools Well"
**URL:** https://www.ycombinator.com/companies/kyber/jobs/GPJkv5v-staff-engineer-tech-lead
**What it is:** Job requiring "know how to make sure the team uses these tools well" as explicit skill.
**When useful:** Discussing emerging job requirements, CTO training, AI tool adoption.
**Key insight:** "Help team use AI tools well" is becoming an explicit job requirement.

### 12. Eric S. Raymond on Programming with AI
**URL:** https://x.com/esrtweet/status/2016713740658344301
**What it is:** Reflection on what he actually likes about programming - being an "experimental epistemologist."
**When useful:** Discussing the philosophy of programming, what remains fulfilling with AI assistance.
**Key insight:** AI assistance reveals what programmers actually enjoy vs. tolerate.

### 13. Dilum Sanjaya - Vibe Coded Game UI
**URL:** https://x.com/dilumsanjaya/status/2016193959408836932
**What it is:** Example of "vibe coding" a ship selection UI with 3D assets (Midjourney -> Hunyuan3D).
**When useful:** Demonstrating creative AI workflows, game dev examples, asset pipeline with AI.
