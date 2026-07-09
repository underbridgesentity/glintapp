"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";

type MenuLink = { href: string; label: string };

// Phone-width nav: the inline links are hidden below sm, so this hamburger
// is the only route to the marketing pages on mobile.
export function MobileMenu({ links }: { links: MenuLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="icon-chip"
      >
        <Icon name={open ? "x" : "list"} size={18} />
      </button>

      {open ? (
        <div className="glass-strong absolute inset-x-0 top-full border-x-0 px-6 py-4">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-carbon-border py-3 text-sm text-white last:border-0"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
