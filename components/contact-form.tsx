"use client";

import { useActionState, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/form";
import {
  sendContactMessage,
  type ContactFormState,
} from "@/app/contact/actions";

const initialState: ContactFormState = {
  status: "idle",
  message: "",
  submittedAt: 0,
};

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    initialState,
  );

  useEffect(() => {
    if (state.submittedAt > 0 && state.message) {
      if (state.status === "success") {
        formRef.current?.reset();
        toast.success(state.message);
      } else if (state.status === "error") {
        toast.error(state.message);
      }
    }
  }, [state.submittedAt, state.status, state.message]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full flex-col gap-4"
    >
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

      <Field label="Full Name">
        <TextInput
          name="fullName"
          autoComplete="name"
          maxLength={120}
          required
        />
      </Field>

      <Field label="Email">
        <TextInput
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Message">
        <TextArea name="message" maxLength={4000} required />
      </Field>

      <div className="w-full">
        <PrimaryButton
          type="submit"
          disabled={pending}
          size="icon-text"
          className="w-full justify-center"
        >
          {pending ? (
            <>
              <HugeiconsIcon
                aria-hidden="true"
                icon={Loading02Icon}
                className="size-4 animate-spin"
              />
              Sending...
            </>
          ) : (
            <>
              <HugeiconsIcon
                aria-hidden="true"
                icon={Mail01Icon}
                className="size-4"
              />
              Send message
            </>
          )}
        </PrimaryButton>
      </div>
    </form>
  );
}
