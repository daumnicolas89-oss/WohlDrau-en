"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

/**
 * Progressive Disclosure: Die Erklärung ist einen Fingertipp entfernt, steht
 * aber niemandem im Weg, der sie nicht braucht.
 */
export function InfoButton({
  title,
  children,
  ariaLabel = "Was bedeutet das?",
}: {
  title: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-background"
      >
        <HelpCircle size={20} aria-hidden />
      </button>

      {open && (
        <Sheet
          open
          title={title}
          onOpenChange={(next) => {
            if (!next) setOpen(false);
          }}
          footer={
            <div className="pb-1">
              <Button onClick={() => setOpen(false)} className="w-full">
                Verstanden
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-[15px] leading-relaxed text-dark">
            {children}
          </div>
        </Sheet>
      )}
    </>
  );
}
