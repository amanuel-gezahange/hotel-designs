import { hasSuper } from "@/lib/db";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const firstRun = process.env.NODE_ENV !== "production" && !(await hasSuper());
  return <LoginForm firstRun={firstRun} />;
}
