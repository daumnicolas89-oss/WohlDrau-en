"use client";

import { Drawer } from "vaul";

/**
 * Bottom Sheet auf Basis von Vaul: mit Wischgeste zum Schließen, weil die App
 * einhändig und unterwegs bedient wird.
 */
export function Sheet({
  open,
  title,
  description,
  onOpenChange,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[1000] bg-dark/45" />
        <Drawer.Content
          // Nur ohne Beschreibung die Verknüpfung kappen – sonst nähme das
          // auch Screenreadern die vorhandene Drawer.Description weg.
          {...(description ? {} : { "aria-describedby": undefined })}
          className="fixed inset-x-0 bottom-0 z-[1000] mx-auto flex max-h-[88dvh] max-w-lg flex-col rounded-t-sheet bg-card shadow-float outline-none"
        >
          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-dark/25" />
          <div className="px-5 pt-3 pb-3">
            <Drawer.Title className="font-display text-lg font-semibold text-dark">
              {title}
            </Drawer.Title>
            {description && (
              <Drawer.Description className="mt-1 text-sm text-muted">
                {description}
              </Drawer.Description>
            )}
          </div>
          <div className="hide-scrollbar flex-1 overflow-y-auto overscroll-contain border-t border-line px-5 pt-4 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))]">
            {children}
          </div>
          {footer && (
            <div className="safe-bottom border-t border-line px-5 pt-3">
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
