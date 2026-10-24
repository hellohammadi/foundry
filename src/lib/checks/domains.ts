import { promises as dns } from "node:dns";
import type { Availability, DomainCheck } from "../types";

export const DEFAULT_TLDS = ["com", "co", "io", "ai"];

// TLDs whose registry offers a reliable public RDAP endpoint.
const RDAP_ENDPOINTS: Record<string, string> = {
  com: "https://rdap.verisign.com/com/v1/domain/",
  net: "https://rdap.verisign.com/net/v1/domain/",
};

async function checkRdap(domain: string, endpoint: string): Promise<Availability> {
  try {
    const res = await fetch(endpoint + domain, { signal: AbortSignal.timeout(6000) });
    if (res.status === 404) return "available";
    if (res.ok) return "taken";
    return "unknown";
  } catch {
    return "unknown";
  }
}

// For other TLDs: a domain with nameservers is registered. No nameservers usually
// means unregistered, though a parked domain without DNS can slip through.
async function checkDns(domain: string): Promise<Availability> {
  try {
    const ns = await dns.resolveNs(domain);
    return ns.length > 0 ? "taken" : "unknown";
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") return "available";
    return "unknown";
  }
}

export async function checkDomain(domain: string): Promise<DomainCheck> {
  const tld = domain.split(".").pop() ?? "";
  const endpoint = RDAP_ENDPOINTS[tld];
  const status = endpoint ? await checkRdap(domain, endpoint) : await checkDns(domain);
  return { domain, status };
}

export async function checkDomains(slug: string, tlds = DEFAULT_TLDS): Promise<DomainCheck[]> {
  return Promise.all(tlds.map((tld) => checkDomain(`${slug}.${tld}`)));
}
