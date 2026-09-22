"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Modal } from "./Modal";
import type { RecentUpload } from "@/lib/recentUploads";

function RecycleBin({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M5 7h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M7 7l1 13h8l1-13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v5.5M14 11v5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RecentUploads({
  recents,
  onUse,
  onEmpty,
  onRemove,
  onRemoveAll,
}: {
  recents: RecentUpload[];
  onUse: (item: RecentUpload) => void;
  onEmpty: () => void;
  onRemove: (id: string) => void;
  onRemoveAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const empty = recents.length === 0;
  const preview = recents.slice(0, 3);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const node = rootRef.current;
      if (!node || node.contains(event.target as Node)) return;
      closeMenu();
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <>
      <div ref={rootRef} className="relative flex min-w-0 flex-col items-end">
        <button
          type="button"
          aria-expanded={!empty && open}
          aria-disabled={empty}
          onClick={() => {
            if (empty) {
              onEmpty();
              return;
            }
            setOpen((value) => !value);
          }}
          className={cn(
            "cursor-pointer text-sm tracking-wide outline-none hover:text-teal focus-visible:ring-2 focus-visible:ring-teal",
            empty ? "text-muted/40" : open ? "text-teal" : "text-muted",
          )}
        >
          Recent uploads
        </button>
        {open && !empty ? (
          <div className="absolute top-full right-0 z-30 mt-2 w-48 rounded-xl border border-line bg-card px-3 py-2 text-left">
            <ul>
              {preview.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    title={item.name}
                    onClick={() => {
                      closeMenu();
                      onUse(item);
                    }}
                    className="w-full cursor-pointer truncate py-0.5 text-left text-sm tracking-wide text-ink outline-none hover:text-teal focus-visible:ring-2 focus-visible:ring-teal"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
            {recents.length > 3 ? (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setAllOpen(true);
                }}
                className="mt-1 w-full cursor-pointer truncate py-0.5 text-left text-sm tracking-wide text-muted outline-none hover:text-teal focus-visible:ring-2 focus-visible:ring-teal"
              >
                View all
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <Modal
        open={allOpen}
        onClose={() => setAllOpen(false)}
        className="max-w-xl px-10 py-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-display text-3xl italic">Recent uploads</p>
            <p className="mt-2 text-sm text-muted">
              Pick a file to use it as your passage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onRemoveAll();
                setAllOpen(false);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm tracking-wide text-muted outline-none hover:text-coral focus-visible:ring-2 focus-visible:ring-teal"
            >
              <RecycleBin className="h-4 w-4" />
              Delete all
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setAllOpen(false)}
              className="cursor-pointer px-1 text-2xl leading-none text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-teal"
            >
              ×
            </button>
          </div>
        </div>
        <div className="scroll mt-6 max-h-[16.5rem] overflow-y-auto pr-2">
          {recents.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl px-2 hover:bg-foam"
            >
              <button
                type="button"
                title={item.name}
                onClick={() => {
                  setAllOpen(false);
                  onUse(item);
                }}
                className="flex h-11 min-w-0 flex-1 cursor-pointer items-center truncate px-2 text-left text-base tracking-wide text-ink outline-none hover:text-teal focus-visible:ring-2 focus-visible:ring-teal"
              >
                {item.name}
              </button>
              <button
                type="button"
                aria-label={`Delete ${item.name}`}
                onClick={() => {
                  onRemove(item.id);
                  if (recents.length <= 1) setAllOpen(false);
                }}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted outline-none hover:text-coral focus-visible:ring-2 focus-visible:ring-teal"
              >
                <RecycleBin />
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
