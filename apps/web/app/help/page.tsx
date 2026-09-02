import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpenText,
  Boxes,
  CheckCircle2,
  CircleHelp,
  Database,
  ExternalLink,
  FileSearch,
  Github,
  HeartPulse,
  ImageIcon,
  Layers3,
  Mail,
  MonitorPlay,
  Network,
  RadioTower,
  Search,
  ServerCog,
  ShieldCheck,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

const steps = [
  { n: "01", title: "Check the overview", text: "Start on the dashboard to see studies, patients, queue depth, device status, alerts and service health.", href: "/dashboard", icon: Activity },
  { n: "02", title: "Upload a DICOM study", text: "Use de-identified .dcm/.dicom files. Axiom reads metadata automatically; you do not retype information already inside DICOM.", href: "/upload", icon: UploadCloud },
  { n: "03", title: "Find the patient & study", text: "The study is mapped into the Patient → Study → Series → Instance hierarchy and becomes searchable in the repositories.", href: "/studies", icon: Search },
  { n: "04", title: "Review the Quality Gate", text: "Inspect operational validation results such as required identifiers, dimensions, pixel data and duplicate detection.", href: "/studies", icon: ShieldCheck },
  { n: "05", title: "Open the real viewer", text: "From Study Details, launch OHIF to render the stored DICOM study through Orthanc/DICOMweb and navigate image slices.", href: "/studies", icon: MonitorPlay },
  { n: "06", title: "Explore operations", text: "Create imaging orders, inspect priority scheduling, monitor devices, and follow alerts and backend audit events.", href: "/operations", icon: Boxes },
];

const architecture = [
  { title: "Axiom Web", text: "Next.js + TypeScript interface for imaging operations, study search, uploads, workflow and monitoring.", icon: HeartPulse },
  { title: "FastAPI", text: "Backend API for patients, studies, ingestion, Quality Gate, orders, scheduler, audit and device telemetry.", icon: ServerCog },
  { title: "PostgreSQL", text: "Stores application metadata and workflow state — not the large DICOM pixel binaries.", icon: Database },
  { title: "Orthanc PACS", text: "Stores the actual DICOM objects and exposes REST/DICOMweb services for retrieval and viewing.", icon: Layers3 },
  { title: "OHIF Viewer", text: "Dedicated medical-image viewing experience connected to Orthanc through DICOMweb.", icon: MonitorPlay },
  { title: "C++ Device Engine", text: "Separate systems component for simulated MRI/CT/X-ray telemetry, concurrency, state and TCP IPC.", icon: RadioTower },
];

const glossary = [
  ["DICOM", "The standard file/data format used for medical imaging. A DICOM object can contain pixel data plus extensive metadata."],
  ["PACS", "Picture Archiving and Communication System — a system used to store and retrieve medical imaging objects. Axiom uses Orthanc as its PACS."],
  ["Study", "An imaging examination, such as one CT Head or MRI Brain exam, identified by a StudyInstanceUID."],
  ["Series", "A logical group of related images within a study, such as an axial acquisition."],
  ["Instance / SOP", "One DICOM object/image in a series. SOPInstanceUID is used by Axiom for duplicate protection."],
  ["DICOMweb", "HTTP-based standards for querying, retrieving and storing DICOM resources. OHIF uses this boundary to access imaging data."],
  ["Quality Gate", "Axiom's operational validation layer. It is not an official DICOM conformance validator or clinical quality certification."],
  ["OHIF", "An open-source web medical imaging viewer used here to render the actual DICOM study instead of substituting JPG previews."],
];

const troubleshooting = [
  ["Is the stack running?", "Run docker compose ps. PostgreSQL and Orthanc should report healthy; API and web should be Up."],
  ["The website cannot reach the API", "Check http://localhost:8000/docs and the System Health page. Do not replace a failed backend with mocked UI data."],
  ["Viewer does not open", "Check Orthanc at http://localhost:8042/ui/ and verify the study exists before testing the OHIF link."],
  ["Duplicate upload error", "This is expected when the same SOP Instance UID was already ingested. Use a different study or reset demo data intentionally."],
  ["Need the known demo study?", "Generate it with python scripts/generate_sample_dicom.py, then upload all 12 CT_*.dcm files together."],
];

