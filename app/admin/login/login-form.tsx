"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import QRCode from "qrcode";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { Field, PrimaryButton, TextInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {
      stage: "login",
      message: "",
      requiresTotp: false,
    },
  );

  if (state.stage === "totp") {
    return (
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
        <input type="hidden" name="mode" value="totp" />

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl tracking-tight">
            Authenticator code
          </h1>
          {state.username && (
            <p className="text-sm leading-6 text-muted-foreground">
              Enter the 6-digit code for {state.username}.
            </p>
          )}
        </div>

        <Field label="Authenticator Code">
          <TextInput
            inputMode="numeric"
            name="code"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
          />
        </Field>

        {state.message && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        <PrimaryButton type="submit" disabled={pending}>
          {pending ? (
            <>
              <HugeiconsIcon
                aria-hidden="true"
                icon={Loading02Icon}
                className="size-4 animate-spin"
              />
              Verifying...
            </>
          ) : (
            "Verify code"
          )}
        </PrimaryButton>
      </form>
    );
  }

  if (state.stage === "setup" && state.setup) {
    return (
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
        <input type="hidden" name="mode" value="setup" />

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl tracking-tight">
            Set up authenticator
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Add this setup key to your authenticator app, then enter the
            6-digit code it creates.
          </p>
        </div>

        <AuthenticatorQrCode
          key={state.setup.otpAuthUrl}
          otpAuthUrl={state.setup.otpAuthUrl}
        />

        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <dl className="grid gap-3 text-sm">
            <div className="grid gap-1">
              <dt className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                Account
              </dt>
              <dd className="break-all">{state.setup.accountName}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                Setup Key
              </dt>
              <dd className="break-all font-mono text-xs">
                {state.setup.secret}
              </dd>
            </div>
          </dl>
        </div>

        <Button asChild variant="secondary" size="icon-text">
          <a href={state.setup.otpAuthUrl}>
            <HugeiconsIcon
              aria-hidden="true"
              icon={SecurityCheckIcon}
              className="size-4"
            />
            Open authenticator
          </a>
        </Button>

        <Field label="Authenticator Code">
          <TextInput
            inputMode="numeric"
            name="code"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
          />
        </Field>

        {state.message && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        <PrimaryButton type="submit" disabled={pending}>
          {pending ? (
            <>
              <HugeiconsIcon
                aria-hidden="true"
                icon={Loading02Icon}
                className="size-4 animate-spin"
              />
              Verifying...
            </>
          ) : (
            "Finish setup"
          )}
        </PrimaryButton>
      </form>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      <input type="hidden" name="mode" value="login" />

      <h1 className="font-display text-3xl tracking-tight">Admin sign in</h1>

      <Field label="Username">
        <TextInput
          name="username"
          autoComplete="username"
          required
          autoFocus
        />
      </Field>

      <Field label="Password">
        <TextInput
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </Field>

      {state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <PrimaryButton type="submit" disabled={pending}>
        {pending ? (
          <>
            <HugeiconsIcon
              aria-hidden="true"
              icon={Loading02Icon}
              className="size-4 animate-spin"
            />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </PrimaryButton>
    </form>
  );
}

function AuthenticatorQrCode({ otpAuthUrl }: { otpAuthUrl: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(otpAuthUrl, {
      margin: 1,
      scale: 8,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) setQrCodeUrl(url);
      })
      .catch(() => {
        if (active) setQrCodeUrl("");
      });

    return () => {
      active = false;
    };
  }, [otpAuthUrl]);

  if (!qrCodeUrl) {
    return (
      <div className="flex size-56 items-center justify-center self-center rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground">
        Creating QR code...
      </div>
    );
  }

  return (
    <div className="flex justify-center self-center rounded-xl border border-border bg-white p-3">
      <Image
        src={qrCodeUrl}
        alt="Authenticator setup QR code"
        width={220}
        height={220}
        unoptimized
        className="size-56"
      />
    </div>
  );
}
