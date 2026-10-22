// Regression check: catalogue reads avoid preflight without removing private auth.
import assert from "node:assert/strict";
import { apiRequest } from "../lib/api/client.ts";

globalThis.window = {
  localStorage: { getItem: () => "isolated-test-token" },
  sessionStorage: { getItem: () => null },
};
const requests = [];
globalThis.fetch = async (url, options) => {
  requests.push({ url, authorization: options.headers.get("Authorization"), cache: options.cache });
  return new Response("[]", { headers: { "Content-Type": "application/json" } });
};
await apiRequest("/api/v1/public/temples?limit=100");
await apiRequest("/api/v1/public/sevas/test/slots?slot_date=2026-10-22");
await apiRequest("/api/v1/public/bookings");
await apiRequest("/api/v1/public/account/receipts");
assert.equal(requests[0].authorization, null);
assert.equal(requests[1].authorization, null);
assert.equal(requests[2].authorization, "Bearer isolated-test-token");
assert.equal(requests[3].authorization, "Bearer isolated-test-token");
assert.equal(requests[2].cache, "no-store");
assert.equal(requests[3].cache, "no-store");
console.log("Public catalogue and private account authentication checks passed.");
