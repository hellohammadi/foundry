import type { Availability, HandleCheck } from "../types";

type Platform = {
  name: string;
  profileUrl: (handle: string) => string;
  // Omitted for platforms that block automated lookups; those get a manual-check link.
  check?: (handle: string) => Promise<Availability>;
};

const UA = { "User-Agent": "Mozilla/5.0 (compatible; FoundryBot/1.0; +https://github.com/hellohammadi/foundry)" };

async function statusOf(url: string, init?: RequestInit): Promise<number | null> {
  try {
    const res = await fetch(url, { ...init, headers: { ...UA, ...init?.headers }, signal: AbortSignal.timeout(6000) });
    return res.status;
  } catch {
    return null;
  }
}

// Maps "profile missing" / "profile exists" status codes to availability.
function byStatus(status: number | null, missing: number[]): Availability {
  if (status === null) return "unknown";
  if (missing.includes(status)) return "available";
  if (status >= 200 && status < 300) return "taken";
  return "unknown";
}

// Add a platform here to extend the checker — a great first contribution!
export const PLATFORMS: Platform[] = [
  {
    name: "GitHub",
    profileUrl: (h) => `https://github.com/${h}`,
    check: async (h) => byStatus(await statusOf(`https://api.github.com/users/${h}`), [404]),
  },
  {
    name: "YouTube",
    profileUrl: (h) => `https://www.youtube.com/@${h}`,
    check: async (h) => byStatus(await statusOf(`https://www.youtube.com/@${h}`), [404]),
  },
  {
    name: "Bluesky",
    profileUrl: (h) => `https://bsky.app/profile/${h}.bsky.social`,
    check: async (h) =>
      byStatus(
        await statusOf(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${h}.bsky.social`),
        [400],
      ),
  },
  { name: "Instagram", profileUrl: (h) => `https://www.instagram.com/${h}/` },
  { name: "TikTok", profileUrl: (h) => `https://www.tiktok.com/@${h}` },
  { name: "X", profileUrl: (h) => `https://x.com/${h}` },
];

export async function checkHandles(handle: string): Promise<HandleCheck[]> {
  return Promise.all(
    PLATFORMS.map(async (p) => ({
      platform: p.name,
      handle,
      url: p.profileUrl(handle),
      status: p.check ? await p.check(handle) : "unknown",
      method: p.check ? "verified" : "manual",
    })),
  );
}
