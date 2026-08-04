"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Smart Classrooms",
    text: "Create classes, share codes, post announcements, and keep every subject organized with ease.",
    icon: "M5 6.5A2.5 2.5 0 0 1 7.5 4H19v13.5A2.5 2.5 0 0 1 16.5 20H7.5A2.5 2.5 0 0 1 5 17.5v-11ZM8 8h8M8 12h7M8 16h5"
  },
  {
    title: "Assignments",
    text: "Upload files, set deadlines, collect submissions, grade work, and give personalized feedback.",
    icon: "M7 4h7l4 4v12H7V4Zm7 0v5h5M9 13h6M9 17h5"
  },
  {
    title: "Live Classes",
    text: "Schedule sessions, attach meeting links, track attendance, and keep learners engaged in real-time.",
    icon: "M4 7h11a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H4V7Zm14 4 3-2v6l-3-2"
  },
  {
    title: "Online Exams",
    text: "Build secure exams with timers, question palettes, randomized papers, and auto-save functionality.",
    icon: "M12 3a9 9 0 1 0 9 9M12 7v5l3 2M4 4l3 3M20 4l-3 3"
  },
  {
    title: "Analytics",
    text: "View attendance, results, progress, and institution activity in beautiful, actionable dashboards.",
    icon: "M5 19V9M12 19V5M19 19v-8M3 19h18"
  },
  {
    title: "AI Ready",
    text: "Built for future AI integration: question generation, answer evaluation, and personalized learning.",
    icon: "M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7L12 3ZM5 15l1 2.5L8.5 19l-1-2.5L5 15Zm11-11 .8 2.2L19 7l-2.2.8L16 10l-.8-2.2L13 7l2.2-.8L16 4Z"
  }
];

const testimonials: Array<{ name: string; role: string; text: string }> = [];
const faqItems: Array<{ question: string; answer: string }> = [];

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dff7ff_0,#f8fbff_32%,#ffffff_68%)]">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="#" className="flex items-center gap-3" aria-label="DigiClassroom home">
          <img 
            src="/mylogo.jpeg" 
            alt="DigiClassroom Logo" 
            className="h-20 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="text-lg font-bold tracking-tight text-ink">DigiClassroom</span>
        </a>
        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="transition hover:text-ocean">Features</a>
          <a href="#ai" className="transition hover:text-ocean">AI</a>
          <a href="#faq" className="transition hover:text-ocean">FAQ</a>
          <a href="#contact" className="transition hover:text-ocean">Contact</a>
        </div>
        <div className="flex items-center gap-2">
          <a href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white sm:block">Login</a>
          <a href="/register" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-ocean">Get Started</a>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Teach, test, and manage learning from one beautiful platform.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            DigiClassroom brings classrooms, assignments, live sessions, exams, analytics, and AI workflows into a single, intuitive SaaS experience for modern educational institutions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/register" className="rounded-full bg-ocean px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-700">Start Free Trial</a>
            <a href="/login" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-ocean hover:text-ocean">Book a Demo</a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft flex items-center justify-center h-80">
            <p className="text-slate-500 text-center">Dashboard preview coming soon</p>
          </div>
        </motion.div>
      </section>

      <section id="features" className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Features</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-5xl">Everything you need in one place.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="group rounded-3xl border border-slate-100 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ocean text-white shadow-lg shadow-blue-500/20 transition group-hover:bg-ink">
                  <Icon path={feature.icon} />
                </div>
                <h3 className="mt-5 text-xl font-black text-ink">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Screenshots</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-5xl">See DigiClassroom in action.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"
            >
              <div className="rounded-2xl bg-blue-50 h-64 flex items-center justify-center">
                <div className="text-center">
                  <Icon path="M5 6.5A2.5 2.5 0 0 1 7.5 4H19v13.5A2.5 2.5 0 0 1 16.5 20H7.5A2.5 2.5 0 0 1 5 17.5v-11ZM8 8h8M8 12h7M8 16h5" />
                  <p className="mt-2 text-ocean font-bold">Classroom Dashboard</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"
            >
              <div className="rounded-2xl bg-green-50 h-64 flex items-center justify-center">
                <div className="text-center">
                  <Icon path="M12 3a9 9 0 1 0 9 9M12 7v5l3 2M4 4l3 3M20 4l-3 3" />
                  <p className="mt-2 text-mint font-bold">Online Exam Portal</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="ai" className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] bg-ink p-6 text-white shadow-soft md:grid-cols-[0.9fr_1.1fr] md:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">AI Features</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Powered by AI, designed for educators.</h2>
            <p className="mt-5 leading-8 text-blue-100">From generating questions to evaluating answers, our AI features save you time and enhance learning outcomes.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["AI Question Generator", "AI Test Paper Builder", "AI Answer Evaluation", "AI Learning Assistant"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-5 font-bold backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Testimonials</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-5xl">Loved by educators and students.</h2>
          </div>
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">Testimonials coming soon</p>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">FAQ</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-5xl">Got questions? We&apos;ve got answers.</h2>
          </div>
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">FAQ coming soon</p>
          </div>
        </div>
      </section>

      <section id="contact" className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-ink p-8 text-white text-center shadow-soft">
          <h2 className="text-3xl font-black sm:text-5xl">Ready to get started?</h2>
          <p className="mt-4 text-blue-100 text-lg">Join thousands of institutions already using DigiClassroom.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <button className="rounded-full bg-ocean px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-700">Start Free Trial</button>
            <button className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20">Contact Sales</button>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <img 
                  src="/mylogo.jpeg" 
                  alt="DigiClassroom Logo" 
                  className="h-16 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="text-lg font-bold tracking-tight text-ink">DigiClassroom</span>
              </div>
              <p className="mt-4 text-slate-600">The AI-ready LMS for modern educational institutions.</p>
            </div>
            <div>
              <h4 className="font-bold text-ink">Product</h4>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li><a href="#features" className="hover:text-ocean">Features</a></li>
                <li><a href="#" className="hover:text-ocean">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-ink">Company</h4>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-ocean">About</a></li>
                <li><a href="#" className="hover:text-ocean">Blog</a></li>
                <li><a href="#" className="hover:text-ocean">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-ink">Legal</h4>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-ocean">Privacy</a></li>
                <li><a href="#" className="hover:text-ocean">Terms</a></li>
                <li><a href="#" className="hover:text-ocean">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-600">
            <p>© 2026 DigiClassroom. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
