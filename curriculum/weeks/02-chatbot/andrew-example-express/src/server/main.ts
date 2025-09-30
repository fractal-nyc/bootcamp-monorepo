import express from "express";
import ViteExpress from "vite-express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { User } from "better-auth";

declare module "express-serve-static-core" {
  interface Request {
    /**
     * The authenticated Better Auth user, if present.
     */
    user?: User;
  }
}


const app = express();

async function userMiddleware(req, res, next) {
  const authData = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  const user = authData?.user
  req.user = user
  next()
}

app.use(userMiddleware)


app.get("/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

app.post("/data", (_, res) => {
  res.send("hello you requested some data")
})


// app.get("/chats", async (req, res) => {
//   // LOADER
//   const user = req.user
//   if (!user) res.status(401).send("Permission Denied")

//   // note: this will only get the chats for the CURRENT USER
//   const chats = db.select(*).from(chatTable).where(userId === user.id)
//   res.send(chats)


//   // // APP RENDERING
//   // render(<Chat/>,)
// })

app.get("/protected", async (req, res) => {
  const authData = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (authData?.user) {
    res.send("SUCCESS")
  }
  else {
    res.status(401).send("Permission Denied")
  }
})


// WHAT DOES THIS DO???
app.all("/api/auth/{*any}", toNodeHandler(auth));

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());



ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
