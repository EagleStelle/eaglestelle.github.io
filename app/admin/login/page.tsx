import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/admin");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <LoginForm />
    </div>
  );
}
