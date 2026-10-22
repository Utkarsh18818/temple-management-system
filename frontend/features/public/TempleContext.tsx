"use client";

import NextLink from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useState, type ComponentProps } from "react";
import { usePublicTemples } from "./hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { isMandirTemple, primaryTempleIdentity } from "@/config/mandir";

type Temple = Pick<NonNullable<ReturnType<typeof usePublicTemples>["data"]>[number], "id" | "name" | "code" | "address" | "city" | "state">;
type Portal = { templeId: string; temple?: Temple; isPrimary: boolean; isLoading: boolean; home: string; href: (path: string) => string };
const PortalContext = createContext<Portal>({templeId:"",isPrimary:true,isLoading:true,home:"/",href:path=>path});
export const useTemplePortal = () => useContext(PortalContext);

function PortalQuery({ onChange }: { onChange: (query: string) => void }) {
  const params = useSearchParams();
  const query = params.toString();
  useEffect(() => onChange(query), [query, onChange]);
  return null;
}

export function PublicTempleProvider({children}:{children:React.ReactNode}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState<string | null>(null);
  const params = new URLSearchParams(query ?? "");
  const {user} = useAuth();
  const temples = usePublicTemples({limit:100});
  const fromRoute = /^\/temples\/([0-9a-f-]{36})(?:\/|$)/i.exec(pathname)?.[1];
  const redirect = params.get("redirect") ?? "";
  const fromRedirect = /^\/temples\/([0-9a-f-]{36})(?:\/|$)/i.exec(redirect)?.[1];
  const primary = temples.data?.find(isMandirTemple) ?? primaryTempleIdentity;
  const requestedId = fromRoute ?? params.get("temple_id") ?? fromRedirect ?? (pathname.startsWith("/account") ? user?.temple_id : undefined);
  const temple = requestedId
    ? temples.data?.find(t=>t.id===requestedId) ?? (requestedId === primary.id ? primary : undefined)
    : primary;
  const templeId = temple?.id ?? "";
  const isPrimary = Boolean(temple && isMandirTemple(temple));
  const home = isPrimary ? "/" : templeId ? `/temples/${templeId}` : "/temples";
  useEffect(()=> {
    if(temple) document.title = `${temple.name} | Temple portal`;
    if(pathname === "/" && requestedId && temple && !isPrimary) router.replace(home);
  },[temple,pathname,requestedId,isPrimary,home,router]);
  const href = (path:string) => {
    if(!path.startsWith("/") || path.startsWith("//") || !templeId) return path;
    const url = new URL(path,"http://portal.local");
    if(url.pathname === "/") return home + url.hash;
    if(!url.pathname.startsWith("/temples/") && !url.pathname.startsWith("/admin")) url.searchParams.set("temple_id",templeId);
    return url.pathname + url.search + url.hash;
  };
  let content = <PortalContext.Provider value={{templeId,temple,isPrimary,isLoading:!temple,home,href}}>{children}</PortalContext.Provider>;
  if(pathname !== "/" && !fromRoute && query === null) {
    content = <p className="p-10" role="status">Opening temple portal…</p>;
  } else if(pathname === "/" && requestedId && temple && !isPrimary) {
    content = <p className="p-10" role="status">Opening {temple.name}…</p>;
  } else if(!temple && temples.isError) {
    content = <main className="p-10"><h1>Unable to load this temple</h1><button onClick={()=>temples.refetch()}>Try again</button></main>;
  } else if(requestedId && !temples.isPending && !temple) {
    content = <main className="p-10"><h1>Temple portal not found</h1><NextLink href="/temples">Choose a temple</NextLink></main>;
  } else if(!temple) {
    content = <p className="p-10" role="status">Opening temple portal…</p>;
  }
  return <><Suspense fallback={null}><PortalQuery onChange={setQuery}/></Suspense>{content}</>;
}

export function TempleLink({href,...props}:ComponentProps<typeof NextLink>) {
  const portal=useTemplePortal();
  return <NextLink {...props} href={typeof href === "string" ? portal.href(href) : href}/>;
}

export function portalReturnPath(path:string, templeId:string, home:string) {
  if(!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return home;
  const target = /^\/temples\/([0-9a-f-]{36})(?:\/|$)/i.exec(path)?.[1];
  const queryTemple = new URL(path,"http://portal.local").searchParams.get("temple_id");
  if((target && target !== templeId) || (queryTemple && queryTemple !== templeId) || path === "/") return home;
  return path;
}
