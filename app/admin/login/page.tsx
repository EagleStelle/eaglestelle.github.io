"use client";

import { useActionState } from "react";
import { Field, PrimaryButton, TextInput } from "@/components/form";
import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, "");

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-border bg-card p-6"
      >
        <h1 className="font-display text-3xl tracking-tight">Admin sign in</h1>

        <Field label="Password">
          <TextInput
            type="password"
            name="password"
            autoComplete="current-password"
            required
            autoFocus
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </PrimaryButton>
      </form>
    </div>
  );
}
