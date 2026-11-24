import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAuthRequired } from "@/lib/env";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  if (!isAuthRequired()) {
    redirect("/");
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
