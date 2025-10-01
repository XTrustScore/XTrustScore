"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // voorkomt SSR/CSR mismatch

  const active = theme ?? resolvedTheme;      // 'light' | 'dark'
  const next = active === "dark" ? "light" : "dark";

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setTheme(next!)}
      className="rounded border px-3 py-2 text-sm dark:border-neutral-700"
    >
      {active === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}