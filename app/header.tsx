import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/70 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
      <div className="font-semibold">XTrustScore</div>
      <ThemeToggle />
    </header>
  );
}
