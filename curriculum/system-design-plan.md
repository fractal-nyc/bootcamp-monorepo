# System Design track

Presentations

1. How to draw system design diagrams
2. Authentication
3. Vol 1 Ch 1: Scale from Zero to Millions of Users. [Ties into deployment. ALTERNATIVE: ECS/games?]
4. Vol 1 Ch 9: Design a Web Crawler
5. Vol 1 Ch 11: Design a News Feed System
6. ? [Midterm?]
7. ?
8. ?
9. ?
10. ?
11. ?
12. ?

## Presentation 1: Communicating system designs

- What is system design?
  - One definition: choosing among the various components available to you (computing units, database, libraries, APIs, etc.) to satisfy the functional (what the system does) and non-functional (how the system performs) requirements under the constraints (time, money, labor, legal, security, etc.) of the problem.
  - Depending on how tight the constraints and requirements are, there can often be more than one system design that could solve the problem with different pros and cons. Surfacing and choosing among **trade-offs** between different solutions is a critical engineering skill.
- Throughout the program we'll get deeper into what components are available and how to choose them to solve various problems, but to start we're going to focus on how to communciate our system design ideas.
- Being able to vividly communicate the structure of your system is important for several reasons:
  - Self: Ensures that YOU understand what system you (or your AI) are building.
  - Teammate: enables you to coordinate with other engineers, clarify ownership boundaries, and define interfaces/contracts between components
  - Non-technical stakeholders: describe capabilities and risks
  - Future you: provides documentation so that later you and others can understand at a glance the structure of the system (memory compression).
  - Specifies the intent behind your text prompts by including visual diagrams to give the AI more context and guardrails.
  - Enables you to foresee failure modes
  - Descriptive text or code are not always the best media for explaining your ideas in a way that people can easily understand.
  - In Paris' presentations, you've seen various kinds of diagrams that functioned as maps to orient you and made it easier to write the code that implements the systems in question.
- Every diagram answers a specific question. Several types of diagrams (not exhaustive) include:
  - System Architecture diagram
    - What are the main components and how do they communuicate?
    - "boxes and arrows"
  - Sequence diagram
    - What happens when X occurs?
    - Requests and responses happening over time
  - State diagram
    - What are the valid states a system can be in?
    - What are valid transitions between those states?
