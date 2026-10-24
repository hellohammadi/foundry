"use client";
// Browser helpers: anonymous user id and NDJSON stream reading.
import { useEffect, useState } from "react";
import type { StreamEvent } from "./types";

const KEY = "foundry-user-id";

function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "fd-" + [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
}

// A random, anonymous id per browser, used as the user's DNotifier channel for history and reminders.
export function useUserId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let value: string | null = null;
    try {
      value = localStorage.getItem(KEY);
      if (!value) {
        value = newId();
        localStorage.setItem(KEY, value);
      }
    } catch {
      value = newId(); // storage blocked: history works for this visit only
    }
    setId(value);
  }, []);
  return id;
}

export async function postStream(url: string, body: unknown, onEvent: (e: StreamEvent) => void): Promise<void> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line));
  }
}
