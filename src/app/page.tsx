import type { Metadata } from "next";
import Link from "next/link";
import { Branch, Lineage } from "@/components/app/lineage";
import { Wordmark } from "@/components/app/nav";
import { ButtonLink } from "@/components/ui/button";
import { Changed } from "@/components/ui/changed";
import { BottleGlyph } from "@/components/ui/glyphs";

export const metadata: Metadata = {
  title: { absolute: "Jarlore — Remember what worked. Brew it again." },
};

const loop = [
  { step: "Log", text: "Taste, burp, pH and notes in a couple of taps, one-handed at the counter." },
  { step: "Rate", text: "Fizz, sweetness and flavour for the batch and every bottle." },
  { step: "Save as recipe", text: "Each change becomes a new version. Old versions never change." },
  { step: "Brew again", text: "Start from your best batch, change one thing, and say why." },
  { step: "Compare", text: "See exactly what was different, next to how it turned out." },
];

/** Public front page. Same tokens, type and lineage signature as the app, so they read as one product. */
export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-wide items-center justify-between px-4 md:px-8">
        <Wordmark />
        <Link href="/today" className="text-body font-semibold text-action hover:underline">
          Open the app
        </Link>
      </header>

      <main className="mx-auto max-w-wide px-4 md:px-8">
        <section className="grid items-center gap-10 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:py-20">
          <div>
            <h1 className="max-w-[16ch] text-display text-balance md:text-display-lg">Remember what worked. Brew it again.</h1>
            <p className="mt-4 max-w-prose text-body-lg text-ink-2">
              Your personal fermentation workspace to track every batch, learn from every experiment, and recreate your best ferments.
              Made for kombucha and water kefir brewers who split F1 into flavoured F2 bottles.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/today" variant="primary">
                Start your first batch
              </ButtonLink>
              <ButtonLink href="#how" variant="secondary">
                How it works
              </ButtonLink>
            </div>
          </div>

          {/* The product's signature, shown as it appears in the app. Example data. */}
          <figure className="rounded-panel border border-rule bg-sheet p-4 md:p-5">
            <Lineage
              root={
                <div>
                  <p className="font-semibold">
                    <span className="code">KB-013</span> F1 jar
                  </p>
                  <p className="text-small text-ink-2">4.2 L, bottled into 4</p>
                </div>
              }
            >
              {[
                { l: "A", f: "Ginger", a: "juice", s: "4 g", score: "5/5", chA: true },
                { l: "B", f: "Ginger", a: "puree", s: "4 g", score: "3/5", chA: true },
                { l: "C", f: "Ginger", a: "chunks", s: "8 g", score: "4/5", chA: true, chS: true },
              ].map((b) => (
                <Branch
                  key={b.l}
                  highlight={b.l === "A"}
                  marker={
                    <span className="flex h-10 w-8 flex-col items-center justify-center rounded-tag bg-bottle-wash text-action">
                      <BottleGlyph className="size-4" />
                      <span className="code text-small">{b.l}</span>
                    </span>
                  }
                  aside={<span className="num text-small">{b.score}</span>}
                >
                  <p className="font-semibold">{b.f}</p>
                  <p className="text-small text-ink-2">
                    <Changed when={b.chA}>{b.a}</Changed>, sugar{" "}
                    <span className="num text-ink">
                      <Changed when={Boolean(b.chS)}>{b.s}</Changed>
                    </span>
                  </p>
                </Branch>
              ))}
            </Lineage>
            <figcaption className="note mt-2 text-body text-ink-2">Juice won. Next batch: all juice, and try 6 g sugar.</figcaption>
          </figure>
        </section>

        <section id="how" aria-labelledby="how-title" className="border-t border-rule py-12 md:py-16">
          <h2 id="how-title" className="text-title md:text-title-lg">One loop, every batch</h2>
          <ol className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-5">
            {loop.map((s, i) => (
              <li key={s.step} className="border-t-2 border-tea pt-3">
                <p className="text-section">
                  <span className="num mr-2 text-tea-ink">{i + 1}</span>
                  {s.step}
                </p>
                <p className="mt-1 text-body text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="border-t border-rule py-8 text-small text-ink-2">
          Jarlore records what you did and measured. It never tells you a ferment is safe. When in doubt, throw it out.
        </footer>
      </main>
    </div>
  );
}
