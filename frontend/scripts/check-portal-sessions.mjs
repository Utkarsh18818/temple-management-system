// Exercise both real login modules and the API client without live credentials.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import * as client from "../lib/api/client.ts";

const require = createRequire(import.meta.url);
class Storage {
  items = new Map();
  getItem(key) { return this.items.get(key) ?? null; }
  setItem(key, value) { this.items.set(key, String(value)); }
  removeItem(key) { this.items.delete(key); }
  clear() { this.items.clear(); }
}
globalThis.window = Object.assign(new EventTarget(), {
  localStorage: new Storage(), sessionStorage: new Storage(), atob,
});
const token = role => `header.${Buffer.from(JSON.stringify({role, sub: role})).toString("base64url")}.signature`;
const adminToken = token("SUPER_ADMIN");
const devoteeToken = token("VOLUNTEER");
const requests = [];
globalThis.fetch = async (url, options) => {
  const path = new URL(url).pathname;
  requests.push({path, authorization: options.headers.get("Authorization")});
  const body = path === "/api/v1/auth/login" ? {access_token:adminToken} :
    /\/public\/auth\/(login|register)$/.test(path) ? {access_token:devoteeToken,devotee:{id:"devotee",temple_id:"temple"}} : {};
  return Response.json(body);
};
function loadLoginModule(path) {
  const compiledModule = {exports:{}};
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(compiled,{module:compiledModule,exports:compiledModule.exports,
    require:name => name === "@/lib/api/client" ? client : require(name),window}, {filename:path});
  return compiledModule.exports;
}
const admin = loadLoginModule("../lib/api/auth.ts");
const publicAuth = loadLoginModule("../features/public/auth.ts");

let adminChanges=0, devoteeChanges=0;
const stopAdmin=client.subscribeToSession("admin",()=>adminChanges++);
const stopDevotee=client.subscribeToSession("devotee",()=>devoteeChanges++);

// Admin then devotee: neither the login nor the following /me uses the other JWT.
await admin.login({username:"admin@example.test",password:"fixture"});
await publicAuth.loginPublicDevotee("devotee@example.test","fixture","temple");
assert.equal(client.getAccessToken(),adminToken);
assert.equal(client.getAccessToken("devotee"),devoteeToken);
assert.equal(adminChanges,1);
assert.equal(devoteeChanges,1);
await admin.getCurrentUser();
await publicAuth.getPublicDevoteeMe();
assert.equal(requests.at(-2).authorization,`Bearer ${adminToken}`);
assert.equal(requests.at(-1).authorization,`Bearer ${devoteeToken}`);
assert.ok(requests.filter(r=>r.path.endsWith("/login")).every(r=>r.authorization===null));

for (const path of ["/api/v1/public/bookings","/api/v1/public/donations/order","/api/v1/public/account/receipts"]) {
  await client.apiRequest(path,{method:"POST"});
  assert.equal(requests.at(-1).authorization,`Bearer ${devoteeToken}`);
}
await client.apiRequest("/api/v1/payments/summary");
assert.equal(requests.at(-1).authorization,`Bearer ${adminToken}`);
await client.apiRequest("/api/v1/public/temples");
assert.equal(requests.at(-1).authorization,null);

// Persistence survives a fresh module load, as on a reload or second tab.
const fresh=await import(`../lib/api/client.ts?reload=${Date.now()}`);
assert.equal(fresh.getAccessToken(),adminToken);
assert.equal(fresh.getAccessToken("devotee"),devoteeToken);

// Logout only removes the selected portal and cannot fall back to the other JWT.
publicAuth.logoutPublicDevotee();
assert.equal(client.getAccessToken(),adminToken);
assert.equal(client.getAccessToken("devotee"),null);
await publicAuth.getPublicDevoteeMe();
assert.equal(requests.at(-1).authorization,null);
assert.equal(adminChanges,1);
assert.equal(devoteeChanges,2);

// Devotee then admin, plus registration, preserves the devotee session too.
await publicAuth.registerPublicDevotee({temple_id:"temple"});
await admin.login({username:"admin@example.test",password:"fixture"});
client.clearAccessToken();
assert.equal(client.getAccessToken(),null);
assert.equal(client.getAccessToken("devotee"),devoteeToken);
await admin.getCurrentUser();
assert.equal(requests.at(-1).authorization,null);

// Storage notifications are portal-specific across tabs; clear-all affects both.
adminChanges=0;devoteeChanges=0;
function storageChanged(key,storageArea=window.localStorage) {
  const event=new Event("storage");
  Object.assign(event,{key,storageArea});window.dispatchEvent(event);
}
storageChanged("templeos_admin_access_token");
assert.deepEqual([adminChanges,devoteeChanges],[1,0]);
storageChanged("templeos_devotee_access_token");
assert.deepEqual([adminChanges,devoteeChanges],[1,1]);
storageChanged("unrelated-setting");
storageChanged("templeos_admin_access_token",window.sessionStorage);
assert.deepEqual([adminChanges,devoteeChanges],[1,1]);
storageChanged(null);
assert.deepEqual([adminChanges,devoteeChanges],[2,2]);
stopAdmin();stopDevotee();

// Existing users migrate to only the matching portal without overwriting new logins.
for (const [role,portal] of [["SUPER_ADMIN","admin"],["TEMPLE_ADMIN","admin"],["STAFF","admin"],["VOLUNTEER","devotee"]]) {
  window.localStorage.clear();window.sessionStorage.clear();
  window.localStorage.setItem("templeos_access_token",token(role));
  assert.equal(client.getAccessToken(portal),token(role));
  assert.equal(client.getAccessToken(portal==="admin"?"devotee":"admin"),null);
  assert.equal(window.localStorage.getItem("templeos_access_token"),null);
}
window.localStorage.clear();
window.sessionStorage.setItem("templeos_access_token",adminToken);
assert.equal(client.getAccessToken(),adminToken);
assert.equal(window.sessionStorage.getItem("templeos_access_token"),null);
window.localStorage.setItem("templeos_access_token",devoteeToken);
client.setAccessToken("new-devotee","devotee");
assert.equal(client.getAccessToken("devotee"),"new-devotee");
assert.equal(client.getAccessToken(),adminToken);
window.localStorage.setItem("templeos_access_token","malformed");
assert.equal(client.getAccessToken(),adminToken);
assert.equal(window.localStorage.getItem("templeos_access_token"),null);

// A failed request does not clear either independent session.
globalThis.fetch=async()=>Response.json({detail:"Expired"},{status:401});
await assert.rejects(client.apiRequest("/api/v1/public/auth/me"),{status:401});
assert.equal(client.getAccessToken(),adminToken);
assert.equal(client.getAccessToken("devotee"),"new-devotee");
delete globalThis.window;
assert.equal(client.getAccessToken(),null);
assert.equal(client.getAccessToken("devotee"),null);
console.log("Portal session checks passed: both login orders, reload, requests, isolated logout, cross-tab events, legacy migration and 401 handling.");
