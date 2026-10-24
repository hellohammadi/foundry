"use client";

import { useEffect, useState } from "react";

// Short founder quotes with well-documented sources, shown while agents work.
const QUOTES: { text: string; author: string; role: string }[] = [
  { text: "Make something people want.", author: "Paul Graham", role: "Co-founder, Y Combinator" },
  { text: "Do things that don't scale.", author: "Paul Graham", role: "Co-founder, Y Combinator" },
  { text: "If you are not embarrassed by the first version of your product, you've launched too late.", author: "Reid Hoffman", role: "Co-founder, LinkedIn" },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates", role: "Co-founder, Microsoft" },
  { text: "Fall in love with the problem, not the solution.", author: "Uri Levine", role: "Co-founder, Waze" },
  { text: "It's not about ideas. It's about making ideas happen.", author: "Scott Belsky", role: "Founder, Behance" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg", role: "Former COO, Meta" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe", role: "Tennis champion" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Proverb", role: "" },
  { text: "Chase the vision, not the money; the money will end up following you.", author: "Tony Hsieh", role: "Former CEO, Zappos" },
];

const INTERVAL_MS = 15_000;

// A quote card that changes every 15 seconds so waiting feels less like waiting.
export function WaitingQuote() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length);
      setCycle((c) => c + 1);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const quote = QUOTES[index];
  return (
    <figure className="relative overflow-hidden rounded-2xl border border-line bg-surface-2 px-5 py-4">
      <div key={cycle} className="quote-in">
        <blockquote className="text-lg font-medium leading-snug">
          <span className="mr-1 text-2xl leading-none text-accent" aria-hidden="true">“</span>
          {quote.text}
        </blockquote>
        <figcaption className="mt-2 text-sm text-muted">
          — {quote.author}
          {quote.role && <span className="opacity-80">, {quote.role}</span>}
        </figcaption>
      </div>
      {/* Thin bar that fills over 15 seconds, hinting when the next quote arrives */}
      <div key={`bar-${cycle}`} className="quote-timer absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent/60" aria-hidden="true" />
    </figure>
  );
}
