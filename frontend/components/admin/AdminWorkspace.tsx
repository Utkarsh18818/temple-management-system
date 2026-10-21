"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useTemples } from "@/features/temples/hooks";
import { isMandirTemple } from "@/config/mandir";
import "./admin.css";

const TempleContext = createContext<[string, (id: string | undefined) => void]>(["", () => {}]);
export function useAdminTemple() { return useContext(TempleContext); }
function subscribeTemple(changed: () => void) {
  window.addEventListener("storage", changed);
  window.addEventListener("templeos:temple", changed);
  return () => { window.removeEventListener("storage", changed); window.removeEventListener("templeos:temple", changed); };
}

const links = [
  ["Dashboard", "/admin/dashboard"], ["Temples", "/admin/temples"],
  ["Devotees", "/admin/devotees"], ["Sevas", "/admin/sevas"],
  ["Slots", "/admin/slots"], ["Bookings", "/admin/bookings"],
  ["Donations", "/admin/donations"], ["Payments & receipts", "/admin/payments"],
  ["Events", "/admin/events"], ["Festivals", "/admin/festivals"],
  ["Audit log", "/admin/audit"],
];

export function AdminWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const loginPage = pathname === "/admin/login";
  const staff = Boolean(user && ["SUPER_ADMIN", "TEMPLE_ADMIN", "STAFF"].includes(user.role_name ?? ""));
  const temples = useTemples(!loginPage && staff);
  const selection = useSyncExternalStore(subscribeTemple, () => user ? window.localStorage.getItem(`templeos.admin.temple.${user.id}`) ?? "__unset__" : "__unset__", () => "__unset__");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if(mobileOpen) navRef.current?.querySelector<HTMLAnchorElement>("a")?.focus(); }, [mobileOpen]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if(event.key === "Escape" && mobileOpen) {setMobileOpen(false); menuRef.current?.focus();} };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileOpen]);
  useEffect(() => {
    if (!loginPage && !isLoading && !user) router.replace("/admin/login");
  }, [loginPage, isLoading, user, router]);
  const fallback = temples.data?.find(isMandirTemple) ?? temples.data?.find(t => t.is_active);
  const templeId = user?.temple_id ?? (selection === "" ? "" : temples.data?.some(t => t.id === selection && t.is_active) ? selection : fallback?.id ?? "");
  const setTemple = (id: string | undefined) => {
    if (!user || user.temple_id) return;
    const valid = temples.data?.some(t => t.id === id && t.is_active) ? id! : "";
    window.localStorage.setItem(`templeos.admin.temple.${user.id}`, valid);
    window.dispatchEvent(new Event("templeos:temple"));
  };
  if (loginPage) return children;
  if (isLoading || !user) return <p className="p-10" role="status">Opening temple workspace…</p>;
  if (!staff) return <main className="p-10"><h1>Staff access required</h1><p>Your devotee account cannot access administration.</p><Link href="/account">Go to my account</Link></main>;
  return <TempleContext.Provider value={[templeId, setTemple]}>
    <div className="admin-workspace">
      <a href="#admin-main" className="admin-skip">Skip to workspace</a>
      <aside id="admin-navigation" ref={navRef} className={`admin-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Temple workspace navigation">
        <Link className="admin-brand" href="/admin/dashboard"><span>राधे राधे</span>Radha Krishna Mandir<small>Temple administration</small></Link>
        <nav aria-label="Admin navigation">{links.filter(([name]) => name !== "Temples" || user.role_name === "SUPER_ADMIN").map(([label, href]) =>
          <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setMobileOpen(false)}>{label}</Link>)}</nav>
        <Link href="/">View mandir website ↗</Link>
        <button onClick={() => { logout(); router.replace("/admin/login"); }}>Sign out</button>
      </aside>
      <div className="admin-content">
        <header className="admin-toolbar">
          <button ref={menuRef} className="admin-menu" aria-controls="admin-navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>Menu</button>
          <div><small>ACTIVE TEMPLE</small><strong>{temples.data?.find(t => t.id === templeId)?.name ?? "Choose a temple"}</strong></div>
          <label>Temple<select aria-label="Active temple" value={templeId} onChange={e => setTemple(e.target.value)} disabled={Boolean(user.temple_id) || temples.isLoading}>
            <option value="">Choose a temple</option>{temples.data?.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select></label>
          <span className="admin-person">{user.first_name}</span>
        </header>
        <div id="admin-main" key={`${user.id}:${templeId}`}>
          {temples.isError ? <div role="alert" className="p-8">Unable to load temples. <button onClick={() => temples.refetch()}>Retry</button></div> : temples.isLoading ? <p role="status" className="p-8">Loading temples…</p> : !templeId && pathname !== "/admin/temples" ? <p className="p-8">Choose an active temple to view its records.</p> : children}
        </div>
      </div>
    </div>
  </TempleContext.Provider>;
}
