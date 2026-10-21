"use client";
import { useEffect, useRef } from "react";

export function ConfirmDialog({ title, onClose, children }: {title:string; onClose:()=>void; children:React.ReactNode}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog=ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} aria-labelledby="confirm-dialog-title" onCancel={event=>{event.preventDefault();onClose();}} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/50">
    <h2 id="confirm-dialog-title" className="text-xl font-semibold">{title}</h2>{children}
  </dialog>;
}
