import type { AuthFlow } from "./types";

export const flows: AuthFlow[] = [
  // ── No Auth ──
  {
    id: "no-auth",
    title: "No Auth",
    subtitle: "No identity verification at all",
    entities: [
      { id: "client", label: "Client", icon: "\uD83D\uDCBB", color: "#6c8cff" },
      {
        id: "server",
        label: "Server",
        icon: "\uD83D\uDDA5\uFE0F",
        color: "#4ade80",
      },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        label: "GET /api/data",
        description:
          "Client sends a request with no credentials whatsoever. The server has no idea who is making the request.",
        payload: `GET /api/data HTTP/1.1\nHost: example.com\n\n(no credentials)`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "client",
        label: "200 OK + data",
        description:
          "Server responds with the data. Anyone can access this endpoint \u2014 there is no identity check.",
        payload: `HTTP/1.1 200 OK\n\n{ "data": [ ... ] }`,
        color: "#4ade80",
      },
    ],
    pros: [
      "Zero complexity \u2014 nothing to implement",
      "Great for truly public data (e.g. a public homepage)",
    ],
    cons: [
      "No way to know WHO is making the request",
      "Cannot restrict access to sensitive resources",
      "No audit trail",
    ],
  },

  // ── Password Storage & Verification ──
  {
    id: "password-hashing",
    title: "Password Storage",
    subtitle:
      "How servers store and verify passwords without ever keeping the plaintext",
    entities: [
      {
        id: "client",
        label: "Browser",
        icon: "\uD83C\uDF10",
        color: "#6c8cff",
      },
      {
        id: "server",
        label: "Server",
        icon: "\uD83D\uDDA5\uFE0F",
        color: "#4ade80",
      },
      {
        id: "db",
        label: "User Database",
        icon: "\uD83D\uDDC4\uFE0F",
        color: "#fb923c",
      },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        label: "Create account",
        description:
          "User submits a signup form with a username and password. This is the only time the server ever sees the plaintext password \u2014 and it will never store it.",
        payload: `POST /signup\n\n{ "username": "alice",\n  "password": "correct-horse-battery" }`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "server",
        label: "Generate salt",
        description:
          'Server generates a random string called a "salt" \u2014 unique to this user. The salt prevents two users with the same password from having the same stored hash, and defeats precomputed "rainbow table" attacks.',
        payload: `salt = randomBytes(16)\n\u2192 "a1b2c3d4e5f6..."\n\nWhy salt?\n  Without it, every user with\n  password "123456" would have the\n  same hash \u2014 cracking one cracks\n  them all.`,
        color: "#a78bfa",
      },
      {
        from: "server",
        to: "server",
        label: "Hash password + salt",
        description:
          'Server concatenates the password with the salt and runs it through a slow hash function (like bcrypt, scrypt, or argon2). The "cost" parameter controls how slow it is \u2014 slow enough to make brute-force impractical, fast enough to not annoy users.',
        payload: `hash = bcrypt(\n  "correct-horse-battery" + "a1b2c3d4e5f6...",\n  cost: 12\n)\n\n\u2192 "$2b$12$LJ3m4ks9Hx8Gk1e..."\n\nThis is a ONE-WAY function:\n  hash \u2192 password is infeasible\n  password \u2192 hash is easy`,
        color: "#a78bfa",
      },
      {
        from: "server",
        to: "db",
        label: "Store hash (never plaintext!)",
        description:
          "Server stores the hash, salt, algorithm, and cost \u2014 but NEVER the original password. If this database is ever breached, attackers get hashes, not passwords. With a strong hash function + salt, these are extremely expensive to crack.",
        payload: `INSERT INTO users\n  (username, password_hash,\n   salt, algorithm, cost)\nVALUES\n  ('alice',\n   '$2b$12$LJ3m4ks9Hx8Gk1e...',\n   'a1b2c3d4e5f6...',\n   'bcrypt', 12)\n\n\u274C NEVER: password = "correct-horse..."`,
        color: "#fb923c",
      },
      {
        from: "server",
        to: "client",
        label: "Account created!",
        description:
          "Server confirms the account was created. The plaintext password is discarded from memory. It is gone forever \u2014 even the server can't recover it.",
        payload: `HTTP/1.1 201 Created\n\n{ "message": "Account created!" }\n\nThe plaintext password\nis discarded from memory.\nIt no longer exists anywhere.`,
        color: "#4ade80",
      },
      {
        from: "client",
        to: "server",
        label: "Login later",
        description:
          "Some time later, the user returns and enters their password again. The server needs to verify it without ever having stored it.",
        payload: `POST /login\n\n{ "username": "alice",\n  "password": "correct-horse-battery" }`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "db",
        label: "Lookup user's salt & hash",
        description:
          "Server looks up the stored salt, hash, algorithm, and cost for this user. It needs the salt to reproduce the same hashing process.",
        payload: `SELECT password_hash, salt,\n  algorithm, cost\nFROM users\nWHERE username = 'alice'`,
        color: "#fb923c",
      },
      {
        from: "db",
        to: "server",
        label: "Return stored values",
        description:
          "Database returns the hash and salt. Notice: no plaintext password exists anywhere in this system.",
        payload: `{ "password_hash":\n    "$2b$12$LJ3m4ks9Hx8Gk1e...",\n  "salt": "a1b2c3d4e5f6...",\n  "algorithm": "bcrypt",\n  "cost": 12 }`,
        color: "#fb923c",
      },
      {
        from: "server",
        to: "server",
        label: "Hash submitted password",
        description:
          "Server takes the submitted password, combines it with the stored salt, and runs the same hash function with the same cost. If the user typed the right password, the result will match the stored hash exactly.",
        payload: `new_hash = bcrypt(\n  "correct-horse-battery"\n    + "a1b2c3d4e5f6...",\n  cost: 12\n)\n\n\u2192 "$2b$12$LJ3m4ks9Hx8Gk1e..."\n\nnew_hash === stored_hash\n\u2192 \u2705 PASSWORD CORRECT`,
        color: "#a78bfa",
      },
      {
        from: "server",
        to: "client",
        label: "Login successful",
        description:
          "The hashes match! The server now knows the user provided the correct password, without ever having stored it. From here, the server creates a session (see the Server Sessions + Browser Cookies flow).",
        payload: `HTTP/1.1 200 OK\nSet-Cookie: session_id=s_abc123;\n  HttpOnly; Secure\n\n{ "message": "Welcome back, Alice!" }\n\n\u2192 See "Server Sessions + Browser Cookies" for\n  what happens next`,
        color: "#4ade80",
      },
    ],
    pros: [
      "Server never stores the actual password \u2014 only evidence the user knew it",
      "If the database is breached, attackers get hashes, not passwords",
      "Salting means identical passwords produce different hashes per user",
      "Cost parameter makes brute-force attacks computationally expensive",
    ],
    cons: [
      "Users still have to choose and remember passwords (password reuse, weak passwords)",
      "Vulnerable to phishing \u2014 user can be tricked into typing password on a fake site",
      "Server sees the plaintext password briefly during each request (must use HTTPS)",
      "Hash cost must be tuned: too low = easy to brute-force, too high = slow logins",
    ],
  },

  // ── Public-Key Cryptography ──
  {
    id: "public-key-crypto",
    title: "Public-Key Cryptography",
    subtitle: "Asymmetric keys: what one key locks, only the other can unlock",
    entities: [
      { id: "alice", label: "Alice", icon: "\uD83D\uDC69", color: "#6c8cff" },
      {
        id: "math",
        label: "Crypto Engine",
        icon: "\uD83D\uDD10",
        color: "#a78bfa",
      },
      { id: "bob", label: "Bob", icon: "\uD83D\uDC68", color: "#4ade80" },
    ],
    steps: [
      {
        from: "alice",
        to: "math",
        label: "Generate key pair",
        description:
          "Alice asks her device to generate a key pair. The crypto engine picks two mathematically linked keys using a one-way function \u2014 easy to compute forward, astronomically hard to reverse.",
        payload: `generateKeyPair("ECC-P256")\n\nThe math (conceptually):\n  RSA: multiply two large primes\n    \u2192 easy. Factor the product\n    back? Infeasible.\n  ECC: point multiplication on\n    an elliptic curve \u2192 easy.\n    Reverse it? Infeasible.`,
        color: "#a78bfa",
      },
      {
        from: "math",
        to: "alice",
        label: "Return key pair",
        description:
          "The crypto engine returns two keys. The private key must NEVER leave Alice\u2019s device. The public key can be freely shared \u2014 knowing it doesn\u2019t help you figure out the private key.",
        payload: `\uD83D\uDD10 Private key (SECRET):\n  "MIGHAgEAMBMGByqG..."\n  Stays on Alice's device.\n  NEVER shared with anyone.\n\n\uD83D\uDD13 Public key (SHAREABLE):\n  "MFkwEwYHKoZIzj0C..."\n  Safe to post on a billboard.\n  Useless without the private key.`,
        color: "#a78bfa",
      },
      {
        from: "alice",
        to: "bob",
        label: "Share public key",
        description:
          "Alice sends her public key to Bob (and anyone else who wants it). This is completely safe \u2014 the public key can only be used to encrypt messages TO Alice or verify signatures FROM Alice.",
        payload: `Alice's public key:\n  "MFkwEwYHKoZIzj0C..."\n\nThis travels over the open internet.\nIntercepting it is useless \u2014\nit can't decrypt anything.`,
        color: "#6c8cff",
      },
      {
        from: "bob",
        to: "math",
        label: "Encrypt message with Alice's public key",
        description:
          "Bob wants to send Alice a secret message. He encrypts it using her public key. After encryption, even Bob can\u2019t decrypt it \u2014 only the holder of the matching private key can.",
        payload: `encrypt(\n  message: "Meet at 3pm",\n  key: alice_public_key\n)\n\n\u2192 "x7kQ9mP2zL4nR8wV..."\n\n\u26A0\uFE0F Even Bob can't reverse this.\n  Only Alice's private key can.`,
        color: "#4ade80",
      },
      {
        from: "bob",
        to: "alice",
        label: "Send encrypted message",
        description:
          "Bob sends the encrypted ciphertext to Alice. If anyone intercepts it in transit, they see only random-looking data. Without Alice\u2019s private key, the message is unreadable.",
        payload: `"x7kQ9mP2zL4nR8wV..."\n\nAnyone can see this in transit.\nBut without Alice's private key,\nit's meaningless gibberish.`,
        color: "#4ade80",
      },
      {
        from: "alice",
        to: "math",
        label: "Decrypt with private key",
        description:
          "Alice uses her private key to decrypt the message. This is the only key in the world that can reverse the encryption performed by her public key.",
        payload: `decrypt(\n  ciphertext: "x7kQ9mP2zL4nR8wV...",\n  key: alice_private_key\n)\n\n\u2192 "Meet at 3pm" \u2705`,
        color: "#a78bfa",
      },
      {
        from: "alice",
        to: "math",
        label: "Sign a message",
        description:
          "Now authentication: Alice wants to prove she sent a message. She signs it with her private key. This produces a signature that anyone with her public key can verify, but nobody can forge.",
        payload: `sign(\n  message: "I approve this transfer",\n  key: alice_private_key\n)\n\n\u2192 signature: "r9Xk2mQ7pL..."`,
        color: "#a78bfa",
      },
      {
        from: "alice",
        to: "bob",
        label: "Send message + signature",
        description:
          "Alice sends the original message along with the signature. The message itself is NOT encrypted here \u2014 signing is about proving authorship, not secrecy.",
        payload: `{\n  "message": "I approve this transfer",\n  "signature": "r9Xk2mQ7pL..."\n}\n\nNote: the message is readable.\nThe signature proves WHO sent it,\nnot what it says.`,
        color: "#6c8cff",
      },
      {
        from: "bob",
        to: "math",
        label: "Verify signature with Alice's public key",
        description:
          "Bob uses Alice\u2019s public key to verify the signature. If it checks out, Bob knows: (1) Alice sent this, and (2) the message wasn\u2019t tampered with. This is exactly how passkeys, HTTPS, SSH, and git commit signing work.",
        payload: `verify(\n  message: "I approve this transfer",\n  signature: "r9Xk2mQ7pL...",\n  key: alice_public_key\n)\n\n\u2192 \u2705 VALID\n\n\u2714 Alice sent this (authentication)\n\u2714 Message is unaltered (integrity)`,
        color: "#4ade80",
      },
    ],
    pros: [
      "No shared secret \u2014 server breach only exposes public keys, which are useless for impersonation",
      "Nothing sensitive travels over the wire \u2014 no password to intercept",
      "Underpins HTTPS, SSH keys, git commit signing, crypto wallets, and passkeys",
      "ECC achieves strong security with small keys \u2014 efficient for mobile and embedded devices",
    ],
    cons: [
      "More complex to understand than passwords or shared secrets",
      'Private key loss = permanent lockout (no "forgot password" reset)',
      "Key management is the hard part \u2014 securely storing, rotating, and backing up keys",
      "Computationally more expensive than symmetric encryption (often used as a hybrid: public-key to exchange a symmetric key, then symmetric for bulk data)",
    ],
  },

  // ── Server Sessions + Browser Cookies ──
  {
    id: "sessions",
    title: "Server Sessions + Browser Cookies",
    subtitle: "Stateful: server stores session records",
    entities: [
      {
        id: "client",
        label: "Browser",
        icon: "\uD83C\uDF10",
        color: "#6c8cff",
      },
      {
        id: "server",
        label: "Server",
        icon: "\uD83D\uDDA5\uFE0F",
        color: "#4ade80",
      },
      {
        id: "db",
        label: "Session Store",
        icon: "\uD83D\uDDC4\uFE0F",
        color: "#fb923c",
      },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        label: "POST /login",
        description:
          "User submits their username and password via a login form.",
        payload: `POST /login\n\n{ "username": "alice",\n  "password": "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "db",
        label: "Store session",
        description:
          "Server validates the password (against a salted hash), then creates a session record with a unique ID and stores it.",
        payload: `INSERT INTO sessions\n  (id, user_id, created_at, expires_at)\nVALUES\n  ('s_abc123', 42, NOW(), NOW() + '24h')`,
        color: "#fb923c",
      },
      {
        from: "server",
        to: "client",
        label: "Set-Cookie header",
        description:
          "Server responds with a Set-Cookie header. The browser automatically stores this cookie and will attach it to every future request to this domain.",
        payload: `HTTP/1.1 200 OK\nSet-Cookie: session_id=s_abc123;\n  HttpOnly; Secure; SameSite=Strict;\n  Path=/; Max-Age=86400`,
        color: "#4ade80",
      },
      {
        from: "client",
        to: "server",
        label: "Request + Cookie",
        description:
          "On subsequent requests, the browser automatically includes the cookie. No extra code needed on the client side.",
        payload: `GET /api/profile HTTP/1.1\nCookie: session_id=s_abc123`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "db",
        label: "Lookup session",
        description:
          "Server extracts the session_id from the cookie and looks it up in the session store to verify it\u2019s valid and not expired.",
        payload: `SELECT * FROM sessions\nWHERE id = 's_abc123'\n  AND expires_at > NOW()`,
        color: "#fb923c",
      },
      {
        from: "db",
        to: "server",
        label: "Session found",
        description:
          "Session store returns the session record, confirming the user\u2019s identity.",
        payload: `{ "id": "s_abc123",\n  "user_id": 42,\n  "created_at": "2024-01-15T10:00:00Z" }`,
        color: "#fb923c",
      },
      {
        from: "server",
        to: "client",
        label: "200 OK + data",
        description:
          "Server knows the request is from user 42 (alice) and returns the protected data.",
        payload: `HTTP/1.1 200 OK\n\n{ "user": "alice",\n  "profile": { ... } }`,
        color: "#4ade80",
      },
    ],
    pros: [
      "Simple mental model \u2014 session is just a database row",
      "Easy to revoke: delete the session row and the user is logged out",
      "Cookie is sent automatically by the browser (no client-side code)",
      "HttpOnly flag prevents JavaScript from reading the cookie (XSS protection)",
    ],
    cons: [
      "Server must store state \u2014 every active session is a record in the store",
      "Scaling requires a shared session store (Redis, DB) across servers",
      "If someone steals the cookie, they can impersonate the user",
      "Passwords must be stored securely (salted + hashed)",
    ],
  },

  // ── Opaque Tokens ──
  {
    id: "opaque-tokens",
    title: "Opaque Tokens",
    subtitle:
      "Like sessions, but token in Authorization header instead of cookie",
    entities: [
      {
        id: "client",
        label: "Client App",
        icon: "\uD83D\uDCF1",
        color: "#6c8cff",
      },
      {
        id: "server",
        label: "Server",
        icon: "\uD83D\uDDA5\uFE0F",
        color: "#4ade80",
      },
      {
        id: "db",
        label: "Token Store",
        icon: "\uD83D\uDDC4\uFE0F",
        color: "#fb923c",
      },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        label: "POST /login",
        description:
          "Client sends credentials. This could be a mobile app, CLI tool, or another service \u2014 not just a browser.",
        payload: `POST /login\n\n{ "username": "alice",\n  "password": "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "db",
        label: "Store token",
        description:
          'Server generates a random, opaque token (a string with no inherent meaning\u200a\u2014\u200ahence "opaque") and stores it alongside the user\u2019s identity.',
        payload: `INSERT INTO tokens\n  (value, user_id, scope, expires_at)\nVALUES\n  ('tok_x7k9m2pL...', 42, 'read write',\n   NOW() + '30d')`,
        color: "#fb923c",
      },
      {
        from: "server",
        to: "client",
        label: "Return token",
        description:
          "Server sends the token to the client. The client is responsible for storing it (in memory, secure storage, etc.) and attaching it to future requests.",
        payload: `HTTP/1.1 200 OK\n\n{ "access_token": "tok_x7k9m2pL...",\n  "token_type": "Bearer",\n  "expires_in": 2592000 }`,
        color: "#4ade80",
      },
      {
        from: "client",
        to: "server",
        label: "Authorization: Bearer ...",
        description:
          "Client explicitly adds the token to the Authorization header. Unlike cookies, this is NOT automatic \u2014 the client code must do this.",
        payload: `GET /api/profile HTTP/1.1\nAuthorization: Bearer tok_x7k9m2pL...`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "db",
        label: "Lookup token",
        description:
          "Server extracts the token from the header and looks it up in the token store.",
        payload: `SELECT * FROM tokens\nWHERE value = 'tok_x7k9m2pL...'\n  AND expires_at > NOW()`,
        color: "#fb923c",
      },
      {
        from: "db",
        to: "server",
        label: "Token found",
        description:
          "Token store returns the record. Server now knows the caller is user 42 with 'read write' scope.",
        payload: `{ "value": "tok_x7k9m2pL...",\n  "user_id": 42,\n  "scope": "read write" }`,
        color: "#fb923c",
      },
      {
        from: "server",
        to: "client",
        label: "200 OK + data",
        description:
          "Server returns the protected data, just like server-side sessions.",
        payload: `HTTP/1.1 200 OK\n\n{ "user": "alice",\n  "profile": { ... } }`,
        color: "#4ade80",
      },
    ],
    pros: [
      "Works for non-browser clients (mobile apps, CLIs, service-to-service)",
      "No cookies means no CSRF vulnerability",
      "Easy to revoke: delete the token from the store",
      "Can scope tokens to specific permissions",
    ],
    cons: [
      "Still requires server-side storage (like sessions)",
      "Client must manage the token (store securely, attach to requests)",
      "Vulnerable to XSS if token is stored in localStorage",
    ],
  },

  // ── API Key Authentication ──
  {
    id: "api-keys",
    title: "API Key Authentication",
    subtitle:
      "Long-lived keys that identify an application or developer, not a user session",
    entities: [
      {
        id: "developer",
        label: "Developer",
        icon: "\uD83D\uDC69\u200D\uD83D\uDCBB",
        color: "#6c8cff",
      },
      {
        id: "service",
        label: "API Service",
        icon: "\uD83D\uDD10",
        color: "#a78bfa",
      },
      {
        id: "db",
        label: "Key Store",
        icon: "\uD83D\uDDC4\uFE0F",
        color: "#fb923c",
      },
    ],
    steps: [
      {
        from: "developer",
        to: "service",
        label: "Register for API access",
        description:
          "Developer signs up on the service's dashboard (e.g. console.anthropic.com) and requests an API key. This is a one-time setup step, not a per-session login.",
        payload: `Developer creates account on\nservice dashboard and navigates\nto "API Keys" section.\n\nClicks "Create new key"`,
        color: "#6c8cff",
      },
      {
        from: "service",
        to: "db",
        label: "Generate & store key",
        description:
          "Service generates a unique, random key and stores a hashed version alongside the developer's account and permissions. The key is long-lived \u2014 it doesn't expire unless manually revoked.",
        payload: `INSERT INTO api_keys\n  (key_hash, developer_id, name,\n   scope, created_at)\nVALUES\n  (SHA256('sk-ant-abc123...'), 7,\n   'production', 'messages:write',\n   NOW())`,
        color: "#fb923c",
      },
      {
        from: "service",
        to: "developer",
        label: "Return API key",
        description:
          "Service shows the key ONCE. The developer must copy and store it securely (e.g. in a .env file). The service only stores the hash, so it can never show the key again.",
        payload: `\u26A0\uFE0F  Copy your API key now.\n    You won't see it again.\n\nsk-ant-abc123-xK9m2pL...\n\n\u2192 Store in .env file:\n  ANTHROPIC_API_KEY=sk-ant-abc123-xK9m...`,
        color: "#a78bfa",
      },
      {
        from: "developer",
        to: "service",
        label: "Request with API key",
        description:
          "Developer's application sends the key with every request. Unlike session tokens, there's no login step \u2014 the key IS the credential. It typically goes in a header, not a cookie.",
        payload: `POST /v1/messages HTTP/1.1\nHost: api.anthropic.com\nx-api-key: sk-ant-abc123-xK9m2pL...\nContent-Type: application/json\n\n{ "model": "claude-sonnet-4-5-20250929",\n  "messages": [{ "role": "user",\n    "content": "Hello!" }] }`,
        color: "#6c8cff",
      },
      {
        from: "service",
        to: "db",
        label: "Lookup key hash",
        description:
          "Service hashes the received key and looks it up in the key store to identify the caller and check permissions. This is similar to opaque token lookup, but the key represents a developer account, not a user session.",
        payload: `SELECT * FROM api_keys\nWHERE key_hash = SHA256(\n  'sk-ant-abc123-xK9m2pL...'\n)`,
        color: "#fb923c",
      },
      {
        from: "db",
        to: "service",
        label: "Key found",
        description:
          "Key store returns the record. The service now knows which developer account is making the request and what permissions they have.",
        payload: `{ "developer_id": 7,\n  "name": "production",\n  "scope": "messages:write",\n  "rate_limit": "1000/min" }`,
        color: "#fb923c",
      },
      {
        from: "service",
        to: "developer",
        label: "200 OK + response",
        description:
          "Service processes the request and returns the result. The key identified the application, not an individual user.",
        payload: `HTTP/1.1 200 OK\n\n{ "content": [{\n    "type": "text",\n    "text": "Hello! How can I\n             help you today?"\n  }] }`,
        color: "#a78bfa",
      },
    ],
    pros: [
      "Dead simple \u2014 no login flow, no tokens to refresh",
      "Great for service-to-service and machine-to-machine communication",
      "Easy to scope keys to specific permissions (read-only, write, admin)",
      "Easy to rotate or revoke individual keys without affecting others",
    ],
    cons: [
      "Long-lived by default \u2014 if leaked, it's valid until manually revoked",
      "No built-in expiration (unlike JWTs)",
      "Identifies an application/developer, not a specific human user",
      "Still stateful: server must store and look up every key",
      "Don\u2019t check your API keys into GitHub! Store in .env and .gitignore it",
    ],
  },

  // ── JWT ──
  {
    id: "jwt",
    title: "JSON Web Tokens (JWT)",
    subtitle: "Stateless: the token IS the session",
    entities: [
      { id: "client", label: "Client", icon: "\uD83D\uDCBB", color: "#6c8cff" },
      {
        id: "server",
        label: "Server",
        icon: "\uD83D\uDDA5\uFE0F",
        color: "#4ade80",
      },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        label: "POST /login",
        description: "Client sends credentials, same as before.",
        payload: `POST /login\n\n{ "username": "alice",\n  "password": "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "server",
        label: "Create & sign JWT",
        description:
          'Server constructs a payload ("claims") and cryptographically signs it. The result is three base64-encoded parts: header.payload.signature. This is NOT encryption \u2014 anyone can read the payload. The signature just proves it hasn\u2019t been tampered with.',
        payload: `HEADER:  { "alg": "HS256", "typ": "JWT" }\n\nPAYLOAD: { "sub": 42, "name": "alice",\n  "role": "user", "iat": 1705312000,\n  "exp": 1705398400 }\n\nSIGNATURE: HMAC-SHA256(\n  base64(header) + "." + base64(payload),\n  SECRET_KEY\n)`,
        color: "#a78bfa",
      },
      {
        from: "server",
        to: "client",
        label: "Return JWT",
        description:
          "Server sends the JWT to the client. Notice: NO database write happened. The server does not store this token anywhere.",
        payload: `HTTP/1.1 200 OK\n\n{ "token": "eyJhbGciOiJIUzI1NiJ9\n  .eyJzdWIiOjQyLCJuYW1lIjoi\n  YWxpY2UiLCJyb2xlIjoidXNlci\n  J9.SflKxwRJSMeKKF2QT4fwpM\n  eJf36POk6yJV_adQssw5c" }`,
        color: "#4ade80",
      },
      {
        from: "client",
        to: "server",
        label: "Authorization: Bearer eyJ...",
        description:
          "Client sends the JWT in the Authorization header on subsequent requests.",
        payload: `GET /api/profile HTTP/1.1\nAuthorization: Bearer eyJhbGciOiJIUz...`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "server",
        label: "Verify signature",
        description:
          'Server recomputes the signature from the header+payload using its secret key and checks if it matches. NO database lookup needed! This is what makes JWT "stateless."',
        payload: `expected = HMAC-SHA256(\n  receivedHeader + "." + receivedPayload,\n  SECRET_KEY\n)\n\nreceived === expected  \u2192  \u2705 VALID\n\nAlso check: exp > now()  \u2192  \u2705 NOT EXPIRED`,
        color: "#a78bfa",
      },
      {
        from: "server",
        to: "client",
        label: "200 OK + data",
        description:
          "Signature is valid, token is not expired \u2014 server trusts the claims and returns protected data.",
        payload: `HTTP/1.1 200 OK\n\n{ "user": "alice",\n  "profile": { ... } }`,
        color: "#4ade80",
      },
    ],
    pros: [
      "No server-side storage needed \u2014 highly scalable",
      "Works across multiple servers with no shared state",
      "Self-contained: token carries all the info the server needs",
      "No database lookup on every request",
    ],
    cons: [
      "Hard to revoke \u2014 token is valid until it expires (or you need a blocklist)",
      "Payload is readable by anyone (base64 is NOT encryption)",
      "Payload can get large if you include many claims",
      "Must refresh tokens frequently to limit damage window",
    ],
  },

  // ── OAuth 2.0 + OIDC ──
  {
    id: "oauth",
    title: "OAuth 2.0 + OIDC",
    subtitle: "Delegated auth via a third-party identity provider",
    entities: [
      {
        id: "client",
        label: "Browser",
        icon: "\uD83C\uDF10",
        color: "#6c8cff",
      },
      {
        id: "app",
        label: "Your Server",
        icon: "\uD83D\uDDA5\uFE0F",
        color: "#4ade80",
      },
      {
        id: "provider",
        label: "Auth Provider\n(e.g. Google)",
        icon: "\uD83D\uDD10",
        color: "#a78bfa",
      },
    ],
    steps: [
      {
        from: "client",
        to: "app",
        label: 'Click "Login with Google"',
        description:
          "User clicks a social login button. Your server generates a URL pointing to the auth provider with specific parameters.",
        payload: `User clicks: "Sign in with Google"`,
        color: "#6c8cff",
      },
      {
        from: "app",
        to: "client",
        label: "Redirect to provider",
        description:
          "Your server (or client-side code) redirects the user's browser to the auth provider's authorization endpoint, including your app's client_id and a redirect_uri.",
        payload: `HTTP/1.1 302 Found\nLocation:\n  https://accounts.google.com/o/oauth2\n  /auth?response_type=code\n  &client_id=YOUR_APP_ID\n  &redirect_uri=https://yourapp.com\n    /callback\n  &scope=openid email profile\n  &state=random_csrf_token`,
        color: "#4ade80",
      },
      {
        from: "client",
        to: "provider",
        label: "User authenticates",
        description:
          "The browser is now at Google's login page. The user enters their Google credentials and grants permission. Your app never sees the user's Google password.",
        payload: `User enters their Google credentials\non Google's own login page.\n\nYour app NEVER sees this password.`,
        color: "#a78bfa",
      },
      {
        from: "provider",
        to: "client",
        label: "Redirect + auth code",
        description:
          "After successful authentication, the provider redirects the browser back to your app's callback URL with a short-lived authorization code.",
        payload: `HTTP/1.1 302 Found\nLocation:\n  https://yourapp.com/callback\n  ?code=AUTH_CODE_xyz789\n  &state=random_csrf_token`,
        color: "#a78bfa",
      },
      {
        from: "client",
        to: "app",
        label: "Send auth code",
        description:
          "The browser follows the redirect and hits your server's callback endpoint, delivering the authorization code.",
        payload: `GET /callback\n  ?code=AUTH_CODE_xyz789\n  &state=random_csrf_token`,
        color: "#6c8cff",
      },
      {
        from: "app",
        to: "provider",
        label: "Exchange code for tokens",
        description:
          "Your server sends the auth code to the provider's token endpoint, along with your app's client_secret (which only your server knows). This is a server-to-server call.",
        payload: `POST https://oauth2.googleapis.com\n  /token\n\n{ "grant_type":\n    "authorization_code",\n  "code": "AUTH_CODE_xyz789",\n  "client_id": "YOUR_APP_ID",\n  "client_secret": "YOUR_SECRET",\n  "redirect_uri":\n    "https://yourapp.com/callback" }`,
        color: "#4ade80",
      },
      {
        from: "provider",
        to: "app",
        label: "Return tokens",
        description:
          "The provider validates the code and returns an access_token (for API calls), an id_token (a JWT with user identity from OIDC), and optionally a refresh_token.",
        payload: `{ "access_token": "ya29.a0AfH6...",\n  "id_token": "eyJhbGciOi...",\n  "refresh_token": "1//0gdN...",\n  "token_type": "Bearer",\n  "expires_in": 3600 }`,
        color: "#a78bfa",
      },
      {
        from: "app",
        to: "app",
        label: "Validate & create session",
        description:
          "Your server validates the id_token (a JWT from the provider), extracts the user info, creates or updates a user record, and starts a session.",
        payload: `id_token claims:\n{ "sub": "10294857382...",\n  "email": "alice@gmail.com",\n  "name": "Alice",\n  "picture": "https://..." }\n\n\u2192 Create local session for this user`,
        color: "#4ade80",
      },
      {
        from: "app",
        to: "client",
        label: "Set-Cookie + redirect",
        description:
          "Your server sets a session cookie and redirects the user to the app. From here on, it works like regular server-side sessions.",
        payload: `HTTP/1.1 302 Found\nSet-Cookie: session_id=s_local_456;\n  HttpOnly; Secure\nLocation: https://yourapp.com/dashboard`,
        color: "#4ade80",
      },
    ],
    pros: [
      "Your app never handles or stores user passwords",
      "Users don't need to create yet another account",
      "Leverages the provider's security infrastructure (2FA, etc.)",
      "Standardized protocol \u2014 works with Google, GitHub, Apple, etc.",
    ],
    cons: [
      "Most complex flow to implement",
      "Dependent on third-party availability",
      "Multiple redirects can be confusing for users",
      "Need to register your app with each provider",
    ],
  },

  // ── Magic Links ──
  {
    id: "magic-links",
    title: "Magic Links",
    subtitle: "Passwordless login via a one-time link sent to your email",
    entities: [
      {
        id: "client",
        label: "Browser",
        icon: "\uD83C\uDF10",
        color: "#6c8cff",
      },
      {
        id: "server",
        label: "Server",
        icon: "\uD83D\uDDA5\uFE0F",
        color: "#4ade80",
      },
      {
        id: "db",
        label: "Token Store",
        icon: "\uD83D\uDDC4\uFE0F",
        color: "#fb923c",
      },
      {
        id: "email",
        label: "Email Inbox",
        icon: "\uD83D\uDCE7",
        color: "#f472b6",
      },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        label: "Enter email address",
        description:
          'User enters only their email address \u2014 no password field at all. This is the entire "login form."',
        payload: `POST /auth/magic-link\n\n{ "email": "alice@gmail.com" }`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "db",
        label: "Generate & store token",
        description:
          "Server generates a single-use, time-limited token (typically valid for 10\u201315 minutes) and stores it alongside the user's email.",
        payload: `INSERT INTO magic_tokens\n  (token, email, expires_at, used)\nVALUES\n  ('mtk_9xQ3kL...', 'alice@gmail.com',\n   NOW() + '15min', false)`,
        color: "#fb923c",
      },
      {
        from: "server",
        to: "email",
        label: "Send magic link email",
        description:
          "Server sends an email containing a link with the token embedded. The user needs access to their email inbox to proceed.",
        payload: `To: alice@gmail.com\nSubject: Your login link\n\nClick here to sign in:\nhttps://yourapp.com/auth/verify\n  ?token=mtk_9xQ3kL...`,
        color: "#4ade80",
      },
      {
        from: "server",
        to: "client",
        label: '"Check your email"',
        description:
          "Server tells the user to go check their email. The user must now leave your app and open their email client \u2014 this is the main friction point.",
        payload: `HTTP/1.1 200 OK\n\n{ "message": "Check your email!\n  We sent a login link to\n  alice@gmail.com" }`,
        color: "#4ade80",
      },
      {
        from: "email",
        to: "client",
        label: "User clicks link",
        description:
          "User opens the email and clicks the magic link. Their browser navigates to your server's verification endpoint with the token.",
        payload: `User opens email, clicks:\n\n  "Sign in to YourApp"\n\nBrowser navigates to:\nhttps://yourapp.com/auth/verify\n  ?token=mtk_9xQ3kL...`,
        color: "#f472b6",
      },
      {
        from: "client",
        to: "server",
        label: "Send token",
        description:
          "Browser hits the verification endpoint, delivering the token from the email link.",
        payload: `GET /auth/verify\n  ?token=mtk_9xQ3kL...`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "db",
        label: "Validate & invalidate token",
        description:
          "Server looks up the token, checks it hasn't expired or been used, then immediately marks it as used so it can never be reused.",
        payload: `SELECT * FROM magic_tokens\nWHERE token = 'mtk_9xQ3kL...'\n  AND expires_at > NOW()\n  AND used = false\n\n\u2192 UPDATE magic_tokens\n  SET used = true\n  WHERE token = 'mtk_9xQ3kL...'`,
        color: "#fb923c",
      },
      {
        from: "server",
        to: "client",
        label: "Set-Cookie + redirect",
        description:
          "Token is valid! Server creates a session and sets a cookie, just like normal session-based auth. From here on, it's regular cookie-based sessions.",
        payload: `HTTP/1.1 302 Found\nSet-Cookie: session_id=s_magic_789;\n  HttpOnly; Secure\nLocation: https://yourapp.com/dashboard`,
        color: "#4ade80",
      },
    ],
    pros: [
      "Nothing to remember \u2014 no passwords to forget, reuse, or have stolen",
      "Simple UX that most people already understand (click a link in email)",
      "Shifts security burden to the email provider, which already has strong auth",
      "No password database to get breached",
    ],
    cons: [
      "Only as secure as the user's email account \u2014 compromised email = compromised login",
      "Adds friction: user must leave your app, open email, find the message, click the link",
      "Email delivery is unreliable \u2014 spam filters, delays, deliverability issues",
      "Doesn\u2019t work well on mobile when email app and your app are different contexts",
      "Still stateful: server must store and look up the token",
    ],
  },

  // ── One-Time Passwords (OTP) ──
  {
    id: "otp",
    title: "One-Time Passwords (OTP)",
    subtitle: "Short-lived codes via SMS, email, or authenticator app",
    entities: [
      {
        id: "client",
        label: "Browser",
        icon: "\uD83C\uDF10",
        color: "#6c8cff",
      },
      {
        id: "server",
        label: "Server",
        icon: "\uD83D\uDDA5\uFE0F",
        color: "#4ade80",
      },
      {
        id: "device",
        label: "Phone / Auth App",
        icon: "\uD83D\uDCF1",
        color: "#f472b6",
      },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        label: "Request login",
        description:
          "User enters their email or phone number. Optionally they've already entered a password (if OTP is being used as a second factor / 2FA).",
        payload: `POST /auth/otp/request\n\n{ "email": "alice@gmail.com" }\n\n(or after password step for 2FA)`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "server",
        label: "Generate code",
        description:
          "Server generates a short numeric code (typically 6 digits). For SMS/email delivery, the server stores this code with an expiration. For TOTP (authenticator apps), the server and app independently compute the same code from a shared secret + current time.",
        payload: `SMS/Email OTP:\n  code = random 6 digits: 847293\n  expires in 5 minutes\n\nTOTP (authenticator app):\n  code = HMAC-SHA1(\n    shared_secret,\n    floor(time / 30)\n  ) \u2192 truncate to 6 digits`,
        color: "#a78bfa",
      },
      {
        from: "server",
        to: "device",
        label: "Deliver code",
        description:
          "For SMS/email OTP: server sends the code to the user's phone or inbox. For TOTP: this step already happened during setup \u2014 the user scanned a QR code containing the shared secret, and their authenticator app generates codes locally every 30 seconds.",
        payload: `SMS: "Your code is 847293"\n\nEmail: "Your verification code\n  is 847293"\n\nTOTP: Authenticator app already\n  shows the current code\n  (rotates every 30s)`,
        color: "#f472b6",
      },
      {
        from: "device",
        to: "client",
        label: "User reads code",
        description:
          "User reads the 6-digit code from their phone (SMS notification or authenticator app) and types it into your app's verification form.",
        payload: `User sees: 847293\n\nTypes it into the verification\ninput field in the browser`,
        color: "#f472b6",
      },
      {
        from: "client",
        to: "server",
        label: "Submit code",
        description:
          "Browser sends the code the user entered. The server will validate it against what it expects.",
        payload: `POST /auth/otp/verify\n\n{ "email": "alice@gmail.com",\n  "code": "847293" }`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "server",
        label: "Validate code",
        description:
          "For SMS/email: server checks the stored code matches and hasn't expired. For TOTP: server independently computes the expected code from the shared secret + current time window and compares. No database lookup needed for TOTP \u2014 just math.",
        payload: `SMS/Email:\n  stored_code === received_code\n  AND expires_at > NOW()\n  \u2192 \u2705 VALID\n\nTOTP:\n  expected = HMAC(secret, time/30)\n  expected === received_code\n  \u2192 \u2705 VALID`,
        color: "#a78bfa",
      },
      {
        from: "server",
        to: "client",
        label: "200 OK + session",
        description:
          "Code is valid! Server creates a session. If OTP was the only factor, the user is now logged in. If it was 2FA, this completes the second step.",
        payload: `HTTP/1.1 200 OK\nSet-Cookie: session_id=s_otp_321;\n  HttpOnly; Secure\n\n{ "message": "Authenticated!" }`,
        color: "#4ade80",
      },
    ],
    pros: [
      "Familiar UX \u2014 most people have entered a 6-digit code before",
      "TOTP is stateless on the server (just needs the shared secret and a clock)",
      "Short-lived codes limit the window of exposure",
      "Works well as a second factor (2FA) layered on top of passwords",
    ],
    cons: [
      "SMS-based OTP is vulnerable to SIM swapping \u2014 NIST recommends against it for high-security contexts",
      "Phishable: user can be tricked into entering the code on a fake site that relays it in real time",
      "Authenticator app adds onboarding friction (install app, scan QR code, don\u2019t lose your phone)",
      "Most commonly a second factor, not standalone \u2014 still need a primary auth method",
    ],
  },

  // ── Passkeys / WebAuthn ──
  {
    id: "passkeys",
    title: "Passkeys / WebAuthn",
    subtitle: "Public-key cryptography \u2014 phishing-resistant, passwordless",
    entities: [
      {
        id: "client",
        label: "Browser",
        icon: "\uD83C\uDF10",
        color: "#6c8cff",
      },
      {
        id: "device",
        label: "Device\n(Biometrics)",
        icon: "\uD83D\uDD11",
        color: "#f472b6",
      },
      {
        id: "server",
        label: "Server",
        icon: "\uD83D\uDDA5\uFE0F",
        color: "#4ade80",
      },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        label: "Start registration",
        description:
          "User wants to create a passkey. Browser asks the server for a registration challenge \u2014 a random value the device will sign to prove it generated a real key pair.",
        payload: `POST /auth/webauthn/register/start\n\n{ "username": "alice" }`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "client",
        label: "Send challenge",
        description:
          "Server generates a random challenge and sends it along with its domain info. The domain binding is critical \u2014 it's what makes passkeys phishing-resistant.",
        payload: `{ "challenge": "dG9tYXRvLXBvdGF0bw...",\n  "rp": {\n    "name": "YourApp",\n    "id": "yourapp.com"\n  },\n  "user": {\n    "id": "user_42",\n    "name": "alice"\n  } }`,
        color: "#4ade80",
      },
      {
        from: "client",
        to: "device",
        label: "Prompt biometric",
        description:
          "Browser calls the WebAuthn API, which triggers the device\u2019s authenticator. The user verifies their identity locally via fingerprint, face scan, or device PIN. This biometric data NEVER leaves the device.",
        payload: `navigator.credentials.create({\n  publicKey: options\n})\n\n\uD83D\uDD13 Device prompts:\n  "Touch ID for yourapp.com"\n\nBiometric data stays on device.\nServer never sees it.`,
        color: "#6c8cff",
      },
      {
        from: "device",
        to: "device",
        label: "Generate key pair",
        description:
          "After biometric verification, the device generates a public/private key pair. The private key is stored securely on the device (or synced via iCloud Keychain / Google Password Manager). It never leaves.",
        payload: `\uD83D\uDD10 Private key:\n  Stored in secure enclave.\n  NEVER sent to server.\n  Can sync via iCloud/Google.\n\n\uD83D\uDD13 Public key:\n  Will be sent to server.\n  Safe to store \u2014 useless\n  without the private key.`,
        color: "#a78bfa",
      },
      {
        from: "device",
        to: "server",
        label: "Send public key + signed challenge",
        description:
          "Device signs the challenge with the new private key and sends the signature along with the public key to the server. The server can verify the signature but can never derive the private key.",
        payload: `{ "id": "credential_abc...",\n  "publicKey": "MFkwEwYHKoZI...",\n  "signature": sign(\n    challenge,\n    privateKey\n  ),\n  "origin": "https://yourapp.com" }`,
        color: "#f472b6",
      },
      {
        from: "server",
        to: "server",
        label: "Store public key",
        description:
          "Server verifies the signature against the public key, confirms the origin matches, and stores the public key for future logins. This is all the server ever stores \u2014 no password, no shared secret.",
        payload: `INSERT INTO passkeys\n  (credential_id, public_key,\n   user_id, created_at)\nVALUES\n  ('credential_abc...', 'MFkwEw...',\n   42, NOW())\n\n\u2714 No password stored. Ever.`,
        color: "#a78bfa",
      },
      {
        from: "client",
        to: "server",
        label: "Login: request challenge",
        description:
          "Later, when the user wants to sign in, the browser asks the server for a fresh login challenge.",
        payload: `POST /auth/webauthn/login/start\n\n{ "username": "alice" }`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "client",
        label: "Send login challenge",
        description:
          "Server sends a new random challenge. Each login attempt gets a unique challenge to prevent replay attacks.",
        payload: `{ "challenge": "cGVhbnV0LWJ1dHRlcg...",\n  "allowCredentials": [{\n    "id": "credential_abc..."\n  }] }`,
        color: "#4ade80",
      },
      {
        from: "client",
        to: "device",
        label: "Prompt biometric again",
        description:
          "Browser triggers the authenticator again. User taps their fingerprint or uses face scan to unlock the private key.",
        payload: `navigator.credentials.get({\n  publicKey: options\n})\n\n\uD83D\uDD13 "Touch ID for yourapp.com"`,
        color: "#6c8cff",
      },
      {
        from: "device",
        to: "server",
        label: "Send signed challenge",
        description:
          "Device signs the new challenge with the stored private key. The signature is cryptographically bound to yourapp.com \u2014 a phishing site at evil.com could never trigger this credential.",
        payload: `{ "id": "credential_abc...",\n  "signature": sign(\n    "cGVhbnV0LWJ1dHRlcg...",\n    privateKey\n  ),\n  "origin": "https://yourapp.com" }`,
        color: "#f472b6",
      },
      {
        from: "server",
        to: "server",
        label: "Verify signature",
        description:
          "Server retrieves alice's stored public key and verifies the signature. No shared secret, no password comparison, no database of sensitive credentials \u2014 just math.",
        payload: `publicKey = lookup(\n  'credential_abc...'\n)\n\nverify(\n  signature,\n  challenge,\n  publicKey\n) \u2192 \u2705 VALID`,
        color: "#a78bfa",
      },
      {
        from: "server",
        to: "client",
        label: "200 OK + session",
        description:
          "Signature checks out. Server creates a session. The user is logged in without ever typing a password.",
        payload: `HTTP/1.1 200 OK\nSet-Cookie: session_id=s_pk_999;\n  HttpOnly; Secure\n\n{ "message": "Welcome back, Alice!" }`,
        color: "#4ade80",
      },
    ],
    pros: [
      "Phishing-resistant by design \u2014 credentials are cryptographically bound to the domain",
      "Nothing to remember, type, or leak in a data breach (server only stores public keys)",
      "Fast UX once set up \u2014 tap your fingerprint and you\u2019re in",
      "Backed by FIDO Alliance + Apple, Google, Microsoft \u2014 credentials sync across devices",
    ],
    cons: [
      'Relatively new \u2014 user education is still a hurdle ("where did my password go?")',
      "Account recovery is harder if you lose all devices without sync set up",
      "Cross-platform sync is improving but still inconsistent across ecosystems",
      "Requires browser and OS support (widespread now, but not universal)",
    ],
  },
];
