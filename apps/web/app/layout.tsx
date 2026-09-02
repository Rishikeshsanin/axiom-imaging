import type { Metadata } from "next";
import Link from "next/link";
import { CircleHelp, ShieldCheck } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Axiom Imaging",
    template: "%s · Axiom Imaging",
  },
  description: "Open Radiology Operations & Interoperability Platform — research and educational engineering prototype.",
  authors: [{ name: "Rishikesh Munnaluri", url: "https://github.com/Rishikeshsanin" }],
  creator: "Rishikesh Munnaluri",
  keywords: ["DICOM", "Orthanc", "OHIF", "FastAPI", "Next.js", "radiology", "PACS", "medical imaging", "C++"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <div className="hidden shrink-0 lg:block"><Sidebar /></div>
          <main className="min-w-0 flex-1">
            <div className="flex min-h-9 items-center justify-center gap-2 border-b border-cyan-200 bg-cyan-50 px-4 py-2 text-center text-xs font-medium text-cyan-950">
              <ShieldCheck size={14} className="hidden sm:block" />
              <span>Research and educational prototype. Not intended for clinical diagnosis or clinical decision-making.</span>
              <Link href="/help" className="ml-1 hidden items-center gap-1 font-bold underline decoration-cyan-400 underline-offset-2 hover:text-cyan-700 md:inline-flex">
                <CircleHelp size={13} /> Learn more
              </Link>
            </div>
            <MobileNav />
            <div className="mx-auto max-w-[1500px] p-5 md:p-8 xl:p-9">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
