import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  Globe,
  GraduationCap,
  LayoutGrid,
  PanelLeft,
  ShieldCheck,
  Upload,
} from "lucide-react";
import SEO from "@/components/SEO";
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

const mockEntries = [
  {
    day: "Day 75",
    date: "May 10",
    hours: "12.5h",
    note: "Fixed bugs on CourtHub and prepared report notes.",
    tags: ["Development", "Teamwork"],
  },
];

const mockStats = [
  { label: "Applications", value: "12" },
  { label: "Journal hours", value: "656h" },
  { label: "Reports ready", value: "4" },
];

const reportActions = [
  { label: "Journal PDF", meta: "75 entries" },
  { label: "CTU Form 6", meta: "Coordinator" },
  { label: "Weekly", meta: "May 6-10" },
  { label: "Summary", meta: "Ready" },
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
    title: "Attach support",
    description: "Keep notes and evidence beside the journal they support.",
    icon: <Upload className="w-5 h-5" />,
  },
  {
    title: "Export reports",
    description: "Prepare PDF, CTU Form 6, weekly reports, and summaries.",
    icon: <FileCheck2 className="w-5 h-5" />,
  },
];

const ctuJournalFormats = [
  {
    school: "Cebu Technological University",
    shortName: "CTU",
    format: "CTU OJT Form 6 journal export",
    details: [
      "Daily activities and hours",
      "Coordinator and supervisor printed names",
      "Date-range report export",
    ],
  },
];

const features = [
  {
    title: "A calmer application board",
    description:
      "See every role by stage, then move accepted offers into internship tracking without losing context.",
    icon: <LayoutGrid className="w-6 h-6" />,
    color: "bg-primary/10",
    textColor: "text-primary",
    span: "lg:col-span-2",
  },
  {
    title: "Journal tools that stay quiet",
    description:
      "Improve entries, suggest tags, and draft summaries without turning the interface into a writing gimmick.",
    icon: <BookOpen className="w-6 h-6" />,
    color: "bg-info/10",
    textColor: "text-info",
    span: "lg:col-span-1",
  },
  {
    title: "Proof in the same workspace",
    description:
      "Notes and evidence sit beside your logs, so report preparation does not become a scavenger hunt.",
    icon: <ClipboardList className="w-6 h-6" />,
    color: "bg-success/10",
    textColor: "text-success",
    span: "lg:col-span-1",
  },
  {
    title: "Exports built for actual requirements",
    description:
      "Journal PDFs, CTU Form 6, weekly ranges, and internship summaries all live in Reports.",
    icon: <FileText className="w-6 h-6" />,
    color: "bg-warning/10",
    textColor: "text-warning",
    span: "lg:col-span-2",
  },
];

type ProductMockupProps = {
  className?: string;
};

function HeroOutcomeCard() {
  return (
    <div className="landing-reveal landing-delay-2 rounded-2xl border border-border bg-canvas p-4 sm:p-5 shadow-[0_22px_60px_rgba(23,32,51,0.12)]">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase text-primary">
            Today's workspace
          </p>
          <h2 className="text-xl font-semibold">Day 75 is report-ready</h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <FileCheck2 className="w-5 h-5" />
        </div>
      </div>

      <div className="py-4 space-y-3">
        <div className="hidden sm:block rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">CourtHub journal entry</p>
              <p className="text-sm text-text-muted">
                12.5 hours logged with Development and Teamwork tags.
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-success/10 px-2 py-1 text-xs font-semibold text-success">
              Saved
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-canvas p-4">
            <p className="text-2xl font-bold">656h</p>
            <p className="text-sm text-text-muted">hours documented</p>
          </div>
          <div className="rounded-xl border border-border bg-canvas p-4">
            <p className="text-2xl font-bold">4</p>
            <p className="text-sm text-text-muted">exports ready</p>
          </div>
        </div>
      </div>

      <div className="hidden sm:block rounded-xl border border-border bg-text p-4 text-white">
        <p className="text-sm font-semibold">Next best action</p>
        <p className="text-sm text-white/65">
          Review CTU Form 6 names before exporting from Reports.
        </p>
      </div>
    </div>
  );
}

