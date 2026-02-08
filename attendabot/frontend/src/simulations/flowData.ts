import type { AuthFlow } from "./types";

export const flows: AuthFlow[] = [
  // ── No Auth ──
  {
    id: "no-auth",
    title: "No Auth",
    subtitle: "No identity verification at all",
    entities: [
      { id: "client", label: "Client", icon: "\uD83D\uDCBB", color: "#6c8cff" },
      { id: "server", label: "Server", icon: "\uD83D\uDDA5\uFE0F", color: "#4ade80" },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        label: "GET /api/data",
        description:
          "Client sends a request with no credentials whatsoever. The server has no idea who is making the request.",
        payload: `GET /api/data HTTP/1.1\nHost: example.com\n\n(no credentials)`,
      },
      {
        from: "server",
        to: "client",
        label: "200 OK + data",
        description:
          "Server responds with the data. Anyone can access this endpoint \u2014 there is no identity check.",
        payload: `HTTP/1.1 200 OK\n\n{ "data": [ ... ] }`,
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

  // ── Server-Side Sessions ──
  {
    id: "sessions",
    title: "Server-Side Sessions",
    subtitle: "Stateful: server stores session records",
    entities: [
      { id: "client", label: "Browser", icon: "\uD83C\uDF10", color: "#6c8cff" },
      { id: "server", label: "Server", icon: "\uD83D\uDDA5\uFE0F", color: "#4ade80" },
      { id: "db", label: "Session Store", icon: "\uD83D\uDDC4\uFE0F", color: "#fb923c" },
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
    subtitle: "Like sessions, but token in Authorization header instead of cookie",
    entities: [
      { id: "client", label: "Client App", icon: "\uD83D\uDCF1", color: "#6c8cff" },
      { id: "server", label: "Server", icon: "\uD83D\uDDA5\uFE0F", color: "#4ade80" },
      { id: "db", label: "Token Store", icon: "\uD83D\uDDC4\uFE0F", color: "#fb923c" },
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
      "Don\u2019t check your API keys into GitHub!",
    ],
  },

  // ── JWT ──
  {
    id: "jwt",
    title: "JSON Web Tokens (JWT)",
    subtitle: "Stateless: the token IS the session",
    entities: [
      { id: "client", label: "Client", icon: "\uD83D\uDCBB", color: "#6c8cff" },
      { id: "server", label: "Server", icon: "\uD83D\uDDA5\uFE0F", color: "#4ade80" },
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
          "Server constructs a payload (\"claims\") and cryptographically signs it. The result is three base64-encoded parts: header.payload.signature. This is NOT encryption \u2014 anyone can read the payload. The signature just proves it hasn\u2019t been tampered with.",
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
        description: "Client sends the JWT in the Authorization header on subsequent requests.",
        payload: `GET /api/profile HTTP/1.1\nAuthorization: Bearer eyJhbGciOiJIUz...`,
        color: "#6c8cff",
      },
      {
        from: "server",
        to: "server",
        label: "Verify signature",
        description:
          "Server recomputes the signature from the header+payload using its secret key and checks if it matches. NO database lookup needed! This is what makes JWT \"stateless.\"",
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
      { id: "client", label: "Browser", icon: "\uD83C\uDF10", color: "#6c8cff" },
      { id: "app", label: "Your Server", icon: "\uD83D\uDDA5\uFE0F", color: "#4ade80" },
      { id: "provider", label: "Auth Provider\n(e.g. Google)", icon: "\uD83D\uDD10", color: "#a78bfa" },
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
];
