import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  LayoutGrid,
  PanelLeft,
  ShieldCheck,
  Upload,
} from "lucide-react";
import SEO from "@/components/SEO";
import AppLogo from "@/components/AppLogo";
import { useAuthStore } from "@/store/authStore";

const mockApplications = [
  {
    company: "CourtHub",
    role: "Frontend Intern",
    status: "Interviewing",
    statusClass: "bg-info/10 text-info",
  },
  {
    company: "Echoic",
    role: "Software Intern",
    status: "Accepted",
    statusClass: "bg-success/10 text-success",
  },
  {
    company: "CTU Danao",
    role: "OJT Placement",
    status: "Applied",
    statusClass: "bg-primary/10 text-primary",
  },
];

const workflowSteps = [
  {
    title: "Track applications",
    description: "Keep companies, roles, status, and next steps visible.",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    title: "Log the workday",
    description: "Write daily entries with hours, tags, and quick notes.",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    title: "Attach evidence",
    description: "Keep notes and proof beside the journal entry they verify.",
    icon: <Upload className="w-5 h-5" />,
  },
  {
    title: "Export reports",
    description: "Prepare PDF, CTU Form 6, weekly reports, and summaries.",
    icon: <FileCheck2 className="w-5 h-5" />,
  },
];

const commandStats = [
  { label: "Applications", value: "12" },
  { label: "Journal hours", value: "656h" },
  { label: "Evidence files", value: "18" },
  { label: "Reports ready", value: "4" },
];

const evidenceItems = [
  { title: "Dashboard update", meta: "Linked to Day 75" },
  { title: "QA screenshot", meta: "Linked to Week 12" },
  { title: "Standup notes", meta: "Merged to journal" },
];

const reportActions = [
  { label: "Journal PDF", meta: "75 entries" },
  { label: "CTU Form 6", meta: "Coordinator" },
  { label: "Weekly", meta: "May 6-10" },
  { label: "Summary", meta: "Ready" },
];

const productReasons = [
  {
    title: "A calmer application board",
    description:
      "See every role by stage, then move accepted offers into internship tracking without losing context.",
    icon: <LayoutGrid className="w-5 h-5" />,
  },
  {
    title: "Journal tools that stay quiet",
    description:
      "Improve entries, suggest tags, and draft summaries without turning the interface into a writing gimmick.",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    title: "Proof in the same workspace",
    description:
      "Notes and evidence sit beside your logs, so report preparation does not become a scavenger hunt.",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    title: "Exports built for actual requirements",
    description:
      "Journal PDFs, CTU Form 6, weekly ranges, and internship summaries all live in Reports.",
    icon: <FileText className="w-5 h-5" />,
  },
];

const trustPoints = [
  {
    title: "Fast enough for daily use",
    description:
      "Add roles, update status, and write logs without making a short school requirement feel like admin work.",
    icon: <Clock3 className="w-5 h-5" />,
  },
  {
    title: "Private by default",
    description:
      "Applications, supervisors, hours, notes, and evidence stay in your own account.",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    title: "Ready wherever you work",
    description:
      "Keep the journal current across tabs and devices, then export from Reports when requirements come due.",
    icon: <Globe className="w-5 h-5" />,
  },
];

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-canvas p-3">
      <p className="text-[11px] font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text">{value}</p>
    </div>
  );
}

