"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import NoaHero from "@/components/noa-hero";

/* ============================================================
   Data
   ============================================================ */

const WHATSAPP = "https://wa.me/237673491464";
const MAIL = "mailto:banven100@gmail.com";
const GITHUB = "https://github.com/BANVEN-subzero";
const PHONE = "tel:+237673491464";
const CV = "/Nyuydze-Banven-Eric-Junior-CV.pdf";

const NAV = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

interface Project {
  id: string;
  index: string;
  title: string;
  year: string;
  role: string;
  status: string;
  image: string;
  imageAlt: string;
  problem: string;
  solution: string;
  contribution: string;
  stack: string[];
  result: string;
}

const PROJECTS: Project[] = [
  {
    id: "tryons",
    index: "01",
    title: "TRYONS",
    year: "2024 — 2025",
    role: "AR e-commerce · Frontend & Backend Integration",
    status: "Shipped (internship)",
    image: "/projects/tryons.jpg?v=3",
    imageAlt: "Augmented reality furniture preview on a smartphone — TRYONS AR e-commerce",
    problem:
      "Shoppers in emerging markets buy furniture and apparel they have never seen in their physical space, leading to high return rates and low confidence. The team at Digimark Consulting SARL needed an AR preview that worked on mid-range Android phones without a dedicated app install.",
    solution:
      "TRYONS is a web-based AR e-commerce application built on Node.js and Express, with MongoDB for the product catalogue and Tailwind for the UI. Customers preview products in their own room via the device camera, then complete checkout in the same session.",
    contribution:
      "Two internship periods (Jul–Sep 2024, Jul–Sep 2025). I worked across C++, HTML, CSS, JavaScript, Java and Python on responsive frontends and backend integration — wiring AR preview state into the cart, normalising the product catalogue schema, and hardening the mobile checkout flow for low-bandwidth conditions.",
    stack: ["Node.js", "Express", "MongoDB", "Tailwind", "JavaScript", "C++", "Java", "Python"],
    result:
      "The AR preview flow shipped to production for the catalogue categories the team rolled out first. I closed the internship with documentation for the next cohort of interns on the catalogue import pipeline.",
  },
  {
    id: "cultia",
    index: "02",
    title: "CULTIA",
    year: "2024",
    role: "Cultural heritage platform · Solo project",
    status: "Prototype",
    image: "/projects/cultia.jpg?v=3",
    imageAlt: "Cameroonian cultural heritage artefacts on a dark museum display — CULTIA",
    problem:
      "Cameroonian cultural institutions hold rich collections of artefacts, stories, and languages, but most catalogues live in physical ledgers or isolated files that visitors cannot query. There is no lightweight, maintainable way for a small museum to put its collection online.",
    solution:
      "CULTIA is a cultural heritage platform built with Python and Flask. Curators catalogue artefacts with metadata and images; an AI chatbot lets visitors ask questions in natural language and persists conversations in SQLite for follow-up research.",
    contribution:
      "Sole developer. Designed the schema, built the Flask routes, integrated the Gemini API for the chatbot, and wrote the curator upload flow. Focused on keeping the system operable by a single non-technical curator after hand-off.",
    stack: ["Python", "Flask", "SQLite", "Gemini API", "HTML", "CSS"],
    result:
      "Prototype demonstrated against a sample catalogue of 40 artefacts. The chatbot answered visitor queries with citation back to the source record in 3–5 seconds on a low-bandwidth connection.",
  },
  {
    id: "mediscan",
    index: "03",
    title: "MEDISCAN AI",
    year: "2024",
    role: "Health information tool · Concept",
    status: "Concept stage",
    image: "/projects/mediscan.jpg?v=3",
    imageAlt: "Dark-mode medical information app concept with AI neural overlay — MEDISCAN AI",
    problem:
      "Medical language is opaque to non-specialists. Patients walk out of clinics with terms they cannot act on, and reliable plain-language explanations are scattered across ad-supported websites of varying quality.",
    solution:
      "MEDISCAN AI is a concept-stage health information tool that explains medical terms and common conditions in plain language, with explicit disclaimers and pointers to local health services. It is not a diagnostic device.",
    contribution:
      "Concept and prototype prompt flow. Mapped the OpenAI API into a constrained explanation pipeline that refuses to diagnose, always appends a disclaimer, and surfaces the nearest local health service when it can infer one.",
    stack: ["OpenAI API", "Python", "Prompt engineering", "UI concept"],
    result:
      "Concept validated against 30 sample clinical phrases. The tool explained each in under 100 words at a 9th-grade reading level and refused to answer diagnostic questions 100% of the time in the test set.",
  },
  {
    id: "utrust",
    index: "04",
    title: "U-TRUST",
    year: "2025",
    role: "Personal expense tracker · Solo project",
    status: "In development",
    image: "/projects/utrust.jpg?v=3",
    imageAlt: "Dark-mode personal finance app dashboard in FCFA — U-TRUST expense tracker",
    problem:
      "Most personal finance apps assume a bank integration that the majority of users in Cameroon do not have. People move money through mobile money, cash, and informal savings circles — none of which fit a standard fintech schema.",
    solution:
      "U-TRUST is a personal expense tracker designed for the FCFA economy. It tracks income, recurring spend, and savings goals without forcing bank integration. Offline-first, mobile-friendly, and built around manual entry with smart categorisation.",
    contribution:
      "Sole developer. Designed the data model around real Cameroonian money flows (mobile money, cash, tontine), built the offline-first storage layer, and prototyped the savings goal ring UI.",
    stack: ["JavaScript", "Offline-first storage", "Mobile-first UI", "FCFA currency"],
    result:
      "In development. The savings goal ring and category breakdown are functional; the tontine (rotating savings) module is the next milestone.",
  },
];

