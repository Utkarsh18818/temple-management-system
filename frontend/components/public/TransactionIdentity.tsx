"use client";
import { useState } from "react";
import { usePublicAuth } from "@/features/public/PublicAuthContext";
import { updatePublicPan } from "@/features/public/auth";
import { PanInput } from "./PanInput";

export function TransactionIdentity() {
  const { devotee } = usePublicAuth();
  if (!devotee) return null;
  return <IdentityDetails key={devotee.id} />;
}

function IdentityDetails() {
  const { devotee, refreshUser } = usePublicAuth();
  const [editing, setEditing] = useState(false);
  const [pan, setPan] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (!devotee) return null;

  async function save(remove = false) {
    setError(""); setMessage("");
    if (!remove && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase())) {
      setError("Enter a PAN with five letters, four digits and one letter."); return;
    }
    setBusy(true);
    try {
      await updatePublicPan(remove ? "" : pan);
      await refreshUser();
      setPan(""); setEditing(false); setMessage(remove ? "PAN removed from your profile." : "PAN saved to your profile.");
    } catch { setError("Unable to save PAN. Please try again."); }
    finally { setBusy(false); }
  }

  return <section className="my-5 rounded-2xl border border-stone-200 bg-stone-50 p-5" aria-label="Saved transaction details">
    <h3 className="font-semibold text-stone-900">Saved transaction details</h3>
    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
      <div><dt className="text-stone-500">Name</dt><dd>{[devotee.first_name, devotee.last_name].filter(Boolean).join(" ")}</dd></div>
      <div><dt className="text-stone-500">Email</dt><dd className="break-all">{devotee.email || "Not provided"}</dd></div>
      <div><dt className="text-stone-500">Phone</dt><dd>{devotee.phone || "Not provided"}</dd></div>
      <div><dt className="text-stone-500">PAN</dt><dd>{devotee.pan_masked || "Not provided"}</dd></div>
      <div className="sm:col-span-2"><dt className="text-stone-500">Address</dt><dd>{[devotee.address, devotee.city, devotee.state, devotee.pincode, devotee.country].filter(Boolean).join(", ")}</dd></div>
    </dl>
    <p className="mt-3 text-xs text-stone-500">PAN is stored for donation records. Payment confirmation is handled by Razorpay; these details do not constitute identity verification.</p>
    {!editing ? <button type="button" onClick={() => { setEditing(true); setMessage(""); }} className="mt-3 min-h-11 text-sm font-semibold text-red-900 underline underline-offset-4">{devotee.pan_masked ? "Update PAN" : "Add PAN"}</button> : <div className="mt-4 space-y-3">
      <PanInput id="profile-pan" value={pan} onChange={setPan} disabled={busy} />
      <div className="flex flex-wrap gap-4">
        <button type="button" disabled={busy} onClick={() => void save()} className="rounded-lg bg-stone-900 px-4 py-3 text-sm text-white disabled:opacity-50">{busy ? "Saving…" : "Save PAN"}</button>
        <button type="button" disabled={busy} onClick={() => { setPan(""); setEditing(false); setError(""); }} className="px-3 py-3 text-sm">Cancel</button>
        {devotee.pan_masked && <button type="button" disabled={busy} onClick={() => void save(true)} className="px-3 py-3 text-sm text-red-800">Remove saved PAN</button>}
      </div>
    </div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-3 text-sm text-green-800">{message}</p>}
  </section>;
}
