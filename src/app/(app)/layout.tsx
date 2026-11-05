import { Suspense } from "react";
import { AppNav, AppNavShell } from "@/components/app/nav";
import { QuickLogProvider } from "@/components/app/quick-log-sheet";
import { ToastProvider } from "@/components/ui/toast";
import { api } from "@/lib/api";

/** Authenticated app shell. Auth gating lands here (proxy.ts + session) once jarlore-be exists. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <QuickLogProvider>
      <Suspense fallback={<AppNavShell />}>
        <Nav />
      </Suspense>
      <div className="min-h-dvh pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1.5rem)] md:pb-12 md:pl-sidebar">
        {children}
      </div>
      </QuickLogProvider>
    </ToastProvider>
  );
}

async function Nav() {
  const today = await api.getToday();
  return <AppNav active={today.active} finished={today.recentlyFinished} />;
}