const TIMELINE = [
  {
    year: "2025 — Now",
    title: "Master's Programme, Software Engineering",
    place: "College of Technology, University of Buea",
    body: "Currently enrolled. Focus on distributed systems, AI integration, and engineering for low-bandwidth contexts — the reality most users in Central Africa live in.",
  },
  {
    year: "Jul — Sep 2025",
    title: "Software / Web Development Intern",
    place: "Digimark Consulting SARL — TryOns AR e-commerce",
    body: "Second internship rotation. Worked across C++, HTML, CSS, JavaScript, Java and Python on responsive frontends and backend integration. Took over the catalogue import pipeline and shipped documentation for the next intern cohort.",
  },
  {
    year: "Jul — Sep 2024",
    title: "Software / Web Development Intern",
    place: "Digimark Consulting SARL — TryOns AR e-commerce",
    body: "First internship rotation. Joined the TryOns frontend team, wired AR preview state into the cart, and learned that shipping means picking the boring, correct tool over the impressive, fragile one.",
  },
  {
    year: "B.Tech",
    title: "Bachelor of Technology in Software Engineering",
    place: "University of Buea — GPA 3.40",
    body: "Foundation in algorithms, databases, software design, and engineering process. Final-year work touched cultural preservation software and AI-assisted information tools.",
  },
];

const STACK = [
  {
    group: "Languages",
    items: ["Python", "JavaScript", "Java", "C++"],
  },
  {
    group: "Web",
    items: ["HTML", "CSS", "Tailwind CSS", "Node.js", "Express"],
  },
  {
    group: "Backend / Data",
    items: ["Flask", "SQLite", "MongoDB", "Prisma"],
  },
  {
    group: "Integrations",
    items: ["Gemini API", "OpenAI API", "Figma", "LabVIEW", "Three.js"],
  },
];

/* ============================================================
   Motion helpers — varied scroll-triggered animations
   ============================================================ */

// Fade + rise
function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Slide in from left
function SlideLeft({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Slide in from right
function SlideRight({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Scale + fade (bounce-in feel)
function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 120, damping: 16 }}
    >
      {children}
    </motion.div>
  );
}

// Stagger container + item
function StaggerGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   Magnetic link — subtle pull toward cursor
   ============================================================ */

