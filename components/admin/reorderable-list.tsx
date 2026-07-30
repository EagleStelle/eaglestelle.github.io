"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { reorderItems } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ReorderableItem = {
  id: number | string;
  order?: number;
  content: ReactNode;
};

type Props = {
  items: ReorderableItem[];
  entityType?:
    | "skill"
    | "skillCategory"
    | "project"
    | "experience"
    | "education"
    | "certification";
  onReorder?: (orderedIds: Array<number | string>) => void;
  className?: string;
};

export function ReorderableList({
  items,
  entityType,
  onReorder,
  className = "flex flex-col gap-4",
}: Props) {
  const [listState, setListState] = useState<{
    sourceItems: ReorderableItem[];
    list: ReorderableItem[];
  }>({ sourceItems: items, list: items });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [handleIndex, setHandleIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const list = listState.sourceItems === items ? listState.list : items;

  function setList(list: ReorderableItem[]) {
    setListState({ sourceItems: items, list });
  }

  function handleSaveReorder(newList: ReorderableItem[]) {
    setList(newList);
    const orderedIds = newList.map((item) => item.id);

    if (onReorder) {
      onReorder(orderedIds);
      return;
    }

    if (!entityType) return;

    startTransition(async () => {
      try {
        await reorderItems(entityType, orderedIds.map(Number));
        toast.success("Order updated");
      } catch (cause) {
        toast.error(
          cause instanceof Error ? cause.message : "Failed to reorder items.",
        );
        setList(items);
      }
    });
  }

  function moveTo(index: number, target: number) {
    const clamped = Math.min(Math.max(target, 0), list.length - 1);
    if (clamped === index) return;

    const next = [...list];
    const [moved] = next.splice(index, 1);
    next.splice(clamped, 0, moved);
    handleSaveReorder(next);
  }

  function resetDrag() {
    setDraggedIndex(null);
    setDropIndex(null);
    setHandleIndex(null);
  }

  function handleDragOver(event: React.DragEvent, index: number) {
    if (draggedIndex === null) return;

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";

    const rect = event.currentTarget.getBoundingClientRect();
    const isAfter = event.clientY > rect.top + rect.height / 2;
    setDropIndex(index + (isAfter ? 1 : 0));
  }

  function handleDrop(event: React.DragEvent) {
    if (draggedIndex === null) return;

    event.preventDefault();
    event.stopPropagation();

    if (dropIndex === null) {
      resetDrag();
      return;
    }

    const target = dropIndex > draggedIndex ? dropIndex - 1 : dropIndex;
    const source = draggedIndex;
    resetDrag();
    moveTo(source, target);
  }

  function startEditing(index: number) {
    setEditingIndex(index);
    setDraft(String(index + 1));
  }

  function commitEditing(index: number) {
    const parsed = Number.parseInt(draft, 10);
    setEditingIndex(null);

    if (!Number.isFinite(parsed)) return;
    moveTo(index, parsed - 1);
  }

  if (list.length === 0) {
    return null;
  }

  return (
    <div
      className={className}
      aria-busy={isPending}
      onDragOver={(event) => {
        if (draggedIndex !== null) event.preventDefault();
      }}
      onDrop={handleDrop}
    >
      {list.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isEditing = editingIndex === index;
        const showLineBefore =
          draggedIndex !== null &&
          dropIndex === index &&
          dropIndex !== draggedIndex &&
          dropIndex !== draggedIndex + 1;
        const showLineAfter =
          draggedIndex !== null &&
          dropIndex === index + 1 &&
          dropIndex !== draggedIndex &&
          dropIndex !== draggedIndex + 1;

        return (
          <div
            key={item.id}
            draggable={handleIndex === index}
            onDragStart={(event) => {
              if (handleIndex !== index) {
                event.preventDefault();
                return;
              }

              event.stopPropagation();
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(item.id));
              setDraggedIndex(index);
            }}
            onDragOver={(event) => handleDragOver(event, index)}
            onDrop={handleDrop}
            onDragEnd={(event) => {
              if (draggedIndex !== null) event.stopPropagation();
              resetDrag();
            }}
            className={cn(
              "group relative flex items-stretch gap-3 rounded-xl border border-border/80 bg-card/60 p-4 backdrop-blur-xs transition-all duration-200 hover:border-border hover:bg-card hover:shadow-xs",
              isDragging && "scale-[0.99] border-dashed border-primary opacity-40",
            )}
          >
            {showLineBefore && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-3 -top-2.5 h-0.5 rounded-full bg-primary"
              />
            )}
            {showLineAfter && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-3 -bottom-2.5 h-0.5 rounded-full bg-primary"
              />
            )}

            <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-r border-border/50 pr-3">
              <button
                type="button"
                title="Drag to reorder, or focus and press arrow keys"
                aria-label={`Reorder item ${index + 1}, currently position ${index + 1} of ${list.length}`}
                onPointerDown={() => setHandleIndex(index)}
                onPointerUp={() => setHandleIndex(null)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveTo(index, index - 1);
                  }

                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveTo(index, index + 1);
                  }
                }}
                className="cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={DragDropVerticalIcon}
                  className="size-5"
                />
              </button>

              {isEditing ? (
                <Input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={draft}
                  aria-label="Set position"
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) =>
                    setDraft(event.target.value.replace(/\D/g, ""))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitEditing(index);
                    }

                    if (event.key === "Escape") {
                      event.preventDefault();
                      setEditingIndex(null);
                    }
                  }}
                  onBlur={() => commitEditing(index)}
                  className="h-6 w-10 px-1 text-center font-mono text-[11px] md:text-[11px]"
                />
              ) : (
                <button
                  type="button"
                  title="Double-click to set position"
                  onDoubleClick={() => startEditing(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      startEditing(index);
                    }
                  }}
                  disabled={isPending}
                  className="rounded-md px-1 font-mono text-[10px] text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                >
                  #{index + 1}
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1">{item.content}</div>
          </div>
        );
      })}
    </div>
  );
}
