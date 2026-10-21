"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiJson, apiRequest, getAccessToken } from "@/lib/api/client";
import { useAdminTemple } from "./AdminWorkspace";
import { createReceipt, getReceipts } from "@/features/receipts/api";
import type { PaymentResponse } from "@/features/payments/api";

const money = (value: string | number | undefined) => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR"}).format(Number(value ?? 0));
type Totals = { received: string; refunded: string; pending: string; gross: string };
type Summary = { seva: Totals; donations: Totals; total_received: string; total_refunded: string };

export function PaymentIncome() {
  const [templeId] = useAdminTemple();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const summary = useQuery({queryKey:["payments","summary",templeId,from,to], enabled:Boolean(templeId), queryFn:() => {
    const params = new URLSearchParams({temple_id:templeId});
    if(from) params.set("date_from",from);
    if(to) params.set("date_to",to);
    return apiRequest<Summary>(`/api/v1/payments/summary?${params}`);
  }});
  return <section aria-labelledby="income-title" className="mx-4 mt-6 rounded-2xl border border-[#e4d7c9] bg-white p-5 sm:mx-8 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#7b5847]">Temple finances</p><h1 id="income-title" className="mt-1 font-display text-3xl">Payments & receipts</h1><p className="mt-2 text-xs text-slate-600">INR collections across the full selected period. Dates use the temple’s time zone.</p></div>
      <div className="flex flex-wrap items-end gap-3"><label className="grid gap-1 text-xs">From<input type="date" aria-label="Income from date" value={from} max={to || undefined} onChange={e=>setFrom(e.target.value)} className="rounded border p-2"/></label><label className="grid gap-1 text-xs">To<input type="date" aria-label="Income to date" value={to} min={from || undefined} onChange={e=>setTo(e.target.value)} className="rounded border p-2"/></label><button onClick={()=>{setFrom("");setTo("");}} className="rounded border px-3 py-2 text-xs">All time</button><button onClick={()=>summary.refetch()} className="rounded border px-3 py-2 text-xs">Refresh income</button></div>
    </div>
    {summary.isError ? <p role="alert" className="mt-4 text-red-700">{summary.error.message}</p> : summary.isPending ? <p role="status" className="mt-4">Loading collections…</p> : <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{([["Seva income",summary.data.seva],["Donation income",summary.data.donations]] as const).map(([title,values])=><div key={title} className="rounded-xl border border-[#e8ddcf] bg-[#fffaf2] p-5"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-3 text-3xl font-semibold text-[#71333e]">{money(values.received)}</p><p className="mt-2 text-xs text-slate-600">Successful collections retained</p><dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><dt>Gross collected</dt><dd>{money(values.gross)}</dd></div><div className="flex justify-between"><dt>Refunded</dt><dd>{money(values.refunded)}</dd></div><div className="flex justify-between"><dt>Pending · excluded</dt><dd>{money(values.pending)}</dd></div></dl></div>)}
        <div className="rounded-xl bg-[#71333e] p-5 text-white"><h2 className="text-sm font-semibold">Total received</h2><p className="mt-3 text-3xl font-semibold">{money(summary.data.total_received)}</p><p className="mt-3 text-xs leading-6 text-white/85">Seva + donations, after refunds.<br/>Refunded: {money(summary.data.total_refunded)}</p><p className="mt-4 text-xs leading-5 text-white/85">Pending and failed payments do not count as income. Refunds are attributed to the original collection period.</p></div>
      </div>
    </>}
  </section>;
}

export function PaymentReceiptAction({payment}:{payment:PaymentResponse}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function openReceipt(){
    setBusy(true);setError("");
    try{
      const receipts=await getReceipts({templeId:payment.temple_id,donationId:payment.donation_id ?? undefined,bookingId:payment.booking_id ?? undefined});
      const receipt=receipts[0] ?? await createReceipt(payment.temple_id,{donation_id:payment.donation_id,booking_id:payment.booking_id,receipt_type:payment.booking_id ? "SEVA" : "DONATION"});
      if (!receipt.pdf_path) await apiJson(`/api/v1/receipts/${receipt.id}/pdf`, "POST", {});
      const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/receipts/${receipt.id}/pdf`,{headers:{Authorization:`Bearer ${getAccessToken()}`}});
      if(!response.ok) { const body=await response.json(); throw new Error(body.detail ?? "Unable to open receipt"); }
      const url=URL.createObjectURL(await response.blob());
      const a=document.createElement("a");a.href=url;a.download=`${receipt.receipt_number}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){setError(e instanceof Error?e.message:"Unable to open receipt");}finally{setBusy(false);}
  }
  if(payment.status === "REFUNDED") return <span className="text-xs text-violet-700">Receipt void · refunded</span>;
  if(payment.status !== "SUCCESS") return <span className="text-xs text-slate-500">After payment</span>;
  return <div><button disabled={busy} onClick={()=>void openReceipt()} className="whitespace-nowrap rounded border border-[#cbb6a2] px-2 py-1 text-xs font-medium text-[#71333e]">{busy?"Opening…":"Download receipt"}</button>{error && <p role="alert" className="mt-1 max-w-48 text-xs text-red-700">{error}</p>}</div>;
}
