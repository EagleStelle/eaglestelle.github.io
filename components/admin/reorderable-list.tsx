"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  DragDropVerticalIcon,
} from "@hugeicons/core-free-icons";
import { reorderItems } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export type ReorderableItem = {
  id: number;
  order: number;
  content: ReactNode;
};

type Props = {
  items: ReorderableItem[];
  entityType:
    | "skill"
    | "skillCategory"
    | "project"
    | "experience"
    | "education"
    | "certification";
  className?: string;
};

export function ReorderableList({
  items,
  entityType,
  className = "flex flex-col gap-4",
}: Props) {
  const [list, setList] = useState<ReorderableItem[]>(items);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setList(items);
  }, [items]);

  function handleSaveReorder(newList: ReorderableItem[]) {
    setList(newList);
    const orderedIds = newList.map((item) => item.id);

    startTransition(async () => {
      try {
        await reorderItems(entityType, orderedIds);
        toast.success("Order updated");
      } catch (cause) {
        toast.error(
          cause instanceof Error ? cause.message : "Failed to reorder items.",
        );
        setList(items);
      }
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;

    const next = [...list];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    handleSaveReorder(next);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const next = [...list];
    const [draggedItem] = next.splice(draggedIndex, 1);
    next.splice(index, 0, draggedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);
    handleSaveReorder(next);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  if (list.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {list.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isTarget = dragOverIndex === index;

        return (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            className={`group relative flex items-stretch gap-3 rounded-xl border border-border/80 bg-card/60 p-4 backdrop-blur-xs transition-all duration-200 hover:border-border hover:bg-card hover:shadow-xs ${
              isDragging ? "opacity-40 scale-[0.99] border-dashed border-primary" : ""
            } ${isTarget ? "ring-2 ring-primary/50 border-primary" : ""}`}
          >
            {/* Left Grip Handle & Move Controls */}
            <div className="flex shrink-0 flex-col items-center justify-center gap-1 border-r border-border/50 pr-3">
              <div
                title="Drag to reorder"
                className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={DragDropVerticalIcon}
                  className="size-5"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0 || isPending}
                  onClick={() => move(index, -1)}
                  title="Move up"
                  className="size-5 rounded-md"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={ArrowUp01Icon}
                    className="size-3"
                  />
                  <span className="sr-only">Move up</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === list.length - 1 || isPending}
                  onClick={() => move(index, 1)}
                  title="Move down"
                  className="size-5 rounded-md"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={ArrowDown01Icon}
                    className="size-3"
                  />
                  <span className="sr-only">Move down</span>
                </Button>
              </div>

              <span className="mt-auto font-mono text-[10px] text-muted-foreground/70">
                #{index + 1}
              </span>
            </div>

            {/* Main Item Content */}
            <div className="min-w-0 flex-1">{item.content}</div>
          </div>
        );
      })}
    </div>
  );
}
