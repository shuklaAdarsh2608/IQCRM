"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  CircleDollarSign,
  Globe2,
  LineChart,
  MapPin,
  Rocket,
  Users,
  Wrench
} from "lucide-react";
import { PublicHeader } from "../../components/layout/PublicHeader";

const stats = [
  { icon: Users, value: "100K+", label: "Alumni worldwide" },
  { icon: Award, value: "550+", label: "Learning solutions" },
  { icon: LineChart, value: "100+", label: "Industry experts" },
  { icon: Award, value: "99%", label: "Certification success" }
];

const growthTimeline = [
  {
    title: "The spark",
    points: ["We saw how big the skill gap was for working professionals in India and abroad."]
  },
  {
    title: "The foundation",
    points: [
      "We designed high‑impact, case‑study driven programs for managers, engineers and leaders."
    ]
  },
  {
    title: "The breakthrough",
    points: [
      "1‑on‑1 mentoring, 24/7 learner support and our first 1,000+ successful alumni community."
    ]
  },
  {
    title: "The momentum",
    points: [
      "Programs scaled across industries with live cohorts, corporate tie‑ups and global learners."
    ]
  }
];

const values = [
  {
    title: "Practical skill development",
    description: "Every session is focused on tools you can apply at work the same week.",
    icon: Wrench
  },
  {
    title: "Flexible online learning",
    description:
      "Weekend classes, self‑paced modules and recordings so your career never pauses.",
    icon: BookOpen
  },
  {
    title: "Affordable growth path",
    description: "Structured programs and EMI options so quality upskilling is accessible.",
    icon: CircleDollarSign
  },
  {
    title: "Global recognition",
    description:
      "Lean Six Sigma and management credentials trusted across industries and geographies.",
    icon: Globe2
  },
  {
    title: "Expert‑led guidance",
    description: "Faculty from top companies guide you from enrollment to certification.",
    icon: LineChart
  },
  {
    title: "Career‑boosting impact",
    description:
      "Learners report better roles, promotions and more confidence after completing programs.",
    icon: Rocket
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-slate-900 dark:text-slate-100">
      <PublicHeader />

      {/* Hero */}
      <main className="mx-auto max-w-[1600px] px-4 pb-20 pt-6 sm:pt-12">
        <section className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:mb-8 sm:text-xs">
            <button className="rounded-full bg-slate-900 px-4 py-1 font-medium text-white shadow-sm">
              Automation
            </button>
            <button className="rounded-full bg-white/70 px-4 py-1 font-medium text-slate-600 shadow-sm">
              Analytics
            </button>
            <button className="rounded-full bg-white/70 px-4 py-1 font-medium text-slate-600 shadow-sm">
              Pipelines
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr,1.1fr]">
            <div className="flex flex-col justify-center">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[10px] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Smarter CRM • Stronger Sales
              </span>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl md:text-5xl">
                Smarter CRM,
                <br />
                <span className="text-slate-800 dark:text-slate-100">stronger sustainable sales.</span>
              </h1>
              <p className="mt-3 max-w-md text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                IQLead centralizes every lead, conversation and target so your team can close
                deals faster with complete visibility across WhatsApp chats, calls and
                dashboards.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold text-white shadow-md hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Get started
                </Link>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  No setup fees. Admins can onboard teams in minutes.
                </span>
              </div>
            </div>

            {/* Hero dashboard card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45 }}
              className="relative"
            >
              <div className="pointer-events-none absolute inset-0 -z-10 translate-y-4 rounded-[40px] bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.55),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.55),transparent_55%)] opacity-80" />
              <div className="glass-card relative h-full rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_22px_80px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-900/90 sm:p-5">
                <div className="mb-3 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-200">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 font-medium dark:bg-slate-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live pipeline
                  </span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                    This month
                  </span>
                </div>
                <div className="grid gap-3 text-[11px] sm:grid-cols-[1.1fr,1fr]">
                  <div className="rounded-2xl bg-slate-900 px-4 py-3 text-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                      Promotion analysis
                    </p>
                    <p className="mt-1 text-base font-semibold">Lead performance overview</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <p className="text-slate-400">Leads</p>
                        <p className="text-sm font-semibold text-white">8,640</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Won</p>
                        <p className="text-sm font-semibold text-emerald-300">312</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Revenue</p>
                        <p className="text-sm font-semibold text-amber-200">$2.5M</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-100">
                      Team activity today
                    </p>
                    <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-300">
                      <p>• 12 new WhatsApp replies</p>
                      <p>• 8 calls scheduled</p>
                      <p>• 5 deals moved to Won</p>
                    </div>
                    <div className="mt-2 h-20 rounded-xl bg-gradient-to-tr from-orange-200 via-fuchsia-200 to-indigo-200" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features section */}
        <section
          id="features"
          className="mt-12 rounded-3xl bg-white/90 p-5 text-xs text-slate-700 shadow-[0_20px_70px_rgba(15,23,42,0.14)] dark:bg-slate-900/90 dark:text-slate-100 sm:mt-14 sm:p-7"
        >
          <div className="mb-6 text-center sm:mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500 sm:text-sm">
              FEATURES
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50 sm:text-3xl">
              Everything your sales team needs in one CRM.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                Lead management
              </h3>
              <p className="text-[13px] text-slate-600 dark:text-slate-200">
                Capture, import and assign leads with role‑based access to My leads and All
                leads, plus detailed status and remarks.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                Targets & dashboards
              </h3>
              <p className="text-[13px] text-slate-600 dark:text-slate-200">
                Set monthly revenue targets for executives and teams, and track progress
                with live goals and performance reports.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                WhatsApp & calls
              </h3>
              <p className="text-[13px] text-slate-600 dark:text-slate-200">
                Chat with leads via WhatsApp, schedule follow‑up calls, and keep all
                conversations and notifications in one place.
              </p>
            </div>
          </div>
        </section>

        {/* Full About section (scroll target) */}
        <section
          id="about"
          className="mt-14 rounded-3xl bg-white/90 pb-10 text-xs text-slate-700 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:bg-slate-950/90 dark:text-slate-100 sm:mt-16"
        >
          {/* About hero */}
          <section className="relative overflow-hidden rounded-t-3xl bg-[#070f1c] pb-8 pt-6 text-white sm:pb-10 sm:pt-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 max-w-4xl rounded-[999px] bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.24),transparent_60%)]" />
            <div className="relative mx-auto max-w-5xl px-5 sm:px-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45 }}
                className="mx-auto max-w-3xl text-center"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-300 sm:text-sm">
                  ABOUT IQLEAD ENGINE
                </p>
                <h2 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                  Empowering revenue teams with real‑world, data‑driven skills.
                </h2>
                <p className="text-xs text-slate-200 sm:text-sm">
                  IQLead is built by operators for operators – managers, team leaders and
                  sales executives who want a clean CRM, clear goals and the confidence to
                  close more deals.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Stats */}
          <section className="bg-white py-6 sm:py-8 dark:bg-slate-950">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats.map(({ icon: Icon, value, label }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-900/80"
                  >
                    <Icon className="mb-2 h-5 w-5 text-orange-500" />
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 sm:text-xl">
                      {value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 sm:text-xs">
                      {label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Mission / Vision */}
          <section className="bg-slate-50 py-8 sm:py-10 dark:bg-slate-900">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-950 sm:p-7"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                    <Award className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-50 sm:text-xl">
                    Our mission
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200 sm:text-[15px]">
                    To give sales organisations a CRM that feels like a natural extension of
                    their workflow – combining lead management, targets, WhatsApp chat and
                    reporting into one simple, beautiful tool.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-950 sm:p-7"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/5">
                    <LineChart className="h-5 w-5 text-slate-800" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-50 sm:text-xl">
                    Our vision
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200 sm:text-[15px]">
                    To be the growth engine behind thousands of high‑performing revenue
                    teams, from early‑stage startups to scaled enterprises across the globe.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Company growth timeline */}
          <section className="bg-slate-100 py-8 sm:py-10 dark:bg-slate-900">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
              <div className="mb-6 text-center sm:mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                  Company growth
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50 sm:text-3xl">
                  Empowering careers, one{" "}
                  <span className="text-orange-500">pipeline</span> at a time.
                </h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {growthTimeline.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="rounded-2xl bg-white p-5 text-sm text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200 sm:p-6"
                  >
                    <h4 className="mb-3 text-base font-semibold text-slate-900 sm:text-lg">
                      {item.title}
                    </h4>
                    <ul className="space-y-2 text-[13px]">
                      {item.points.map((point) => (
                        <li key={point} className="flex gap-2">
                          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="bg-white py-8 sm:py-10 dark:bg-slate-950">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
              <div className="mb-6 text-center sm:mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                  Our values
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50 sm:text-3xl">
                  How IQLead supports your growth
                </h3>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {values.map(({ title, description, icon: Icon }) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.3 }}
                    className="group relative rounded-3xl border border-slate-100 bg-white p-5 text-sm text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/85 dark:text-slate-100 dark:hover:shadow-[0_20px_45px_rgba(15,23,42,0.6)] sm:p-6"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 sm:h-11 sm:w-11">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-50 sm:text-lg">
                      {title}
                    </h4>
                    <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                      {description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Offices */}
          <section className="bg-slate-50 py-8 sm:py-10 dark:bg-slate-900">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="mb-6 text-center sm:mb-8">
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 sm:text-3xl">
                  Building careers without borders
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-[15px]">
                  Serving professionals from multiple countries through live and online
                  certification programs.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {[
                  {
                    title: "Registered office – India",
                    text: "MNDO CLASSIFYIQ LLP, 005, Golden Nest Apartment, Garhi Choukhandi, Noida, Gautam Buddha Nagar – 201301, Uttar Pradesh, India."
                  },
                  {
                    title: "Corporate office – Noida",
                    text: "MNDO CLASSIFYIQ LLP, C‑25, C Block, Sector 8, Noida, Uttar Pradesh 201301."
                  },
                  {
                    title: "International office – UAE",
                    text: "CLASSIFYIQ LLC, Business Center, Sharjah Publishing City Free Zone, Sheikh Mohammed Bin Zayed Rd, Al Zahia, Sharjah, United Arab Emirates."
                  }
                ].map((office) => (
                  <div
                    key={office.title}
                    className="flex min-h-[170px] flex-col rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                      {office.title}
                    </h4>
                    <div className="mt-1 flex gap-2 text-[13px] sm:text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                      <p>{office.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}


