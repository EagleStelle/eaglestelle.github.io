"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { toast } from "sonner";

type Props = Omit<ComponentProps<"form">, "action"> & {
  action: (formData: FormData) => Promise<void>;
  success: string;
  children: ReactNode;
  resetOnSuccess?: boolean;
};

type FormSubmitCaptureEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmitCapture"]>
>[0];

type BeforeSubmitTask = {
  hasPending: () => boolean;
  run: () => Promise<void>;
};

type ActionFormContextValue = {
  registerBeforeSubmit: (task: BeforeSubmitTask) => () => void;
};

const ActionFormContext = createContext<ActionFormContextValue | null>(null);

export function useBeforeActionSubmit(task: BeforeSubmitTask): void {
  const context = useContext(ActionFormContext);

  useEffect(() => {
    if (!context) return undefined;
    return context.registerBeforeSubmit(task);
  }, [context, task]);
}

export function ActionForm({
  action,
  success,
  children,
  resetOnSuccess = false,
  onSubmitCapture,
  ...props
}: Props) {
  const tasksRef = useRef(new Set<BeforeSubmitTask>());
  const formRef = useRef<HTMLFormElement>(null);
  const skipPrepareRef = useRef(false);
  const preparingRef = useRef(false);
  const [preparing, setPreparing] = useState(false);

  const registerBeforeSubmit = useCallback((task: BeforeSubmitTask) => {
    tasksRef.current.add(task);
    return () => {
      tasksRef.current.delete(task);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ registerBeforeSubmit }),
    [registerBeforeSubmit],
  );

  function handleSubmitCapture(event: FormSubmitCaptureEvent) {
    onSubmitCapture?.(event);
    if (event.defaultPrevented) return;

    if (skipPrepareRef.current) {
      skipPrepareRef.current = false;
      return;
    }

    const tasks = [...tasksRef.current].filter((task) => task.hasPending());
    if (tasks.length === 0) return;

    event.preventDefault();
    if (preparingRef.current) return;

    const form = event.currentTarget;
    preparingRef.current = true;
    setPreparing(true);

    void (async () => {
      try {
        for (const task of tasks) {
          await task.run();
        }
        skipPrepareRef.current = true;
        form.requestSubmit();
      } catch (cause) {
        toast.error(
          cause instanceof Error ? cause.message : "Image upload failed.",
        );
      } finally {
        preparingRef.current = false;
        setPreparing(false);
      }
    })();
  }

  return (
    <ActionFormContext.Provider value={contextValue}>
      <form
        {...props}
        ref={formRef}
        aria-busy={preparing || props["aria-busy"]}
        onSubmitCapture={handleSubmitCapture}
        action={async (formData) => {
          try {
            await action(formData);
            toast.success(success);
            if (resetOnSuccess) {
              formRef.current?.reset();
            }
          } catch (cause) {
            toast.error(
              cause instanceof Error ? cause.message : "Something went wrong.",
            );
          }
        }}
      >
        {children}
      </form>
    </ActionFormContext.Provider>
  );
}
