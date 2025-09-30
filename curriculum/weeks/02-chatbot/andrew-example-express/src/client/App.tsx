import "./App.css";

import { useEffect, useState } from "react";

import reactLogo from "./assets/react.svg";
import { methods } from "better-auth/react";
import { authClient } from "./lib/authClient";

type User = {
  id: string;
  email: string;
  name: string;
  image: string | null | undefined;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function UserInfo() {
  const { data } = authClient.useSession()

  return <div>{JSON.stringify(data?.user)}</div>
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState<User | undefined>(undefined)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const authResponse = await authClient.signUp.email({
      email: email,
      name: "Andrew",
      password: password
    })
    console.log(authResponse)
    setUser(authResponse.data?.user)

  }

  return <div>
    <form onSubmit={onSubmit}>
      <input name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">login</button>
    </form>
    {JSON.stringify(user)}
  </div>
}

function App() {
  const { data, isPending } = authClient.useSession()

  // useEffect(() => {
  //   fetch('/protected')
  // }, [])
  if (isPending) return (<div>Loading...</div>)

  return (
    <div className="App">
      {!data?.session && <SignIn />}
      {data?.user && <UserInfo />}
    </div>
  );
}

export default App;
