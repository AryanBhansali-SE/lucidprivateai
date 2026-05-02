import { useEffect, useState } from "react";

const KEY = "lucid:stealth";

export function useStealth(): [boolean, (v: boolean | ((p: boolean) => boolean)) => void] {
  const [stealth, setStealth] = useState<boolean>(false);

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === "1") setStealth(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, stealth ? "1" : "0");
    } catch {
      // ignore
    }
  }, [stealth]);

  return [stealth, setStealth];
}
