"use client";

import { BookOpen, CircleUserRound, Layers, Plus, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { BatchSummary } from "@/lib/api/types";
import { cx } from "@/components/ui/cx";
import { CreateSheet } from "./create-sheet";

const items = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/batches", label: "Batches", icon: Layers },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/me", label: "Me", icon: CircleUserRound },
] as const;

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`) || (href === "/batches" && pathname.startsWith("/compare"));

/**
 * Primary navigation. One component, two layouts:
 * <768px a bottom bar with the create button in the thumb zone; ≥768px a left sidebar.
 */
export function AppNav(props: { active: BatchSummary[]; finished: BatchSummary[] }) {
  return <NavView {...props} pathname={usePathname()} />;
}

/** Static nav for the loading shell: no URL data, so it can be prerendered. */
export function AppNavShell() {
  return <NavView active={[]} finished={[]} pathname="" />;
}

function NavView({ active, finished, pathname }: { active: BatchSummary[]; finished: BatchSummary[]; pathname: string }) {
  const [creating, setCreating] = useState(false);

  return (
    <>
      {/* Sidebar (tablet / desktop) */}
      <nav
        aria-label="Main"
        className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col border-r border-rule bg-paper px-3 py-5 md:flex"
      >
        <Link href="/today" className="mb-6 flex h-10 items-center gap-2 px-3 text-section text-ink">
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mb-4 flex h-11 items-center gap-2 rounded-control bg-action px-3 font-semibold text-on-action hover:bg-action-hover"
        >
          <Plus className="size-5" aria-hidden />
          New
        </button>
        <ul className="flex flex-col gap-0.5">
          {items.map(({ href, label, icon: Icon }) => {
            const current = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={cx(
                    "flex h-11 items-center gap-3 rounded-control px-3 text-body transition-colors",
                    current ? "bg-well font-semibold text-ink" : "text-ink-2 hover:bg-well hover:text-ink",
                  )}
                >
                  <Icon className={cx("size-5", current ? "text-action" : "text-ink-3")} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom bar (mobile) */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      >
        <ul className="mx-auto grid h-bottom-nav max-w-md grid-cols-5 items-center">
          {items.slice(0, 2).map((item) => (
            <BottomItem key={item.href} {...item} current={isActive(pathname, item.href)} />
          ))}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => setCreating(true)}
              aria-label="New: log, brew again or start a batch"
              className="flex size-12 items-center justify-center rounded-full bg-action text-on-action shadow-float active:bg-action-hover"
            >
              <Plus className="size-6" aria-hidden />
            </button>
          </li>
          {items.slice(2).map((item) => (
            <BottomItem key={item.href} {...item} current={isActive(pathname, item.href)} />
          ))}
        </ul>
      </nav>

      <CreateSheet open={creating} onClose={() => setCreating(false)} active={active} finished={finished} />
    </>
  );
}

function BottomItem({
  href,
  label,
  icon: Icon,
  current,
}: {
  href: string;
  label: string;
  icon: (typeof items)[number]["icon"];
  current: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={cx(
          "flex h-bottom-nav flex-col items-center justify-center gap-1 text-small",
          current ? "font-semibold text-ink" : "text-ink-2",
        )}
      >
        <Icon className={cx("size-5", current ? "text-action" : "text-ink-3")} aria-hidden />
        {label}
      </Link>
    </li>
  );
}

export function Wordmark() {
  return (
    // Logo: "jar" printed, "lore" written (casual axis), the product idea in one word.
    <span className="inline-flex items-baseline text-title leading-none">
      jar<span className="note">lore</span>
    </span>
  );
}
