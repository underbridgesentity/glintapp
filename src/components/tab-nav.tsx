"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export type TabItem = { href: string; label: string; icon: IconName };

// Active-state tab bar. Exact match for the root tab, prefix match for the
// rest, so /app/track/... doesn't light up Home.
export function TabNav({
  items,
  rootHref,
  className = "",
}: {
  items: TabItem[];
  rootHref: string;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === rootHref ? pathname === href : pathname.startsWith(href);

  return (
    <div className={`flex justify-between ${className}`}>
      {items.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
              active ? "text-white" : "text-mist hover:text-white"
            }`}
          >
            <Icon name={tab.icon} size={20} />
            {tab.label}
            <span
              aria-hidden
              className={`h-1 w-1 rounded-pill ${active ? "bg-lemon" : "bg-transparent"}`}
            />
          </Link>
        );
      })}
    </div>
  );
}
