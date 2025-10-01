import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="font-semibold">XTrustScore</div>
      <ThemeToggle />
    </header>
  );
}