import QuoteForm from "./components/QuoteForm";
import { CONFIG } from "@/lib/config";

export default function Home() {
  return (
    <main className="page">
      <div className="brand">
        <span className="brand-mark">
          {CONFIG.brandName} <span className="accent">{CONFIG.brandAccent}</span>
        </span>
      </div>
      <p className="lede">
        Tell us your route &amp; cargo — we&apos;ll reach out with your quote
        within <strong>{CONFIG.responseTime}</strong>.
      </p>

      <QuoteForm />

      <p className="foot">
        Takes about a minute · No obligation · We&apos;ll never share your
        details.
      </p>
    </main>
  );
}
