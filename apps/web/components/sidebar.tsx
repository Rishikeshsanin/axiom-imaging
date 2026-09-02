import Link from "next/link";
import {
  Activity,
  BellRing,
  Boxes,
  CircleHelp,
  Database,
  FileClock,
  Github,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  Mail,
  Network,
  RadioTower,
  UploadCloud,
  Users,
} from "lucide-react";

const primary = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/studies", label: "Studies", icon: Database },
  { href: "/upload", label: "Upload Study", icon: UploadCloud },
  { href: "/orders", label: "Imaging Orders", icon: ListChecks },
  { href: "/operations", label: "Operations", icon: Boxes },
  { href: "/devices", label: "Devices", icon: RadioTower },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/audit", label: "Audit", icon: FileClock },
];

const system = [
  { href: "/health", label: "System Health", icon: Activity },
  { href: "/integrations", label: "Integrations", icon: Network },
];

export function Sidebar() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/Rishikeshsanin/axiom-imaging";

  return (
    <aside className="sidebar-shell flex min-h-screen w-72 flex-col border-r border-slate-800/80 bg-[#102a35] px-4 py-5 text-slate-100">
      <Link
        href="/"
        aria-label="Axiom Imaging home"
        className="group mb-7 flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.06]"
      >
        <div className="grid size-10 place-items-center rounded-xl bg-cyan-100 text-cyan-900 shadow-sm transition group-hover:scale-[1.03]">
          <HeartPulse size={22} />
        </div>
        <div>
          <div className="font-semibold tracking-tight">Axiom Imaging</div>
          <div className="text-xs text-slate-400">Operations platform</div>
        </div>
      </Link>

      <nav aria-label="Primary" className="space-y-1">
        {primary.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white">
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 border-t border-slate-700/80 pt-5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">System</p>
        <nav aria-label="System" className="mt-2 space-y-1">
          {system.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
          <a href={githubUrl} target="_blank" rel="noreferrer" className="sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Github size={18} aria-hidden="true" />
            <span>GitHub Repository</span>
          </a>
        </nav>
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <Link
          href="/help"
          className="group flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200/35 hover:bg-cyan-200/[0.12]"
        >
          <div className="grid size-9 place-items-center rounded-lg bg-cyan-100/10 text-cyan-100">
            <CircleHelp size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div>HELP</div>
            <div className="mt-0.5 text-[11px] font-normal text-slate-400">Start here · guide · glossary</div>
          </div>
        </Link>

        <div className="rounded-xl border border-slate-700/90 bg-black/10 p-3 text-xs leading-5 text-slate-400">
          <strong className="block text-slate-200">Built by Rishikesh Munnaluri</strong>
          <a className="mt-1 inline-flex items-center gap-1.5 text-cyan-200 hover:text-white" href="mailto:rishikeshsanin@gmail.com">
            <Mail size={12} /> Business contact
          </a>
          <div className="mt-2 border-t border-slate-700/70 pt-2">
            Research & educational prototype.<br />Not for clinical diagnosis.
          </div>
        </div>
      </div>
    </aside>
  );
}