export default function HelpPage() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/Rishikeshsanin/axiom-imaging";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const orthancUrl = process.env.NEXT_PUBLIC_ORTHANC_URL || "http://localhost:8042";

  return (
    <>
      <PageHeader
        title="Help & Product Guide"
        description="New to Axiom Imaging? Start here. This guide explains what the platform is, how the imaging workflow works, what each service does, how to use the demo safely, and where to go when something fails."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/upload" className="inline-flex items-center gap-2 rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-900"><UploadCloud size={16}/>Start with an upload</Link>
            <a href={githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"><Github size={16}/>Repository<ExternalLink size={13}/></a>
          </div>
        }
      />

      <section className="help-hero overflow-hidden rounded-2xl border border-cyan-200/80 bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-cyan-800"><CircleHelp size={14}/>Start here</div>
            <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Axiom Imaging connects the full lifecycle of a medical-imaging study.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-[15px]">In plain language: staff can upload a de-identified medical scan, Axiom reads the DICOM metadata, stores the original imaging objects in Orthanc, organizes them under the correct patient/study/series, checks operational quality, makes the study searchable, and opens the actual images in OHIF. The operations layer also models imaging orders, scheduling, devices, alerts and audit events.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              {["Real DICOM ingestion", "Orthanc PACS", "OHIF viewer", "PostgreSQL hierarchy", "Quality Gate", "C++ systems layer"].map((item) => <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">{item}</span>)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-slate-100 shadow-lg shadow-slate-200/40">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">Core hierarchy</div>
            <div className="mt-5 space-y-3">
              {[ [UserRound, "Patient"], [FileSearch, "Study"], [Layers3, "Series"], [ImageIcon, "Instance / image"] ].map(([Icon, label], index) => {
                const IconComponent = Icon as typeof UserRound;
                return <div key={String(label)}><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3"><IconComponent size={17} className="text-cyan-300"/><span className="font-semibold">{String(label)}</span></div>{index < 3 && <div className="ml-6 h-3 border-l border-cyan-400/40"/>}</div>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4"><h2 className="text-xl font-semibold tracking-tight text-slate-950">Quick start: the 6-step demo</h2><p className="mt-1 text-sm text-slate-600">Use this exact path when demonstrating Axiom Imaging to a new user or interviewer.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {steps.map(({ n, title, text, href, icon: Icon }) => <Link key={n} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-800"><Icon size={19}/></div><span className="font-mono text-xs font-bold text-slate-300">{n}</span></div><h3 className="mt-4 font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p><div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-800">Open <ArrowRight size={14} className="transition group-hover:translate-x-0.5"/></div></Link>)}
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-4"><h2 className="text-xl font-semibold tracking-tight text-slate-950">How the platform is built</h2><p className="mt-1 text-sm text-slate-600">Each service has one clear responsibility. Axiom intentionally avoids pretending that everything is one monolithic application.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {architecture.map(({ title, text, icon: Icon }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-700"><Icon size={18}/></div><h3 className="font-semibold text-slate-950">{title}</h3></div><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <a href={`${apiUrl}/docs`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:border-cyan-300"><span className="inline-flex items-center gap-2"><BookOpenText size={16}/>API Docs</span><ExternalLink size={14}/></a>
          <a href={`${orthancUrl}/ui/`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:border-cyan-300"><span className="inline-flex items-center gap-2"><Boxes size={16}/>PACS Explorer</span><ExternalLink size={14}/></a>
          <Link href="/integrations" className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:border-cyan-300"><span className="inline-flex items-center gap-2"><Network size={16}/>All integrations</span><ArrowRight size={14}/></Link>
        </div>
      </section>

      <section className="mt-9 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Beginner glossary</h2>
          <p className="mt-1 text-sm text-slate-600">The minimum vocabulary needed to understand the project.</p>
          <div className="mt-5 divide-y divide-slate-100">
            {glossary.map(([term, definition]) => <div key={term} className="grid gap-2 py-4 sm:grid-cols-[150px_1fr]"><dt className="font-semibold text-slate-900">{term}</dt><dd className="text-sm leading-6 text-slate-600">{definition}</dd></div>)}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
            <div className="flex items-center gap-2 text-emerald-900"><ShieldCheck size={19}/><h2 className="font-semibold">Safety & data rules</h2></div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-950/80">
              {["Use only synthetic or properly de-identified public DICOM data.", "Do not upload identifiable real patient information.", "Axiom does not claim clinical approval, diagnostic accuracy, HIPAA/GDPR certification or medical-device certification.", "Quality Gate results are operational prototype checks — not clinical or official DICOM conformance certification."].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={16}/><span>{item}</span></li>)}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-950">Troubleshooting</h2>
            <div className="mt-4 space-y-4">{troubleshooting.map(([title, text]) => <div key={title}><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>)}</div>
          </section>
        </div>
      </section>

      <section className="mt-9 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white md:p-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Creator & business contact</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Rishikesh Munnaluri</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Axiom Imaging is an independent educational and research software-engineering project. For project discussions, collaboration, internship/recruiting conversations or technical questions, use the contact links below.</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a href="mailto:rishikeshsanin@gmail.com" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"><Mail size={16}/>rishikeshsanin@gmail.com</a>
            <a href="https://github.com/Rishikeshsanin" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]"><Github size={16}/>@Rishikeshsanin<ExternalLink size={13}/></a>
          </div>
        </div>
      </section>
    </>
  );
}
