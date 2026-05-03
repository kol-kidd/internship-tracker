import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  LayoutGrid,
  History,
  CheckCircle2,
  Zap,
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
      image: "/feature_kanban_icon_premium_1772958235096.png",
      color: "bg-primary/10",
      textColor: "text-primary",
      span: "md:col-span-2",
    },
    {
      title: "Journal Tools",
      description:
        "Clean up entries, suggest tags, and prepare report-ready summaries.",
      icon: <BookOpen className="w-6 h-6" />,
      image: "/feature_ai_sparkle_premium_1772958280215_1772958308667.png",
      color: "bg-purple-500/10",
      textColor: "text-[#af52de]",
      span: "md:col-span-1",
    },
    {
      title: "Live Journey",
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
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xs">IP</span>
          </div>
          <span className="font-bold text-lg tracking-tight">InternPal</span>
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2 rounded-full bg-primary text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
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
                className="px-5 py-2 rounded-full bg-text text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-black/10"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Briefcase size={14} />
            <span>Internship Tracker</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Keep your internship <br />
            <span className="text-primary italic">search</span> organized.
          </h1>
          <p className="text-lg md:text-2xl text-text-muted font-medium max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            Track applications, log daily work, and export clean reports when
            you need them.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/register")}
              className="w-full md:w-auto px-10 py-5 rounded-[2rem] bg-text text-white text-lg font-black hover:opacity-90 transition-all active:scale-95 shadow-2xl shadow-black/20 flex items-center justify-center gap-3 group"
            >
              {user ? "Go to Dashboard" : "Get Started for Free"}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Hero Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-40">
          <img
            src="/landing_hero_premium_abstract_1772958280215.png"
            alt="Abstract Background"
            className="w-full h-full object-cover blur-[80px]"
          />
        </div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />
      </section>

      {/* Feature Grid (Bento) */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
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
              className={`${feature.span} group relative rounded-[2.5rem] bg-canvas border border-border/50 p-8 overflow-hidden hover:border-primary/20 transition-all duration-500 hover:shadow-premium`}
            >
              <div className="relative z-10">
                <div
                  className={`w-12 h-12 rounded-2xl ${feature.color} ${feature.textColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-muted font-medium leading-relaxed max-w-[200px]">
                  {feature.description}
                </p>
              </div>

              {feature.image && (
                <div className="absolute -right-4 -bottom-4 w-48 h-48 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Subtle Gradient Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-surface/50 border-y border-border/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto text-primary">
              <Zap size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black tracking-tight">
              Quick Updates
            </h4>
            <p className="text-text-muted font-medium">
              Add roles, move cards, and update notes without slowing down.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto text-success">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black tracking-tight">Privacy First</h4>
            <p className="text-text-muted font-medium">
              Your application history and journal records stay in your account.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto text-[#af52de]">
              <Globe size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black tracking-tight">
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
        <div className="max-w-5xl mx-auto rounded-[3.5rem] bg-text p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-none">
              Ready to organize <br />
              your search?
            </h2>
            <p className="text-white/60 text-lg md:text-xl font-medium mb-12 max-w-xl mx-auto">
              Keep roles, deadlines, notes, and outcomes in one focused place.
            </p>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/register")}
              className="px-12 py-6 rounded-[2rem] bg-primary text-white text-xl font-black hover:bg-primary-hover transition-all active:scale-95 shadow-xl shadow-primary/20"
            >
              {user ? "Go to Dashboard" : "Get Started Now"}
            </button>
          </div>

          {/* Background Orbs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
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
