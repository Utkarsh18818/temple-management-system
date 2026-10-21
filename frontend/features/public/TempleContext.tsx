"use client";

import NextLink from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ComponentProps } from "react";
import { usePublicTemples } from "./hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { isMandirTemple } from "@/config/mandir";

type Temple = NonNullable<ReturnType<typeof usePublicTemples>["data"]>[number];
type Portal = { templeId: string; temple?: Temple; isPrimary: boolean; isLoading: boolean; home: string; href: (path: string) => string };
const PortalContext = createContext<Portal>({templeId:"",isPrimary:true,isLoading:true,home:"/",href:path=>path});
export const useTemplePortal = () => useContext(PortalContext);

export function PublicTempleProvider({children}:{children:React.ReactNode}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const {user} = useAuth();
  const temples = usePublicTemples({limit:100});
  const fromRoute = /^\/temples\/([0-9a-f-]{36})(?:\/|$)/i.exec(pathname)?.[1];
  const redirect = params.get("redirect") ?? "";
  const fromRedirect = /^\/temples\/([0-9a-f-]{36})(?:\/|$)/i.exec(redirect)?.[1];
  const primary = temples.data?.find(isMandirTemple);
  const requestedId = fromRoute ?? params.get("temple_id") ?? fromRedirect ?? (pathname.startsWith("/account") ? user?.temple_id : undefined);
  const temple = requestedId ? temples.data?.find(t=>t.id===requestedId) : primary;
  const templeId = temple?.id ?? "";
  const isPrimary = Boolean(temple && isMandirTemple(temple));
  const home = isPrimary ? "/" : templeId ? `/temples/${templeId}` : "/temples";
  useEffect(()=> {
    if(temple) document.title = `${temple.name} | Temple portal`;
    if(pathname === "/" && requestedId && temple && !isPrimary) router.replace(home);
  },[temple,pathname,requestedId,isPrimary,home,router]);
  if(pathname === "/" && requestedId && temple && !isPrimary) return <p className="p-10" role="status">Opening {temple.name}…</p>;
  const href = (path:string) => {
    if(!path.startsWith("/") || path.startsWith("//") || !templeId) return path;
    const url = new URL(path,"http://portal.local");
    if(url.pathname === "/") return home + url.hash;
    if(!url.pathname.startsWith("/temples/") && !url.pathname.startsWith("/admin")) url.searchParams.set("temple_id",templeId);
    return url.pathname + url.search + url.hash;
  };
  if(requestedId && !temples.isPending && !temples.isError && !temple) return <main className="p-10"><h1>Temple portal not found</h1><NextLink href="/temples">Choose a temple</NextLink></main>;
  if(temples.isError) return <main className="p-10"><h1>Unable to load this temple</h1><button onClick={()=>temples.refetch()}>Try again</button></main>;
  if(temples.isPending) return <p className="p-10" role="status">Opening temple portal…</p>;
  return <PortalContext.Provider value={{templeId,temple,isPrimary,isLoading:temples.isPending,home,href}}>{children}</PortalContext.Provider>;
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
