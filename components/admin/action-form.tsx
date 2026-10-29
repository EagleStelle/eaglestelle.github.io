"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type ActionFormProps = Omit<ComponentProps<"form">, "action"> & {
  action: (formData: FormData) => Promise<void>;
  success: string;
  children: ReactNode;
  resetOnSuccess?: boolean;
};

type CreateActionFormProps = Omit<ActionFormProps, "resetOnSuccess">;

type FormSubmitEvent = Parameters<
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
}: ActionFormProps) {
  const tasksRef = useRef(new Set<BeforeSubmitTask>());
  const formRef = useRef<HTMLFormElement>(null);
  const skipPrepareRef = useRef(false);
  const preparingRef = useRef(false);
  const [preparing, setPreparing] = useState(false);
  const [pending, startTransition] = useTransition();

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

  function handleSubmitCapture(event: FormSubmitEvent) {
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

  function handleSubmit(event: FormSubmitEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
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
    });
  }

  return (
    <ActionFormContext.Provider value={contextValue}>
      <form
        {...props}
        ref={formRef}
        aria-busy={preparing || pending || props["aria-busy"]}
        onSubmitCapture={handleSubmitCapture}
        onSubmit={handleSubmit}
      >
        {children}
      </form>
    </ActionFormContext.Provider>
  );
}

export function CreateActionForm(props: CreateActionFormProps) {
  return <ActionForm {...props} resetOnSuccess />;
}
