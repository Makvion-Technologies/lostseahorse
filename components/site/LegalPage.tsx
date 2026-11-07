import Link from "next/link";

/** Shared reading layout for the legal pages (scrolls; keeps the shell width). */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-[min(100%,calc(var(--u)*44))] pb-[calc(var(--u)*2)] text-[length:calc(var(--u)*0.98)] leading-relaxed text-muted [--u:clamp(0.8rem,min(0.93vw,1.6dvh),1.42rem)]">
      <header className="border-b border-line pb-[calc(var(--u)*1.4)] text-center">
        <h1 className="font-display text-[length:calc(var(--u)*2.4)] leading-tight font-normal tracking-tight text-ink italic">{title}</h1>
        <p className="mt-[clamp(0.45rem,1.25dvh,0.98rem)] text-[length:calc(var(--u)*0.86)] text-muted">Last updated: {updated}</p>
      </header>
      <div className="mt-[calc(var(--u)*1.6)] text-ink/90">{intro}</div>
      <div className="mt-[calc(var(--u)*0.6)] flex flex-col">{children}</div>
      <p className="mt-[calc(var(--u)*2)] border-t border-line pt-[calc(var(--u)*1.2)] text-center text-[length:calc(var(--u)*0.86)]">
        <Link href="/privacy" className="text-ink/80 hover:text-ink hover:underline">Privacy</Link>
        <span className="mx-2 opacity-50">·</span>
        <Link href="/terms" className="text-ink/80 hover:text-ink hover:underline">Terms</Link>
        <span className="mx-2 opacity-50">·</span>
        <Link href="/" className="text-ink/80 hover:text-ink hover:underline">Back to lost seahorse</Link>
      </p>
    </article>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-[calc(var(--u)*1.6)] flex flex-col gap-[calc(var(--u)*0.6)]">
      <h2 id={id} className="text-[length:calc(var(--u)*1.2)] font-semibold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-[calc(var(--u)*0.35)] pl-[calc(var(--u)*1.2)] marker:text-teal">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export const MAIL = (
  <a href="mailto:contact@makvion.com" className="text-teal hover:underline">contact@makvion.com</a>
);
