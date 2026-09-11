"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "記録", icon: "💪" },
  { href: "/history", label: "履歴", icon: "📅" },
  { href: "/stats", label: "グラフ", icon: "📈" },
  { href: "/exercises", label: "メニュー", icon: "🏷️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50">
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="grid grid-cols-4 gap-1 rounded-3xl bg-white/90 backdrop-blur shadow-[0_8px_30px_rgba(43,33,64,0.15)] border border-white px-1.5 py-2">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex min-w-0 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-bold transition-all",
                  active
                    ? "bg-[var(--color-primary)] text-white scale-105 shadow-md"
                    : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
                )}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
