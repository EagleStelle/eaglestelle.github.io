"use server";

import { redirect } from "next/navigation";
import { createSession, verifyPassword } from "@/lib/auth";

export async function login(
  _previousState: string,
  formData: FormData,
): Promise<string> {
  const password = String(formData.get("password") ?? "");

  if (password === "" || !(await verifyPassword(password))) {
    return "Incorrect password.";
  }

  await createSession();
  redirect("/admin");
}
