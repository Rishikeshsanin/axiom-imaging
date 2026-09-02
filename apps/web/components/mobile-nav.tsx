import Link from "next/link";

const items = [
  ["/dashboard", "Overview"],
  ["/patients", "Patients"],
  ["/studies", "Studies"],
  ["/upload", "Upload"],
  ["/orders", "Orders"],
  ["/operations", "Operations"],
  ["/devices", "Devices"],
  ["/alerts", "Alerts"],
  ["/health", "Health"],
  ["/integrations", "Integrations"],
  ["/help", "Help"],
] as const;

export function MobileNav() {
  return (
    <nav aria-label="Mobile primary" className="overflow-x-auto border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="flex min-w-max gap-1 px-3 py-2">
        {items.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950">
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
