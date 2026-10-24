"use client";

import { useEffect, useState } from "react";

const EVENT = "foundry-toast";

// Fire-and-forget notice from anywhere, e.g. for features that aren't live yet.
export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function comingSoon(feature: string) {
  showToast(`${feature} is coming soon. Foundry is free to use during Hacktoberfest!`);
}

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 3500);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" role="status" aria-live="polite">
      {message && (
        <div className="toast-in pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-island px-4 py-3 text-sm text-island-ink shadow-2xl ring-1 ring-white/10">
          <span className="text-accent" aria-hidden="true">✦</span>
          <span>{message}</span>
          <button onClick={() => setMessage(null)} aria-label="Dismiss" className="ml-1 text-island-muted hover:text-island-ink">×</button>
        </div>
      )}
    </div>
  );
}