function ProductMockup({ className = "" }: ProductMockupProps) {
  return (
    <div className={`landing-reveal landing-delay-2 min-w-0 ${className}`}>
      <div className="product-mockup max-w-full rounded-2xl border border-border bg-canvas shadow-[0_24px_70px_rgba(23,32,51,0.14)] overflow-hidden">
        <div className="h-10 border-b border-border bg-canvas flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1 text-xs text-text-muted">
            internpal.app/journal
          </div>
          <div className="w-10 sm:w-16" />
        </div>

        <div className="grid xl:grid-cols-[180px_1fr] bg-surface">
          <aside className="hidden xl:flex flex-col border-r border-border bg-canvas p-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary text-white grid place-items-center text-xs font-bold">
                IP
              </div>
              <div>
                <p className="text-sm font-bold">InternPal</p>
                <p className="text-[10px] uppercase text-text-muted">
                  Student Workspace
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="mockup-nav-row text-text-muted">
                <PanelLeft className="w-4 h-4" />
                Dashboard
              </div>
              <div className="mockup-nav-row text-text-muted">
                <Briefcase className="w-4 h-4" />
                Applications
              </div>
              <div className="mockup-nav-row bg-primary text-white">
                <BookOpen className="w-4 h-4" />
                Journal
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="border-b border-border bg-canvas px-4 sm:px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-primary">
                  Journal
                </p>
                <h2 className="text-base sm:text-lg font-semibold">
                  Good morning, kole
                </h2>
              </div>
              <div className="hidden sm:block text-xs text-text-muted">
                May 11, 2026
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 min-[440px]:grid-cols-3 gap-3">
                {mockStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="mockup-card rounded-xl border border-border bg-canvas p-3"
                  >
                    <p className="text-[11px] text-text-muted">{stat.label}</p>
                    <p className="text-lg font-bold text-text">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid 2xl:grid-cols-[1.05fr_0.95fr] gap-4">
                <div className="mockup-card rounded-xl border border-border bg-canvas overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Applications</p>
                      <p className="text-xs text-text-muted truncate">
                        Active search pipeline
                      </p>
                    </div>
                    <button className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">
                      Add role
                    </button>
                  </div>
                  <div className="divide-y divide-border">
                    {mockApplications.map((application) => (
                      <div
                        key={application.company}
                        className="px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {application.company}
                          </p>
                          <p className="text-xs text-text-muted truncate">
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

                <div className="space-y-4">
                  <div className="mockup-card rounded-xl border border-border bg-canvas p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold">Journal Entries</p>
                        <p className="text-xs text-text-muted">
                          Daily work and hours
                        </p>
                      </div>
                      <CalendarDays className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-3">
                      {mockEntries.map((entry) => (
                        <div
                          key={entry.day}
                          className="rounded-lg border border-border-subtle bg-surface p-3"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="text-sm font-bold">{entry.day}</p>
                            <span className="text-xs text-text-muted text-right">
                              {entry.date} - {entry.hours}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed">
                            {entry.note}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-canvas px-2 py-1 text-[10px] text-text-muted border border-border"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mockup-card rounded-xl border border-border bg-canvas p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold">Reports</p>
                        <p className="text-xs text-text-muted">
                          Export-ready journal files
                        </p>
                      </div>
                      <FileText className="w-4 h-4 text-success" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {reportActions.map((report) => (
                        <span
                          key={report.label}
                          className="rounded-lg border border-border bg-surface px-2 py-2 text-center"
                        >
                          <span className="block text-[11px] font-semibold">
                            {report.label}
                          </span>
                          <span className="block text-[10px] text-text-muted">
                            {report.meta}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowSection() {
  return (
    <section
      id="workspace-feature"
      className="scroll-mt-20 px-4 sm:px-6 py-16 md:py-20 bg-canvas border-b border-border"
    >
      <div className="max-w-7xl mx-auto grid xl:grid-cols-[0.8fr_1.2fr] gap-10 xl:gap-12 items-start">
        <div className="landing-reveal min-w-0">
          <p className="text-sm font-bold uppercase text-primary mb-3">
            Built around the internship cycle
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
            From first application to final report, InternPal keeps the thread.
          </h2>
          <p className="text-text-muted text-base sm:text-lg leading-relaxed">
            Students do not need separate places for applications, logs,
            evidence, weekly summaries, and school forms. InternPal keeps them
            connected in one workspace.
          </p>

          <div className="mt-8 space-y-3">
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-surface p-4 hover:-translate-y-0.5 hover:border-primary/25 transition-all duration-200"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-text-subtle">
                        0{index + 1}
                      </span>
                      <h3 className="font-semibold text-text">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ProductMockup className="xl:mt-2" />
      </div>
    </section>
  );
}

function CTUJournalFormatSection() {
  return (
    <section
      id="ctu-journal-format"
      className="scroll-mt-20 py-16 px-4 sm:px-6 bg-surface/60 border-b border-border"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.75fr_1.25fr] gap-8 lg:gap-12 items-start">
        <div className="landing-reveal">
          <p className="text-sm font-bold uppercase text-primary mb-3">
            Supported CTU journal format
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Built for Cebu Technological University OJT journals.
          </h2>
          <p className="text-text-muted text-base sm:text-lg leading-relaxed">
            InternPal prepares the CTU journal export around OJT Form 6
            requirements, including daily activities, hours, coordinator name,
            supervisor name, and date ranges.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {ctuJournalFormats.map((format) => (
            <div
              key={format.shortName}
              className="landing-reveal rounded-2xl border border-border bg-canvas p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between border-b border-border pb-5">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase text-primary">
                      {format.shortName}
                    </p>
                    <h3 className="text-xl font-semibold">{format.school}</h3>
                    <p className="text-sm text-text-muted">{format.format}</p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                  <FileCheck2 className="w-4 h-4" />
                  Supported
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
                {format.details.map((detail) => (
                  <div
                    key={detail}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold leading-relaxed">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
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

  return (
    <div className="min-h-screen bg-canvas text-text overflow-x-hidden">
      <SEO title="Welcome" />

      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50 h-16 flex items-center px-4 sm:px-6 md:px-12 justify-between landing-reveal">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">IP</span>
          </div>
          <span className="font-bold text-lg">InternPal</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-sm font-semibold text-text-muted hover:text-text transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 sm:px-5 py-2 rounded-lg bg-text text-white text-sm font-semibold hover:opacity-90 transition-colors"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero-surface relative pt-20 pb-8 sm:pt-24 sm:pb-10 md:pt-28 md:pb-14 px-4 sm:px-6 border-b border-border bg-surface overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10 xl:gap-14 items-center relative z-10">
          <div className="landing-reveal landing-delay-1">
            <p className="text-sm font-bold uppercase text-primary mb-4">
              Internship tracker for students
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-5 leading-tight max-w-3xl">
              Turn internship chaos into a clean daily record.
            </h1>
            <p className="text-base md:text-lg text-text-muted max-w-2xl mb-7 leading-relaxed">
              InternPal keeps applications, journal logs, evidence, and school
              reports together, so the work you do every day is already ready
              when someone asks for it.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => navigate(user ? "/dashboard" : "/register")}
                className="px-8 py-4 rounded-lg bg-primary text-white text-base font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-3 group"
              >
                {user ? "Go to Dashboard" : "Start tracking now"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("workspace-feature")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="hidden sm:flex px-8 py-4 rounded-lg border border-border bg-canvas text-text text-base font-semibold hover:border-primary/30 transition-colors"
              >
                See the workflow
              </button>
            </div>
          </div>

          <HeroOutcomeCard />
        </div>
      </section>

      <WorkflowSection />

      <CTUJournalFormatSection />

      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-12 landing-reveal">
          <p className="text-sm font-bold uppercase text-primary mb-3">
            Why it feels useful
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            The parts students actually repeat are one click away.
          </h2>
          <p className="text-text-muted font-medium text-lg max-w-3xl">
            InternPal is not a landing-page checklist. It is shaped around the
            repeated work of searching, logging, proving, and exporting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`${feature.span} landing-reveal group rounded-xl bg-canvas border border-border p-6 overflow-hidden hover:border-primary/20 hover:-translate-y-1 transition-all duration-200`}
              style={{ animationDelay: `${120 + index * 70}ms` }}
            >
              <div
                className={`w-10 h-10 rounded-lg ${feature.color} ${feature.textColor} flex items-center justify-center mb-5`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-text-muted leading-relaxed max-w-xl">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-surface/60 border-y border-border/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-canvas p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-5">
              <Clock3 size={24} strokeWidth={2.25} />
            </div>
            <h4 className="text-xl font-bold mb-3">Fast enough for daily use</h4>
            <p className="text-text-muted font-medium leading-relaxed">
              Add roles, move cards, and update logs without turning a quick
              journal entry into a long admin session.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-canvas p-6">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success mb-5">
              <ShieldCheck size={24} strokeWidth={2.25} />
            </div>
            <h4 className="text-xl font-bold mb-3">Private by default</h4>
            <p className="text-text-muted font-medium leading-relaxed">
              Your applications, supervisors, hours, notes, and evidence stay in
              your own account.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-canvas p-6">
            <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center text-info mb-5">
              <Globe size={24} strokeWidth={2.25} />
            </div>
            <h4 className="text-xl font-bold mb-3">Ready wherever you work</h4>
            <p className="text-text-muted font-medium leading-relaxed">
              Keep the journal current across tabs and devices, then export from
              Reports when requirements come due.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-2xl bg-text p-8 sm:p-12 md:p-16 text-white shadow-sm">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 md:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-white/50 mb-4">
                Start with one entry
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold mb-5 leading-tight">
                Keep today's work ready for tomorrow's report.
              </h2>
              <p className="text-white/65 text-base md:text-lg font-medium max-w-2xl">
                Create your workspace, add your first role, and let the journal
                grow into the report you will eventually need.
              </p>
            </div>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/register")}
              className="px-8 py-4 rounded-lg bg-primary text-white text-base font-semibold hover:bg-primary-hover transition-colors"
            >
              {user ? "Go to Dashboard" : "Create workspace"}
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 sm:px-6 border-t border-border/50 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs uppercase">IP</span>
          </div>
          <span className="font-bold text-sm">
            Copyright 2026 InternPal. All rights reserved.
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-text-muted hover:text-text transition-colors cursor-pointer">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
}
