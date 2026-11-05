"use client";

import { Check, CircleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cx } from "./cx";

type Toast = { id: number; tone: "success" | "error"; message: string; action?: { label: string; onClick: () => void } };

const ToastContext = createContext<(t: Omit<Toast, "id">) => void>(() => {});

/** Toasts repeat the verb of the action ("Logged", "Bottled"). Errors persist until acted on. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-2), { ...t, id }]);
    if (t.tone === "success") setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-h)+0.75rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:left-sidebar"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cx(
              "pointer-events-auto flex min-h-11 w-full max-w-sm items-center gap-3 rounded-panel px-4 py-2 shadow-float motion-safe:animate-[fade-in_160ms_ease-out]",
              t.tone === "error" ? "bg-danger-wash text-danger" : "bg-ink text-sheet",
            )}
          >
            {t.tone === "error" ? <CircleAlert className="size-4 shrink-0" /> : <Check className="size-4 shrink-0" />}
            <span className="flex-1 text-body">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="h-9 rounded-control px-2 font-semibold underline underline-offset-2"
                onClick={() => {
                  t.action?.onClick();
                  setToasts((all) => all.filter((x) => x.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