function MagneticLink({
  href,
  children,
  className,
  external,
  download,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  download?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / 6;
      const dy = (e.clientY - cy) / 6;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return (
    <a
      ref={ref}
      href={href}
      className={className}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      download={download}
    >
      {children}
    </a>
  );
}

/* ============================================================
   Page
   ============================================================ */

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="site">
      {/* Grain + vignette background */}
      <div className="bg-grain" aria-hidden="true" />
      <div className="bg-vignette" aria-hidden="true" />

      {/* Sticky nav */}
      <nav className="nav">
        <a className="nav-brand" href="#top" onClick={() => setMenuOpen(false)}>
          <span className="nav-brand-mark">BVEN</span>
          <span className="nav-brand-name">Banven Eric</span>
        </a>
        <ul className="nav-links">
          {NAV.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <a className="nav-cv" href={CV} download="Nyuydze-Banven-Eric-Junior-CV.pdf">
            <span className="nav-cv-label">Curriculum Vitae</span>
            <span className="nav-cv-arrow" aria-hidden="true">↓</span>
          </a>
          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="nav-toggle-bar" data-open={menuOpen ? "true" : "false"} />
            <span className="nav-toggle-bar" data-open={menuOpen ? "true" : "false"} />
            <span className="nav-toggle-bar" data-open={menuOpen ? "true" : "false"} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu" id="mobile-menu">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <NoaHero />

      <main className="main" id="top">
        {/* ============================================================
            Selected work
            ============================================================ */}
        <section className="section" id="work" aria-label="Selected work">
          <SlideLeft>
            <div className="section-head">
              <span className="section-num">01</span>
              <h2 className="section-title">Selected work</h2>
              <span className="section-rule" />
            </div>
          </SlideLeft>

          {/* Featured project */}
          <div className="case-featured-wrap">
            <SlideLeft delay={0.05}>
              <div className="case-image-wrap">
                <img
                  className="case-image"
                  src={PROJECTS[0].image}
                  alt={PROJECTS[0].imageAlt}
                  loading="lazy"
                  decoding="async"
                />
                <span className="case-image-tag">{PROJECTS[0].status}</span>
              </div>
            </SlideLeft>
            <SlideRight delay={0.1}>
              <div className="case-body">
                <div className="case-head">
                  <span className="case-index">{PROJECTS[0].index}</span>
                  <h3 className="case-title">{PROJECTS[0].title}</h3>
                </div>
                <p className="case-meta">{PROJECTS[0].year} · {PROJECTS[0].role}</p>
                <StaggerGroup stagger={0.06}>
                  <StaggerItem>
                    <div className="case-section">
                      <span className="case-section-label">Problem</span>
                      <p>{PROJECTS[0].problem}</p>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="case-section">
                      <span className="case-section-label">Solution</span>
                      <p>{PROJECTS[0].solution}</p>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="case-section">
                      <span className="case-section-label">Contribution</span>
                      <p>{PROJECTS[0].contribution}</p>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="case-section">
                      <span className="case-section-label">Stack</span>
                      <ul className="case-stack">
                        {PROJECTS[0].stack.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="case-section">
                      <span className="case-section-label">Result</span>
                      <p>{PROJECTS[0].result}</p>
                    </div>
                  </StaggerItem>
                </StaggerGroup>
              </div>
            </SlideRight>
          </div>

          {/* Other projects — asymmetric grid with bounce-in */}
          <div className="case-grid">
            {PROJECTS.slice(1).map((p, i) => (
              <ScaleIn key={p.id} delay={i * 0.1}>
                <article className={`case case-${i + 2}`}>
                  <div className="case-image-wrap">
                    <img
                      className="case-image"
                      src={p.image}
                      alt={p.imageAlt}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="case-image-tag">{p.status}</span>
                  </div>
                  <div className="case-body">
                    <div className="case-head">
                      <span className="case-index">{p.index}</span>
                      <h3 className="case-title">{p.title}</h3>
                    </div>
                    <p className="case-meta">{p.year} · {p.role}</p>
                    <StaggerGroup stagger={0.05}>
                      <StaggerItem>
                        <div className="case-section">
                          <span className="case-section-label">Problem</span>
                          <p>{p.problem}</p>
                        </div>
                      </StaggerItem>
                      <StaggerItem>
                        <div className="case-section">
                          <span className="case-section-label">Solution</span>
                          <p>{p.solution}</p>
                        </div>
                      </StaggerItem>
                      <StaggerItem>
                        <div className="case-section">
                          <span className="case-section-label">Contribution</span>
                          <p>{p.contribution}</p>
                        </div>
                      </StaggerItem>
                      <StaggerItem>
                        <div className="case-section">
                          <span className="case-section-label">Stack</span>
                          <ul className="case-stack">
                            {p.stack.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </StaggerItem>
                      <StaggerItem>
                        <div className="case-section">
                          <span className="case-section-label">Result</span>
                          <p>{p.result}</p>
                        </div>
                      </StaggerItem>
                    </StaggerGroup>
                  </div>
                </article>
              </ScaleIn>
            ))}
          </div>
        </section>

        {/* ============================================================
            About — editorial narrative + timeline
            ============================================================ */}
        <section className="section" id="about" aria-label="About">
          <SlideRight>
            <div className="section-head">
              <span className="section-num">02</span>
              <h2 className="section-title">About</h2>
              <span className="section-rule" />
            </div>
          </SlideRight>

          <div className="about-grid">
            <SlideLeft>
              <div className="about-prose">
                <p>
                  I am Nyuydze Banven Eric Junior, a computer engineering
                  postgraduate student at the College of Technology, University
                  of Buea, based in Yaoundé, Cameroon.
                </p>
                <p>
                  My work sits at the intersection of practical software and
                  real users: tools that help people preserve culture, manage
                  money, shop online, and make sense of information that
                  affects their health. Most users I build for live in
                  low-bandwidth contexts — the reality of Central Africa — and
                  every design decision is filtered through that constraint.
                </p>
                <p>
                  I want to build software that holds up: clean codebases,
                  honest interfaces, tools that work on the devices and networks
                  people actually have. Long term, I want to contribute to
                  open-source tooling for low-bandwidth contexts and eventually
                  lead engineering for a product that matters to people here.
                </p>
              </div>
            </SlideLeft>

                       <SlideRight delay={0.1}>
              <div className="about-aside">
                <span className="about-aside-label">Currently</span>
                <ul className="about-current">
                  <li>Finishing the Master&apos;s programme at the College of Technology, University of Buea.</li>
                  <li>Side studies in real-time rendering and AI-assisted information tools for low-bandwidth contexts.</li>
                  <li>Open to internship, collaboration, and junior engineering roles in web development, AI integration, or AR e-commerce.</li>
                </ul>
              </div>
            </SlideRight>
          </div>

          {/* Timeline */}
          <Reveal delay={0.1}>
            <div className="timeline">
              {TIMELINE.map((t, i) => (
                <motion.div
                  key={t.year}
                  className="timeline-row"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  <div className="timeline-year">{t.year}</div>
                  <div className="timeline-line" aria-hidden="true" />
                  <div className="timeline-body">
                    <h3 className="timeline-title">{t.title}</h3>
                    <p className="timeline-place">{t.place}</p>
                    <p className="timeline-text">{t.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ============================================================
            Process / Stack
            ============================================================ */}
        <section className="section" id="process" aria-label="Process and stack">
          <SlideLeft>
            <div className="section-head">
              <span className="section-num">03</span>
              <h2 className="section-title">Process &amp; Stack</h2>
              <span className="section-rule" />
            </div>
          </SlideLeft>

          <StaggerGroup className="stack-grid" stagger={0.1}>
            {STACK.map((g) => (
              <StaggerItem key={g.group}>
                <div className="stack-col">
                  <h3 className="stack-col-title">{g.group}</h3>
                  <ul className="stack-list">
                    {g.items.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <ScaleIn delay={0.1}>
            <p className="process-note">
              I pick the boring, correct tool over the impressive, fragile one.
              The same instinct applies to architecture, dependencies, and UI:
              choose what holds up under a flaky connection on a mid-range phone,
              not what looks best in a demo.
            </p>
          </ScaleIn>
        </section>

        {/* ============================================================
            Contact
            ============================================================ */}
        <section className="section" id="contact" aria-label="Contact">
          <SlideRight>
            <div className="section-head">
              <span className="section-num">04</span>
              <h2 className="section-title">Contact</h2>
              <span className="section-rule" />
            </div>
          </SlideRight>

          <ScaleIn delay={0.05}>
            <div className="contact-block">
              <p className="contact-lead">
                Open to internship, collaboration, and junior engineering roles
                in web development, AI integration, or AR e-commerce. The
                fastest way to reach me is email or WhatsApp.
              </p>
              <MagneticLink href={MAIL} className="contact-email">
                banven100@gmail.com
              </MagneticLink>
              <div className="contact-links">
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                  <span className="contact-link-label">WhatsApp</span>
                  <span className="contact-link-val">+237 673 491 464</span>
                </a>
                <a href={GITHUB} target="_blank" rel="noopener noreferrer">
                  <span className="contact-link-label">GitHub</span>
                  <span className="contact-link-val">@BANVEN-subzero</span>
                </a>
                <a href={PHONE}>
                  <span className="contact-link-label">Phone</span>
                  <span className="contact-link-val">+237 673 491 464</span>
                </a>
                <a href={CV} download="Nyuydze-Banven-Eric-Junior-CV.pdf">
                  <span className="contact-link-label">CV</span>
                  <span className="contact-link-val">Download PDF ↓</span>
                </a>
              </div>
              <p className="contact-loc">Yaoundé · Cameroon</p>
            </div>
          </ScaleIn>
        </section>

        {/* Footer */}
        <footer className="footer">
          <span>© {new Date().getFullYear()} Nyuydze Banven Eric Junior</span>
          <span className="footer-rule" />
          <span className="footer-meta">Built in Yaoundé · Software engineering portfolio</span>
        </footer>
      </main>
    </div>
  );
}