function ApplicationRows() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-canvas">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">Applications</p>
          <p className="truncate text-xs text-text-muted">Active search pipeline</p>
        </div>
        <Briefcase className="h-4 w-4 shrink-0 text-primary" />
      </div>
      <div className="divide-y divide-border">
        {mockApplications.map((application) => (
          <div
            key={application.company}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">
                {application.company}
              </p>
              <p className="truncate text-xs text-text-muted">
                {application.role}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${application.statusClass}`}
            >
              {application.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceStack() {
  return (
    <div className="rounded-xl border border-border bg-canvas p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">Proof of work</p>
          <p className="text-xs text-text-muted">Images, notes, and evidence</p>
        </div>
        <Upload className="h-4 w-4 text-primary" />
      </div>
      <div className="space-y-3">
        {evidenceItems.map((item, index) => (
          <div
            key={item.title}
            className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-canvas text-primary">
              {index + 1}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">
                {item.title}
              </p>
              <p className="truncate text-xs text-text-muted">{item.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsPanel() {
  return (
    <div className="rounded-xl border border-border bg-canvas p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text">Reports</p>
          <p className="text-xs text-text-muted">Export-ready journal files</p>
        </div>
        <FileText className="h-4 w-4 text-success" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {reportActions.map((report) => (
          <div
            key={report.label}
            className="rounded-lg border border-border bg-surface px-2 py-2 text-center"
          >
            <span className="block text-[11px] font-semibold text-text">
              {report.label}
            </span>
            <span className="block text-[10px] text-text-muted">
              {report.meta}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandCenterScene({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "landing-command-center compact" : "landing-command-center"}>
      <div className="landing-command-topbar">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <div className="hidden rounded-lg border border-border bg-surface px-3 py-1 text-xs text-text-muted sm:block">
          internpal.app/workspace
        </div>
        <div className="w-12" />
      </div>

      <div className="grid min-h-0 lg:grid-cols-[180px_1fr]">
        <aside className="hidden border-r border-border bg-canvas p-4 lg:block">
          <div className="mb-6 flex items-center gap-2">
            <AppLogo size={32} />
            <div>
              <p className="text-sm font-bold text-text">InternPal</p>
              <p className="text-[10px] uppercase text-text-muted">
                Student workspace
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="mockup-nav-row text-text-muted">
              <PanelLeft className="h-4 w-4" />
              Dashboard
            </div>
            <div className="mockup-nav-row text-text-muted">
              <Briefcase className="h-4 w-4" />
              Applications
            </div>
            <div className="mockup-nav-row bg-primary text-white">
              <BookOpen className="h-4 w-4" />
              Journal
            </div>
            <div className="mockup-nav-row text-text-muted">
              <FolderOpen className="h-4 w-4" />
              Reports
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-canvas px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-primary">
                Command center
              </p>
              <h2 className="truncate text-base font-semibold text-text sm:text-lg">
                CourtHub internship, Day 75
              </h2>
            </div>
            <span className="hidden rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success sm:inline-flex">
              Report-ready
            </span>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {commandStats.map((stat) => (
                <MiniStat key={stat.label} {...stat} />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <ApplicationRows />
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-canvas p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">
                        Journal entry
                      </p>
                      <p className="text-xs text-text-muted">
                        12.5h logged with evidence
                      </p>
                    </div>
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-surface p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-text">Day 75</p>
                      <span className="text-right text-xs text-text-muted">
                        May 10 - 12.5h
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-text-muted">
                      Fixed bugs on CourtHub and prepared report notes.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Development", "Teamwork"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-border bg-canvas px-2 py-1 text-[10px] text-text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {!compact && <EvidenceStack />}
              </div>
            </div>

            {!compact && <ReportsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroWorkspaceScene() {
  return (
    <div className="landing-hero-scene" aria-hidden>
      <div className="landing-scene-frame">
        <CommandCenterScene compact />
      </div>
      <div className="landing-scene-support landing-scene-support-a">
        <p className="text-xs font-semibold text-text-muted">Hours left</p>
        <p className="mt-1 text-2xl font-bold text-text">46h</p>
        <div className="mt-3 h-2 rounded-full bg-surface">
          <div className="h-full w-[82%] rounded-full bg-primary" />
        </div>
      </div>
      <div className="landing-scene-support landing-scene-support-b">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <div>
          <p className="text-sm font-semibold text-text">CTU Form 6</p>
          <p className="text-xs text-text-muted">Ready to export</p>
        </div>
      </div>
    </div>
  );
}

function WorkflowSection() {
  return (
    <section
      id="workspace-feature"
      className="scroll-mt-20 border-b border-border bg-canvas px-4 py-16 sm:px-6 md:py-20"
    >
      <div className="mx-auto grid max-w-7xl gap-12 xl:grid-cols-[0.78fr_1.22fr] xl:items-start">
        <div className="landing-reveal min-w-0">
          <h2 className="text-3xl font-semibold leading-tight text-text md:text-5xl">
            From first application to final report, the work stays connected.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Students do not need separate places for applications, logs,
            evidence, weekly summaries, and school forms. InternPal keeps those
            pieces in one workspace.
          </p>
        </div>

        <div className="landing-reveal grid gap-4 md:grid-cols-2">
          {workflowSteps.map((step, index) => (
            <div
              key={step.title}
              className="landing-step-row group border-t border-border pt-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs font-bold text-text-subtle">
                  0{index + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-text">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSceneSection() {
  return (
    <section className="border-b border-border bg-surface px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-6 md:grid-cols-[1fr_0.62fr] md:items-end">
          <div className="landing-reveal">
            <h2 className="text-3xl font-semibold leading-tight text-text md:text-5xl">
              One command center for search, logs, proof, and reports.
            </h2>
          </div>
          <p className="landing-reveal text-base leading-relaxed text-text-muted">
            The product scene is not decorative. It mirrors the actual rhythm of
            internship work: accept the role, document the day, attach proof,
            then export the required forms.
          </p>
        </div>
        <CommandCenterScene />
      </div>
    </section>
  );
}

function ReportSupportSection() {
  return (
    <section
      id="ctu-journal-format"
      className="scroll-mt-20 border-b border-border bg-canvas px-4 py-16 sm:px-6 md:py-20"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div className="landing-reveal">
          <h2 className="text-3xl font-semibold leading-tight text-text md:text-5xl">
            CTU journal requirements stay visible before export day.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            InternPal prepares the CTU journal export around OJT Form 6
            requirements, including daily activities, hours, coordinator name,
            supervisor name, and date ranges.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-text">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Report requirements visible before export
          </div>
        </div>

        <div className="landing-reveal rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="rounded-xl border border-border bg-canvas p-5">
            <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase text-primary">
                    CTU
                  </p>
                  <h3 className="text-xl font-semibold text-text">
                    Cebu Technological University
                  </h3>
                  <p className="text-sm text-text-muted">
                    OJT Form 6 journal export
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                <FileCheck2 className="h-4 w-4" />
                Supported
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Daily activities and hours",
                "Coordinator and supervisor names",
                "Date-range report export",
              ].map((detail) => (
                <div
                  key={detail}
                  className="rounded-xl border border-border bg-surface p-4"
                >
                  <Building2 className="mb-3 h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold leading-relaxed text-text">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductReasonsSection() {
  return (
    <section className="bg-canvas px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="landing-reveal mb-12 max-w-3xl">
          <h2 className="text-3xl font-semibold leading-tight text-text md:text-5xl">
            The repeated work is closer to the surface.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-text-muted sm:text-lg">
            InternPal is shaped around searching, logging, proving, and
            exporting - the things students actually repeat.
          </p>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {productReasons.map((reason) => (
            <div
              key={reason.title}
              className="landing-reveal grid gap-5 py-6 md:grid-cols-[220px_1fr] md:items-start"
            >
              <div className="flex items-center gap-3 text-primary">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {reason.icon}
                </div>
                <span className="text-sm font-semibold text-text">
                  {reason.title}
                </span>
              </div>
              <p className="max-w-3xl text-base leading-relaxed text-text-muted">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="border-y border-border bg-surface px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-start">
        <div className="landing-reveal">
          <h2 className="text-3xl font-semibold leading-tight text-text md:text-4xl">
            Built to feel useful every day, not impressive once.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {trustPoints.map((point) => (
            <div key={point.title} className="landing-reveal">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-canvas text-primary shadow-sm">
                {point.icon}
              </div>
              <h3 className="text-lg font-semibold text-text">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const primaryRoute = user ? "/dashboard" : "/register";
  const primaryLabel = user ? "Go to Dashboard" : "Start tracking now";

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas text-text">
      <SEO title="Welcome" />

      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border/60 bg-canvas/95 px-4 shadow-sm backdrop-blur sm:px-6 md:px-12">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-left"
        >
          <AppLogo size={34} />
          <span className="text-lg font-bold text-text">InternPal</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-6">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-sm font-semibold text-text-muted transition-colors hover:text-text"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="rounded-lg bg-text px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:opacity-90 sm:px-5"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero-stage relative min-h-[92svh] overflow-hidden border-b border-border bg-surface px-4 pt-28 sm:px-6 md:pt-32">
        <HeroWorkspaceScene />
        <div className="relative z-10 mx-auto flex min-h-[calc(92svh-8rem)] max-w-7xl flex-col justify-center pb-32">
          <div className="landing-reveal landing-delay-1 max-w-2xl">
            <h1 className="text-5xl font-semibold leading-none tracking-normal text-text sm:text-6xl md:text-7xl">
              InternPal
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted md:text-xl">
              A clean internship workspace for applications, journal logs,
              proof of work, and school-ready reports.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => navigate(primaryRoute)}
                className="group flex items-center justify-center gap-3 rounded-lg bg-primary px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                {primaryLabel}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("workspace-feature")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="hidden rounded-lg border border-border bg-canvas px-7 py-4 text-base font-semibold text-text transition-colors hover:border-primary/30 sm:flex"
              >
                See the workflow
              </button>
            </div>
          </div>
        </div>

        <div className="landing-next-preview">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 py-4 sm:grid-cols-4 sm:px-6">
            {workflowSteps.map((step) => (
              <div key={step.title} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <span className="text-sm font-semibold text-text">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WorkflowSection />
      <ProductSceneSection />
      <ReportSupportSection />
      <ProductReasonsSection />
      <TrustSection />

      <section className="bg-text px-4 py-20 text-canvas sm:px-6 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
              Keep today's work ready for tomorrow's report.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-canvas/70 md:text-lg">
              Create your workspace, add your first role, and let the journal
              grow into the report you will eventually need.
            </p>
          </div>
          <button
            onClick={() => navigate(primaryRoute)}
            className="rounded-lg bg-primary px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {user ? "Go to Dashboard" : "Create workspace"}
          </button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 border-t border-border/50 px-4 py-12 sm:px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <AppLogo size={32} />
          <span className="text-sm font-bold">
            Copyright 2026 InternPal. All rights reserved.
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-text-muted">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Evidence</span>
        </div>
      </footer>
    </div>
  );
}
