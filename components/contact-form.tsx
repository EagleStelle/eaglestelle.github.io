"use client";

import { useActionState, type ReactNode } from "react";
import { Loading02Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { UiIcon } from "@/components/ui-icon";
import { Button } from "@/components/ui/button";
import {
  sendContactMessage,
  type ContactFormState,
} from "@/app/contact/actions";
import { cn } from "@/lib/utils";

const initialState: ContactFormState = {
  status: "idle",
  message: "",
  submittedAt: 0,
  values: { fullName: "", email: "", message: "" },
};

const fieldClass =
  "w-full min-w-0 bg-transparent py-1.5 text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground";

function PlanField({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-input px-4 pt-3 pb-2 transition-[background-color,box-shadow] duration-150 focus-within:bg-tint focus-within:shadow-[inset_0_0_0_2px_var(--ring)]",
        className,
      )}
    >
      <label htmlFor={id} className="chart-label text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    initialState,
  );
  const failed = state.status === "error";

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid overflow-hidden rounded-md border border-input bg-card sm:grid-cols-2">
        <PlanField
          id="contact-name"
          label="Full name"
          className="border-b sm:border-r"
        >
          <input
            id="contact-name"
            name="fullName"
            autoComplete="name"
            maxLength={120}
            required
            defaultValue={state.values.fullName}
            className={fieldClass}
          />
        </PlanField>

        <PlanField id="contact-email" label="Email" className="border-b">
          <input
            id="contact-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            defaultValue={state.values.email}
            className={fieldClass}
          />
        </PlanField>

        <PlanField id="contact-message" label="Message" className="sm:col-span-2">
          <textarea
            id="contact-message"
            name="message"
            maxLength={4000}
            required
            rows={6}
            defaultValue={state.values.message}
            className={cn(fieldClass, "min-h-36 resize-y")}
          />
        </PlanField>

        <div className="flex flex-col gap-3 border-t border-input p-4 sm:col-span-2 sm:flex-row sm:items-center sm:gap-4">
          <Button
            type="submit"
            disabled={pending}
            size="icon-text"
            className="h-11 w-full justify-center px-5 text-base sm:w-auto"
          >
            <UiIcon
              icon={pending ? Loading02Icon : Mail01Icon}
              className={pending ? "animate-spin motion-reduce:animate-none" : undefined}
            />
            {pending ? "Sending…" : "Send message"}
          </Button>

          <p
            role="status"
            aria-live="polite"
            className={cn(
              "min-h-6 text-sm leading-6 font-medium",
              failed ? "text-destructive" : "text-primary",
            )}
          >
            {state.message}
          </p>
        </div>
      </div>
    </form>
  );
}
