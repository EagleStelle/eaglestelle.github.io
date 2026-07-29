import type { ComponentProps, ReactNode } from "react";

const controlClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:bg-zinc-900 dark:focus:border-white/50";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <input {...props} className={controlClass} />;
}

export function TextArea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${controlClass} min-h-28`} />;
}

export function PrimaryButton(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
    />
  );
}

export function DangerButton(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="rounded-md border border-red-600/40 px-3 py-1.5 text-sm text-red-600 hover:bg-red-600/10"
    />
  );
}