- Because computer systems are built upon many layers of abstraction, you'll want to include only the most important details relevant to the problem at hand.
  - We're drawing maps, not constructing territory.
  - [C4 model](https://en.wikipedia.org/wiki/C4_model) of levels of abstraction from highest to lowest: Context, Containers, Components, Code
  - Consider who your audience is when deciding what level of detail to include in the diagram
- Each week we'll do a brief system design exercise that we'll prepare for on Thursday and Friday.
  - You will be expected to be able to draw system diagram for the applications you build
  - Tools
    - [Excalidraw](https://excalidraw.com/) ([open-source](https://github.com/excalidraw/excalidraw) graphical whiteboarding tool)
    - [Mermaid.js](https://mermaid.js.org/) (charting language and rendering library)
    - My favorite: pen and paper
  - Don't forget to include a title on the diagram!
- Exercise: draw a system diagram for tic-tac-toe, take a photo, post it in the Discord, and hand it to Claude to see if it can one-shot it

## Presentation 2: Auth(entication)

- What is "auth?"
  - Authentication ("authn"): Who are you?
  - Authorization ("authz"): What are you allowed to do?
  - This talk will (mainly) focus on authentication (henceforth, "auth")
- Two key considerations for auth:
  - How do you prove identity?
    - What credentials do you offer?
    - What protocol do you use?
  - How does the system remember this proof?
    - Sessions
    - Cookies
    - Tokens
- What features do you want in an auth system?
  - How secure is it?
  - Can you easily revoke access?
  - Do you have to maintain state and "look things up ("stateful")? Or is it stateless?
  - What is the user experience (UX) like?
- There is no perfect auth system. If it's available, it can theoretically be accessed by someone else.
- Common auth systems
- No auth
  - Like having unprotected sex: feels good, but leaves you vulnerable
  - Only do this if nothing is at stake or you're already in a secure environment
  - We actually do this all the time: you don't want to have to validate auth every time you execute a line of code
- Stateful: Server-side sessions
  - How it works
    - User logs in with username+password
    - Server creates a session record with an ID and stores it somewhere (memory, cache, database, etc.)
    - Server tells the user's browser to set a cookie with this information
    - Client sends this cookie with every subsequent request.
    - Server looks up the session in the cookie to confirm the auth is valid
  - Pros
    - Simple model
    - Easy to revoke the session, log the user out
  - Cons
    - Server has to record state, creating scaling bottleneck
    - Need a shared session store for horizontal scaling (multiple servers)
    - If you share your session cookie, someone else can take actions on your behalf
    - Need to make sure passwords are stored securely
- Variation: Opaque Tokens
  - Opaque means "seemingly-random string with no obvious meaning"
  - Instead of storing the session ID in a cookie, the client can store it "anywhere" as long as it sends it in the HTTP Authorization header
  - Better for mobile or other non-browser contexts (e.g. services calling APIs) because you don't need to store cookies (no client state required)
  - Avoids Cross-Site Request Forgery (CSRF) at the expense of Cross-Site Scripting (XSS)
  - Don't check your API keys into GitHub!
- Stateless: JSON Web Tokens (JWT)
  - How it works
    - User logs in with ID+pasword as before
    - If valid, server constructs a payload ("claims") with user's identity, authorization scopes, and other metadata, base64 encodes it, then cryptographically signs it
      - Note: NOT encryption, just compression+signing
    - The client receives this payload and returns it in the Authorization header of subsequent HTTP requests
    - Server parses this header and checks if the signature matches
  - Pros
    - No storage lookup required since header can be validated computationally
    - Highly scalable
  - Cons
    - Hard to revoke (have to wait for it to expire OR need to refresh frequently)
    - Payload can be large if it contains many claims
    - Payload is readable (base64 decode)
- OAuth 2.0 + Open ID Connect (OIDC)
  - TODO
- Others
  - Passwordless auth
    - Magic links
    - One-time passwords (OTP)
    - Passkeys
    - WebAuthn
  - 2-Factor Auth (2FA), Multi-Factor Auth (MFA)
- Some notes about password security
  - Never store plaintext passwords. Instead, you store evidence that the user knew the password at some point.
  - When a user creates an account and provides a password, the server:
    - Generates a random string called a **salt** and appends it to the password
    - Runs the combination through has **hash function** to produce a new string
    - Stores the user ID, has string, salt string, hash function used, and cost required to compute the hash
  - When a user logs in again, the server
    - Looks up the user's salt by ID
    - Applies the hashing algorithm to the submitted password + salt
    - If the result matches the stored hash, login succeeds

## Scratch/Notes

### [obsolete] System Design Interview Reading Group

We will be holding weekly discussion sessions on select chapters from System Design Interview Volume 1 by Alex Xu. Besides prepping you for eventual system design interviews, the motivation is to exposure you to various building blocks of computer system design and how they can be assembled to solve real-world problems.

Here are the chapters we'll cover each week. To participate, make sure to read (or at least skim) the chapter ahead of time.

1. Chapter 1: Scale from Zero to Millions of Users. Consider how you would apply these architecture ideas to your Tic Tac Toe app.
2. Chapter 12: Design a Chat System. Consider how you would apply these architecture ideas to your chatbot app.
3. Chapter 9: Design a Web Crawler
4. Chapter 11: Design a News Feed System
5. Chapter 14: Design YouTube
6. Chapter 15: Design Google Drive
7. Chapter 8: Design a URL Shortener
8. Chapter 10: Design a Notification System
9. Chapter 13: Design a Search Autocomplete System
10. Chapter 6: Design a Key-Value Store
11. Chapter 4: Design a Rate Limiter
12. Chapter 7: Design a Unique ID Generator in Distributed Systems

### Week 1

- Present personal introduction deck: https://docs.google.com/presentation/d/1ccZHS0jSqqF4KU-VakBx_RfY4l0_9KMEo_PQVrgHgHk/edit?slide=id.p#slide=id.p
  - It currently has a bunch of info about day-to-day expectations and etiquette. Liam could do the day-to-day bit instead and I could do the overall curriculum piece.
- How to use git to produce Pull Requests: https://docs.google.com/presentation/d/1Qf4fNeLgDZFfJtX97VTa946BTRMJO_9S5QvIPZdso60/edit?slide=id.p#slide=id.p
  - Could be done on Day 1 by Paris?
