import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function MarketingFooter() {
  return (
    <footer className="border-t border-carbon-border bg-carbon-mid/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark className="text-3xl text-white" />
          <p className="mt-4 max-w-xs text-sm text-mist">
            Your car is cleaned while you work. Eco-friendly, water-efficient
            methods at office parks and estates.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
            Product
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-mist">
            <li><Link href="/how-it-works" className="transition-colors hover:text-white">How it works</Link></li>
            <li><Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link></li>
            <li><Link href="/partners" className="transition-colors hover:text-white">For estates and office parks</Link></li>
            <li><Link href="/sign-in" className="transition-colors hover:text-white">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
            Legal
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-mist">
            <li><Link href="/terms" className="transition-colors hover:text-white">Terms of service</Link></li>
            <li><Link href="/privacy" className="transition-colors hover:text-white">Privacy policy</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
            Contact
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-mist">
            <li>Johannesburg, South Africa</li>
            <li>
              <a href="mailto:support@glintapp.co.za" className="transition-colors hover:text-white">
                support@glintapp.co.za
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-carbon-border">
        <p className="mx-auto max-w-6xl px-6 py-6 text-xs text-steel">
          Glint. Eco-friendly, water-efficient car care.
        </p>
      </div>
    </footer>
  );
}
