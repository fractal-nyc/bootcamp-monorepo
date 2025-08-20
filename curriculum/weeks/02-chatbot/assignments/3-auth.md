# Authentication & API Development (3 days)

## Reading
[https://thecopenhagenbook.com/](https://thecopenhagenbook.com/)

## Lecture Code

For today's assignment, we're taking a step back from NextJS and implementing Authentication and AI requests on our own server using expressJS (or some other server framework, like Elysia, which I personally prefer for projects, but is basically beta software lol).

Hopefully, this teaches you a couple things:
1. How Auth works for APIs and Websites and how you can implement it.
2. How NextJS works (essentially) since it's both a server AND a client framework.

## Overview

You will implement authentication in three ways: 
1. A custom username/password system with in-memory users and secrets,
2. JWT-based authentication with secure cookies,
3. More professional authentication using Better-Auth.

For each approach, you will:
- Build login, logout, and signup flows (client and server).
- Protect API endpoints using your authentication method.
- Use the Vercel AI SDK to power authenticated AI chat endpoints.
- Fully document your API with OpenAPI/Swagger, including authentication flows, request/response schemas, and example requests and responses.

The goal is to deeply understand authentication at every layer, and to produce a professional, well-documented API suitable for production.
[Please read the Copenhagen book.](https://thecopenhagenbook.com/)

also maybe watch this [100 sec primer](https://www.youtube.com/watch?v=UBUNrFtufWo) on auth

## Core Concepts

- username / password
- JWT (JSON Web Tokens)  
- Cookies 
- Better Auth
- API Development & Documentation
- Protected API Endpoints  
- OpenAPI/Swagger Specifications

## Features

Build an express app (or other simple TS server) that implements the following:

- Request Middleware
- Client-Side Log In, Log Out, Sign Up HTML pages
- Authenticated API endpoints
- hosted OpenAPI documentation
- use an Auth library for ["Better Auth"](https://www.better-auth.com/docs/integrations/elysia)

## Step-by-Step Process

This assignment builds a **single application** that you'll develop incrementally. Each step introduces new concepts by letting you discover why they're needed.

### Step 1: Create the Basic App Structure
- [ ] Set up Express (or Elysia) server
- [ ] Create two endpoints:
  - [ ] `GET /api/public` - Returns: `{ message: "This is public information" }`
  - [ ] `GET /api/protected` - Returns: `{ message: "Only admin should be able to see this" }`
- [ ] **Problem**: Both endpoints are actually public! Anyone can access the "protected" one.

### Step 2: Add API Documentation
- [ ] Add Swagger/OpenAPI documentation for both endpoints
- [ ] Serve interactive docs at `/api-docs`
- [ ] Document request/response schemas
- [ ] Test both endpoints through Swagger UI

### Step 3: Create User System
- [ ] Create an in-memory list of users with different roles:
  ```javascript
  const users = [
    { id: 1, username: "admin", password: "admin123", role: "admin" },
    { id: 2, username: "user", password: "user123", role: "basic" }
  ];
  ```
- [ ] **Problem**: How do we know which user is making the request to `/api/protected`?

### Step 4: Add Authentication Middleware (First Attempt)
- [ ] Create middleware that checks if user is admin
- [ ] Apply it to the protected endpoint
- [ ] **Problem**: There's no way to identify the user from the request! We need some way to know who they are.

### Step 5: Introduce User Secrets
- [ ] Give each user a unique SECRET:
  ```javascript
  const users = [
    { id: 1, username: "admin", password: "admin123", role: "admin", secret: "admin-secret-123" },
    { id: 2, username: "user", password: "user123", role: "basic", secret: "user-secret-456" }
  ];
  ```
- [ ] Update middleware to check for secret in:
  - [ ] `Authorization` header: `Bearer admin-secret-123`
- [ ] Find user by secret, check if role is "admin"
- [ ] **Success**: Now the protected endpoint actually works!

### Step 6: Realize the Problems with Secrets
Think about these security issues:
1. **Interception**: Anyone who sees the network request gets the secret
2. **Theft**: Malicious browser extensions can steal cookies
3. **No Expiry**: Secrets never expire - if stolen, they work forever
4. **No Rotation**: Can't easily change secrets without breaking everything

**Solution**: We need something that can expire and be renewed automatically → **JWT Tokens**

### Step 7: Learn About JWTs
- [ ] Read about JWT structure (header.payload.signature)
- [ ] Understand signing vs verification
- [ ] Learn about expiry (`exp` claim)
- [ ] Practice signing and decoding JWTs manually

### Step 8: Implement JWT System
- [ ] Install JWT library (`jsonwebtoken` or `jose`)
- [ ] Create functions to:
  - [ ] Sign JWTs with user info and expiration
  - [ ] Verify and decode JWTs

### Step 9: Create Login Endpoint
- [ ] `POST /api/login` - Takes username/password
  - [ ] Verify credentials against user list
  - [ ] Sign JWT with user ID and role
  - [ ] Set JWT in cookie AND return it in response
  - [ ] Document in Swagger with examples

### Step 10: Update Authentication Middleware
- [ ] Modify middleware to:
  - [ ] Extract JWT from Authorization header OR cookie
  - [ ] Verify JWT signature
  - [ ] Decode user info from JWT
  - [ ] Check if user role is "admin"
  - [ ] Handle expired tokens gracefully

### Step 11: Add More Protected Endpoints
- [ ] `POST /api/chat` - AI chat (requires any authenticated user)
- [ ] `GET /api/chat/history` - Chat history (requires authentication)
- [ ] `DELETE /api/chat/history` - Clear history (requires authentication)
- [ ] Update Swagger with authentication schemes

### Step 12: Test the Full Flow
- [ ] Use Swagger UI to:
  - [ ] Try accessing protected endpoints (should fail)
  - [ ] Login via `/api/login` endpoint
  - [ ] Use returned JWT in "Authorize" button
  - [ ] Access protected endpoints (should work)


# Note: swap to [./4-better-auth.md](./4-better-auth.md) at this point; you are ready to use NextJS now that you've built this all using ElysiaJS.

### Step 13: Professional Implementation with Better Auth
- [ ] Replace your custom system with [Better Auth](https://www.better-auth.com/)
- [ ] Implement proper user database
- [ ] Add features like password hashing, email verification, etc.
- [ ] Keep your existing API endpoints but use Better Auth for authentication

### Step 14: Add real API endpoints for querying an AI app that you are building:

All of these endpoints must require valid authentication:
- [ ] `POST /api/chat` - AI chat completion using Vercel AI SDK
  - [ ] Accept messages in OpenAI format
  - [ ] Return streaming or non-streaming responses
  - [ ] Require authentication token/session
- [ ] `GET /api/chat/history` - Retrieve user's chat history
  - [ ] Return paginated chat history for authenticated user
- [ ] `DELETE /api/chat/history` - Clear user's chat history
  - [ ] Only allow users to delete their own history
- [ ] `GET /api/profile` - Get authenticated user profile
- [ ] `PUT /api/profile` - Update authenticated user profile


### API Development Requirements

Choose ONE of the following approaches for your API development:

#### Option A: Express + OpenAPI (Traditional)
- [ ] Implement AI chat API using Vercel AI SDK with Express
- [ ] Create OpenAPI 3.0 specification using `swagger-jsdoc` and `swagger-ui-express`
- [ ] Add request/response validation using `zod` or `joi`
- [ ] Document all endpoints with proper schemas

#### Option B: Elysia (Modern Alternative)
- [ ] Migrate to Elysia framework for better TypeScript support
- [ ] Implement AI chat API using Vercel AI SDK with Elysia
- [ ] Use Elysia's built-in OpenAPI generation with `@elysiajs/swagger`
- [ ] Leverage Elysia's type-safe validation system

### OpenAPI Specification Requirements
- [ ] Generate complete OpenAPI 3.0 specification
- [ ] Include authentication schemes in spec (Bearer token, Cookie, etc.)
- [ ] Document all request/response schemas
- [ ] Add example requests and responses
- [ ] Include error response documentation
- [ ] Serve interactive API documentation (Swagger UI)
- [ ] Export OpenAPI spec as JSON/YAML file

### Example API Implementation

#### Express + Vercel AI SDK Example:
```javascript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

app.post('/api/chat', authenticateToken, async (req, res) => {
  const { messages } = req.body;
  
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
  });

  return result.toDataStreamResponse();
});
```

#### Elysia + Vercel AI SDK Example:
```typescript
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

const app = new Elysia()
  .use(swagger())
  .post('/api/chat', async ({ body }) => {
    const result = await streamText({
      model: openai('gpt-4o'),
      messages: body.messages,
    });
    
    return result.toDataStreamResponse();
  }, {
    body: t.Object({
      messages: t.Array(t.Object({
        role: t.String(),
        content: t.String()
      }))
    }),
    beforeHandle: authenticateUser
  })
```

Bonus:
- [ ] Add OAuth provider (sign in with Google, Github)  
- [ ] Add magic-link sign in
- [ ] Rate limiting for API endpoints
- [ ] Load and edit an authentication-gated user profile  
      - [ ] Eg. I can change my name if I'm logged in  
- [ ] Serve a React App with the correct authentication cookies, and build a custom UI for your app using React.

## Framework Decision

You may choose between:
1. **Express** (traditional, more setup required for OpenAPI)
2. **Elysia** (modern, built-in TypeScript + OpenAPI support)

If you choose Express, you'll need additional packages for OpenAPI:
- `swagger-jsdoc` for generating OpenAPI from JSDoc comments
- `swagger-ui-express` for serving documentation
- `zod` or `joi` for validation

If you choose Elysia, you get:
- Built-in TypeScript support
- Native OpenAPI generation
- Built-in validation
- Better performance
- Modern development experience

## Resources

- YOU MUST READ THIS: The Copenhagen Book, A Guide To Auth \-- [https://thecopenhagenbook.com/](https://thecopenhagenbook.com/)  
- What is a JWT? \- [Docs](https://jwt.io/introduction)  
- Cookies in Web Development: MDN Web Docs \- [Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- Middleware in Express \- [https://expressjs.com/en/guide/using-middleware.html\#middleware.router](https://expressjs.com/en/guide/using-middleware.html#middleware.router)  
- [Adding auth in express using Better Auth](https://www.better-auth.com/docs/integrations/express)

### API Development Resources

- **Vercel AI SDK Documentation** - [https://sdk.vercel.ai/docs](https://sdk.vercel.ai/docs)
- **Express OpenAPI Tools**:
  - [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) - Generate OpenAPI from JSDoc
  - [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) - Serve Swagger UI
  - [express-openapi-validator](https://github.com/cdimascio/express-openapi-validator) - Request validation
- **Elysia Framework**:
  - [Elysia Documentation](https://elysiajs.com/) - Modern TypeScript framework
  - [Elysia Swagger Plugin](https://elysiajs.com/plugins/swagger) - Built-in OpenAPI generation
  - [Migrating from Express to Elysia](https://elysiajs.com/migrate/from-express) - Migration guide
- **OpenAPI Specification** - [https://swagger.io/specification/](https://swagger.io/specification/)
- **Rate Limiting** - [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) or Elysia rate limiting
- **API Security Best Practices** - [OWASP API Security](https://owasp.org/www-project-api-security/)

## Deliverables

1. **Authentication System** (pick one implementation)
   - Working login/logout/signup flow
   - Protected routes/middleware
   - Client-side authentication state management

2. **API Implementation** 
   - AI chat API using Vercel AI SDK
   - All endpoints require authentication
   - Proper error handling and validation

3. **OpenAPI Documentation**
   - Complete OpenAPI 3.0 specification
   - Interactive Swagger UI
   - Exported JSON/YAML specification file

4. **Demo**
   - Show authentication flow
   - Demonstrate protected API endpoints
   - Browse through API documentation
   - Test API endpoints through Swagger UI
