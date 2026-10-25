"use client";

export function PanInput({ value, onChange, disabled = false, id = "pan", help = "Optional. Save your PAN for donation records. Only a masked PAN is shown after saving." }: {
  value: string; onChange: (value: string) => void; disabled?: boolean; id?: string; help?: string;
}) {
  return <div>
    <label htmlFor={id} className="mb-2 block text-sm font-medium text-stone-700">PAN number <span className="font-normal text-stone-400">(optional)</span></label>
    <input id={id} value={value} onChange={event => onChange(event.target.value.toUpperCase())}
      maxLength={10} pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" autoComplete="off" autoCapitalize="characters" spellCheck={false}
      aria-describedby={`${id}-help`} disabled={disabled} placeholder="ABCDE1234F"
      title="Five letters, four digits and one letter"
      className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm uppercase outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200" />
    <p id={`${id}-help`} className="mt-2 text-xs leading-5 text-stone-500">{help} Format validation does not verify your identity.</p>
  </div>;
}
