import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { searchAddresses, type AddressSuggestion } from "@/lib/addressSearch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  placeholder?: string;
  value: AddressSuggestion | null;
  onChange: (value: AddressSuggestion | null) => void;
}

/*
  Input de dirección con sugerencias de Photon. Emite la sugerencia elegida
  (con lat/lon); tipear de nuevo invalida la selección para que nunca se
  envíen coordenadas de una dirección vieja con texto nuevo.
*/
export function AddressAutocomplete({ id, placeholder, value, onChange }: Props) {
  const [text, setText] = useState(value ? value.label : "");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleInput(next: string) {
    setText(next);
    onChange(null); // el texto cambió: la dirección elegida ya no vale
    requestSeq.current += 1;
    const seq = requestSeq.current;
    if (next.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    // Debounce: esperar a que deje de tipear antes de pegarle a Photon.
    setTimeout(async () => {
      if (seq !== requestSeq.current) return;
      const results = await searchAddresses(next);
      if (seq !== requestSeq.current) return;
      setSuggestions(results);
      setLoading(false);
    }, 350);
  }

  function pick(s: AddressSuggestion) {
    onChange(s);
    setText(s.label + (s.sublabel ? `, ${s.sublabel}` : ""));
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        placeholder={placeholder ?? "Calle y número"}
        value={text}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        autoComplete="off"
        className={cn(value && "border-forest-mid")}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-mute">
              <Loader2 className="size-4 animate-spin" /> Buscando…
            </div>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-ink-mute">
              Sin resultados en Buenos Aires.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-mint/40"
                    onClick={() => pick(s)}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-forest-mid" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">{s.label}</span>
                      {s.sublabel && (
                        <span className="block truncate text-xs text-ink-mute">
                          {s.sublabel}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
