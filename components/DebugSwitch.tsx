// components/DebugSwitch.tsx
"use client";
import { useState } from "react";

type Props = {
  onChange?: (value: boolean) => void;
  defaultOn?: boolean;
  className?: string;
};

export default function DebugSwitch({ onChange, defaultOn = false, className = "" }: Props) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      onClick={() => {
        const v = !on;
        setOn(v);
        onChange?.(v);
      }}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
        ${on ? "border-emerald-500" : "border-gray-400 dark:border-gray-600"} ${className}`}
      aria-pressed={on}
      title="Toggle debug details"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-emerald-500" : "bg-gray-400"}`} />
      Debug {on ? "ON" : "OFF"}
    </button>
  );
}
