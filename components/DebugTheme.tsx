"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DebugTheme() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [htmlClasses, setHtmlClasses] = useState("");

  useEffect(() => {
    setMounted(true);
    const el = document.documentElement;
    setHtmlClasses(el.className || "");
  });

  if (!mounted) return null;

  return (
    <div className="ml-2 rounded bg-neutral-200 px-2 py-1 text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
      theme:{theme ?? "∅"} | resolved:{resolvedTheme ?? "∅"} | html:{htmlClasses || "∅"}
    </div>
  );
}
