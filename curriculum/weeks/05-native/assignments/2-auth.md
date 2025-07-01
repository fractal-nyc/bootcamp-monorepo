# Expo and Auth

Today, you should get to the point where your native app can interact with your backend
and users can authenticate themselves.

## Instructions

- Make sure your backend is deployed and reachable on the public internet (e.g. vercel)
- Add communication from your app to your backend. 
    - tRPC will add typing and consistent client query conventions. If your backend
      and app are in the same repo, this should be pretty straightforward.
    - alternatively you can use things like `fetch`, but you will lose type safety and have to implement a react-query client yourself.
- Install BetterAuth into your backend. You should know how to do this thanks to week 3.
- Install [BetterAuth into your expo app](https://www.better-auth.com/docs/integrations/expo).
    - Remember, BetterAuth works on cookies, but cookies are a browser concept. You will have to wire that into your client request-making code.
- Get to work adding sign-in, feature work, etc.