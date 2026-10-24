"use client";

import { useCallback, useEffect, useState } from "react";

// Every run is kept as a numbered case so founders can tweak inputs and compare results.
export type Case<T> = { id: string; n: number; createdAt: number; data: T };

const MAX_CASES = 6;

// Cases are kept in this browser only (a convenience; nothing is stored on a server).
export function useCases<T>(storageKey: string) {
  const [cases, setCases] = useState<Case<T>[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setCases(JSON.parse(raw));
    } catch {
      // storage blocked or corrupt: start fresh
    }
  }, [storageKey]);

  const save = useCallback(
    (next: Case<T>[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // storage full or blocked: cases still work for this visit
      }
    },
    [storageKey],
  );

  const add = useCallback(
    (data: T): Case<T> => {
      const created: Case<T> = { id: crypto.randomUUID(), n: 0, createdAt: Date.now(), data };
      setCases((prev) => {
        created.n = (prev.at(-1)?.n ?? 0) + 1;
        const next = [...prev, created].slice(-MAX_CASES);
        save(next);
        return next;
      });
      return created;
    },
    [save],
  );

  const remove = useCallback(
    (id: string) =>
      setCases((prev) => {
        const next = prev.filter((c) => c.id !== id);
        save(next);
        return next;
      }),
    [save],
  );

  return { cases, add, remove };
}

export type CaseTab = { id: string; n: number; title: string; score?: number };

// Pagination-style tabs: Case 1 · Case 2 · … plus Compare.
export function CaseBar({ tabs, selected, onSelect, onRemove, running }: {
  tabs: CaseTab[];
  selected: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  running?: boolean;
}) {
  if (!tabs.length && !running) return null;
  const nextN = (tabs.at(-1)?.n ?? 0) + 1;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-card">
      <span className="px-2 text-xs font-medium uppercase tracking-wider text-muted">Cases</span>
      <div role="tablist" aria-label="Cases" className="flex flex-1 flex-wrap gap-1.5">
        {tabs.map((t) => {
          const active = selected === t.id;
          return (
            <span key={t.id} className={`group flex items-center rounded-xl transition-colors ${active ? "bg-accent-soft ring-1 ring-accent" : "hover:bg-surface-2"}`}>
              <button role="tab" aria-selected={active} onClick={() => onSelect(t.id)} className="flex items-center gap-2 py-1.5 pl-3 pr-1.5 text-sm">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${active ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}>{t.n}</span>
                <span className="max-w-[10rem] truncate font-medium">{t.title}</span>
                {t.score !== undefined && <span className="text-xs text-muted">{t.score}</span>}
              </button>
              <button
                onClick={() => onRemove(t.id)}
                aria-label={`Remove case ${t.n}`}
                className="mr-1 rounded-full px-1.5 text-muted opacity-60 hover:bg-surface-2 hover:text-bad group-hover:opacity-100"
              >
                ×
              </button>
            </span>
          );
        })}
        {running && (
          <span className="flex items-center gap-2 rounded-xl border border-dashed border-accent px-3 py-1.5 text-sm text-accent">
            <span className="pulse-dot h-2 w-2 rounded-full bg-accent" /> Case {nextN} · running
          </span>
        )}
      </div>
      {tabs.length >= 2 && (
        <button
          role="tab"
          aria-selected={selected === "compare"}
          onClick={() => onSelect("compare")}
          className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${selected === "compare" ? "btn-primary" : "border border-line hover:border-accent"}`}
        >
          ⇄ Compare {tabs.length}
        </button>
      )}
    </div>
  );
}

// Row helper for comparison tables: highlights values that differ from Case 1.
export function CompareTable({ columns, rows }: {
  columns: { id: string; n: number; best?: boolean }[];
  rows: { label: string; values: React.ReactNode[]; compare?: string[] }[];
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-line bg-surface shadow-card">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="sticky left-0 z-10 w-28 bg-surface p-3 sm:w-40 sm:p-4 text-xs font-medium uppercase tracking-wider text-muted">Compare</th>
            {columns.map((c) => (
              <th key={c.id} className="p-4 align-bottom">
                <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-ink">{c.n}</span>
                  <span className="font-semibold">Case {c.n}</span>
                  {c.best && <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-medium text-ok">Best score</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line last:border-0">
              <th scope="row" className="sticky left-0 z-10 bg-surface p-3 align-top sm:p-4 text-xs font-medium uppercase tracking-wider text-muted">{row.label}</th>
              {row.values.map((v, i) => {
                const changed = row.compare && i > 0 && row.compare[i] !== row.compare[0];
                return (
                  <td key={i} className={`p-4 align-top ${changed ? "bg-accent-soft" : ""}`}>
                    {v}
                    {changed && <span className="mt-1 block text-[11px] font-medium text-accent">changed</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
