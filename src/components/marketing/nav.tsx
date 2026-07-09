import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "Partners" },
];

export function MarketingNav() {
  return (
    <header className="glass-strong fixed inset-x-0 top-0 z-50 border-x-0 border-t-0">
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="Glint home">
          <Wordmark className="text-3xl" />
        </Link>
        <div className="flex items-center gap-6 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hidden text-mist transition-colors duration-300 hover:text-white sm:block"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/sign-in" className="btn-primary px-5 py-2 text-sm">
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
