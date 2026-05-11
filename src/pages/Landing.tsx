import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  LayoutGrid,
  History,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Globe,
} from "lucide-react";
import SEO from "@/components/SEO";
import { useAuthStore } from "@/store/authStore";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const features = [
    {
      title: "Visual Kanban",
      description:
        "Move applications through each stage with a clear drag-and-drop board.",
      icon: <LayoutGrid className="w-6 h-6" />,
      color: "bg-primary/10",
      textColor: "text-primary",
      span: "md:col-span-2",
    },
    {
      title: "Journal Tools",
      description:
        "Clean up entries, suggest tags, and prepare report-ready summaries.",
      icon: <BookOpen className="w-6 h-6" />,
      color: "bg-info/10",
      textColor: "text-info",
      span: "md:col-span-1",
    },
    {
      title: "Application Timeline",
      description:
        "See every application in order, from first submission to final decision.",
      icon: <History className="w-6 h-6" />,
      color: "bg-success/10",
      textColor: "text-success",
      span: "md:col-span-1",
    },
    {
      title: "Onboarding Checklists",
      description:
        "Turn accepted offers into a checklist for documents, dates, and prep.",
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: "bg-warning/10",
      textColor: "text-warning",
      span: "md:col-span-2",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-text overflow-x-hidden">
      <SEO title="Welcome" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50 h-16 flex items-center px-6 md:px-12 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">IP</span>
          </div>
          <span className="font-bold text-lg tracking-tight">InternPal</span>
        </div>
        <div className="flex items-center gap-6">
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
                className="px-5 py-2 rounded-lg bg-text text-white text-sm font-semibold hover:opacity-90 transition-colors"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-tight">
            Keep your internship <br />
            <span className="text-primary">search</span> organized.
          </h1>
          <p className="text-base md:text-lg text-text-muted max-w-2xl mx-auto mb-10">
            Track applications, log daily work, and export clean reports when
            you need them.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/register")}
              className="w-full md:w-auto px-8 py-4 rounded-lg bg-primary text-white text-base font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-3 group"
            >
              {user ? "Go to Dashboard" : "Get Started for Free"}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Everything useful. <br />
            Nothing in the way.
          </h2>
          <p className="text-text-muted font-medium text-lg">
            Built for students managing real roles, interviews, and internship
            logs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`${feature.span} group relative rounded-xl bg-canvas border border-border p-6 overflow-hidden hover:border-primary/20 transition-colors`}
            >
              <div className="relative z-10">
                <div
                  className={`w-10 h-10 rounded-lg ${feature.color} ${feature.textColor} flex items-center justify-center mb-5`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-muted leading-relaxed max-w-[240px]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-surface/50 border-y border-border/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-white rounded-xl border border-border flex items-center justify-center mx-auto text-primary">
              <Clock3 size={28} strokeWidth={2.25} />
            </div>
            <h4 className="text-xl font-bold tracking-tight">
              Quick Updates
            </h4>
            <p className="text-text-muted font-medium">
              Add roles, move cards, and update notes without slowing down.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-14 h-14 bg-white rounded-xl border border-border flex items-center justify-center mx-auto text-success">
              <ShieldCheck size={28} strokeWidth={2.25} />
            </div>
            <h4 className="text-xl font-bold tracking-tight">Privacy First</h4>
            <p className="text-text-muted font-medium">
              Your application history and journal records stay in your account.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-14 h-14 bg-white rounded-xl border border-border flex items-center justify-center mx-auto text-info">
              <Globe size={28} strokeWidth={2.25} />
            </div>
            <h4 className="text-xl font-bold tracking-tight">
              Always Current
            </h4>
            <p className="text-text-muted font-medium">
              Real-time updates keep changes in sync across tabs and devices.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto rounded-2xl bg-text p-12 md:p-20 text-center text-white shadow-sm">
          <div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 leading-tight">
              Ready to organize <br />
              your search?
            </h2>
            <p className="text-white/60 text-lg md:text-xl font-medium mb-12 max-w-xl mx-auto">
              Keep roles, deadlines, notes, and outcomes in one focused place.
            </p>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/register")}
              className="px-8 py-4 rounded-lg bg-primary text-white text-base font-semibold hover:bg-primary-hover transition-colors"
            >
              {user ? "Go to Dashboard" : "Get Started Now"}
            </button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs uppercase">IP</span>
          </div>
          <span className="font-bold text-sm tracking-tight">
            Copyright 2026 InternPal. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-8 text-sm font-bold text-text-muted hover:text-text transition-colors cursor-pointer">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
}
