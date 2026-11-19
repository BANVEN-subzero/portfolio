"use client";

import { useState } from "react";
import Field from "@/components/field";

interface Card {
  src: string;
  title: string;
  sub: string;
  r1: string;
  r2: string;
  alt: string;
}

const CARDS: Card[] = [
  {
    src: "/projects/cultia.jpg?v=2",
    title: "CULTIA",
    sub: "Cultural heritage",
    r1: "Python · Flask",
    r2: "AI chatbot · SQLite",
    alt: "Cameroonian cultural heritage artefacts on a dark museum display — CULTIA project thumbnail",
  },
  {
    src: "/projects/mediscan.jpg?v=2",
    title: "MEDISCAN AI",
    sub: "Health information",
    r1: "Concept · AI",
    r2: "Informational tool",
    alt: "Dark-mode medical information app concept with AI neural overlay — MEDISCAN AI project thumbnail",
  },
  {
    src: "/projects/tryons.jpg?v=2",
    title: "TRYONS",
    sub: "AR e-commerce",
    r1: "Node.js · Express",
    r2: "MongoDB · Tailwind",
    alt: "Augmented reality furniture preview on a smartphone — TRYONS AR e-commerce project thumbnail",
  },
  {
    src: "/projects/utrust.jpg?v=2",
    title: "U-TRUST",
    sub: "Expense tracker",
    r1: "Personal finance",
    r2: "FCFA default",
    alt: "Dark-mode personal finance app dashboard in FCFA — U-TRUST expense tracker project thumbnail",
  },
];

const TAGS = [
  "All",
  "Python",
  "JavaScript",
  "Java",
  "C++",
  "HTML/CSS",
  "Tailwind",
  "Node.js",
  "Flask",
  "AI",
];

const STAR_POINTS =
  "35,20 25.54,22.30 30.61,30.61 22.31,25.54 20,35 17.70,25.54 " +
  "9.39,30.61 14.46,22.30 5,20 14.46,17.70 9.39,9.39 17.70,14.46 " +
  "20,5 22.30,14.46 30.61,9.39 25.54,17.70";

const WHATSAPP = "https://wa.me/237673491464";
const MAIL = "mailto:banven100@gmail.com";
const GITHUB = "https://github.com/BANVEN-subzero";
const PHONE = "tel:+237673491464";
const CV = "/Nyuydze-Banven-Eric-Junior-CV.pdf";

const NAV = [
  { label: "Profile", href: "#profile" },
  { label: "Projects", href: "#projects" },
  { label: "Qualifications", href: "#qualifications" },
  { label: "Ambition", href: "#ambition" },
  { label: "Contact", href: "#connect" },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Field />
      <nav className="menu-bar blend" aria-label="Section navigation">
        <a className="menu-brand" href="#top" onClick={() => setMenuOpen(false)}>
          <svg
            width="26"
            height="26"
            viewBox="0 0 40 40"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx="20"
              cy="20"
              r="18.5"
              fill="none"
              stroke="white"
              strokeWidth="1.6"
            />
            <polygon points={STAR_POINTS} fill="white" />
          </svg>
          <span>BANVEN ERIC</span>
        </a>

        <ul className="menu-links" id="menu-links">
          {NAV.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="menu-right">
          <a className="menu-cv" href={CV} download="Nyuydze-Banven-Eric-Junior-CV.pdf">
            CV ↓
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="menu-toggle-bar" data-open={menuOpen ? "true" : "false"} />
            <span className="menu-toggle-bar" data-open={menuOpen ? "true" : "false"} />
            <span className="menu-toggle-bar" data-open={menuOpen ? "true" : "false"} />
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

      <main className="page" id="top">
        {/* Hero */}
        <section className="hero" aria-label="Intro">
          <div className="hero-portrait-wrap">
            <img
              className="hero-portrait"
              src="/portrait.png?v=2"
              alt="Portrait of Nyuydze Banven Eric Junior"
              width="240"
              height="300"
            />
            <div className="hero-meta">
              <span className="hero-name">Nyuydze Banven Eric Junior</span>
              <span className="hero-role">Software Engineering · University of Buea</span>
              <span className="hero-loc">Yaoundé · Cameroon</span>
            </div>
          </div>
          <div className="hero-counter blend" aria-label="4 featured projects">
            <span className="hero-counter-num">04</span>
            <span className="hero-counter-label">Featured projects</span>
          </div>
        </section>

        {/* Tags */}
        <section className="tags-section" aria-label="Skill filters">
          <h2 className="section-title">[ stack filter ]</h2>
          <nav className="tags">
            {TAGS.map((tag, i) => (
              <button
                type="button"
                key={tag}
                className={i === active ? "chip active" : "chip"}
                onClick={() => setActive(i)}
              >
                {tag}
              </button>
            ))}
          </nav>
        </section>

        {/* Project grid */}
        <section className="projects-section" id="projects" aria-label="Selected projects">
          <h2 className="section-title">[ selected projects ]</h2>
          <div className="projects-grid">
            {CARDS.map((card) => (
              <article className="card" key={card.title}>
                <div className="thumb">
                  <img
                    src={card.src}
                    alt={card.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="meta">
                  <div className="l">
                    <span>{card.title}</span>
                    <span>{card.sub}</span>
                  </div>
                  <div className="r">
                    <span>{card.r1}</span>
                    <span>{card.r2}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Long-form content */}
        <section className="content" aria-label="Profile, projects, qualifications, contact">
          <section id="profile">
            <h2>[profile]</h2>
            <p>
              Nyuydze Banven Eric Junior. Software engineering master&apos;s
              student at the College of Technology, University of Buea,
              currently based in Yaoundé, Cameroon. My work sits at the
              intersection of practical software and real users: tools that
              help people preserve culture, manage money, shop online, and
              make sense of information that affects their health.
            </p>
            <p>
              My Bachelor of Technology in Software Engineering (University of
              Buea, GPA 3.40) gave me a base in algorithms, databases, and
              software design. The Master&apos;s programme pushes that further
              into distributed systems, AI integration, and engineering for
              low-bandwidth contexts — the reality most users in Central
              Africa actually live in.
            </p>
          </section>

          <section>
            <h2>[background]</h2>
            <p>
              Two internship periods at Digimark Consulting SARL (Jul–Sep
              2024 and Jul–Sep 2025) put me on the TryOns AR e-commerce
              project, where I worked across C++, HTML, CSS, JavaScript, Java
              and Python on responsive frontends and backend integration. It
              is where I learned that shipping software means picking the
              boring, correct tool over the impressive, fragile one.
            </p>
            <p>
              Outside of coursework and internships, I keep a side logbook
              of real-time rendering studies — the particle and fluid work
              running on this page is part of it. The studies are published
              as they are built and may not run on every device.
            </p>
          </section>

          <section>
            <h2>[currently]</h2>
            <ul>
              <li>
                Completing the Master&apos;s programme in Software Engineering
                at the College of Technology, University of Buea.
              </li>
              <li>
                Building side studies in real-time rendering and
                AI-assisted information tools for low-bandwidth contexts.
              </li>
              <li>
                Open to internship, collaboration, and junior engineering
                roles in web development, AI integration, or AR e-commerce.
              </li>
            </ul>
          </section>

          <section>
            <h2>[projects — detail]</h2>
            <p className="proj-name">CULTIA — cultural heritage platform</p>
            <p>
              Catalogues and surfaces Cameroonian cultural artefacts, stories,
              and languages. Built with Python and Flask; an AI chatbot
              answers visitor questions in natural language and persists
              conversations in SQLite. Designed for cultural institutions that
              need a lightweight, maintainable catalogue without a large IT
              team.
            </p>
            <p className="proj-name">MEDISCAN AI — health information tool</p>
            <p>
              Concept-stage tool that explains medical terms and common
              conditions in plain language. Not a diagnostic device; it
              translates clinical language into something a non-specialist
              can act on, with explicit disclaimers and pointers to local
              health services.
            </p>
            <p className="proj-name">TRYONS — AR e-commerce</p>
            <p>
              Lets shoppers preview products before purchase. Built on Node.js
              and Express with MongoDB for the catalogue and Tailwind for the
              UI. Worked on this across two internships at Digimark Consulting
              SARL — frontend integration, backend wiring, and AR preview
              plumbing.
            </p>
            <p className="proj-name">U-TRUST — personal expense tracker</p>
            <p>
              Designed for the FCFA economy. Tracks income, recurring spend,
              and savings goals without forcing users through bank integration
              they may not have. Offline-first, mobile-friendly, and built
              around the way people in Cameroon actually move money.
            </p>
          </section>

          <section id="qualifications">
            <h2>[qualifications]</h2>
            <ul>
              <li>
                Master&apos;s Programme in Software Engineering — College of
                Technology, University of Buea (in progress)
              </li>
              <li>
                Bachelor of Technology in Software Engineering — University of
                Buea (GPA 3.40)
              </li>
              <li>
                Software / Web Development Intern — Digimark Consulting SARL
                (Jul–Sep 2024)
              </li>
              <li>
                Software / Web Development Intern — Digimark Consulting SARL
                (Jul–Sep 2025)
              </li>
              <li>
                AI API integration — Gemini, OpenAI (applied in CULTIA and
                MEDISCAN AI)
              </li>
            </ul>
          </section>

          <section id="stack">
            <h2>[stack]</h2>
            <ul>
              <li>Languages — Python, JavaScript, Java, C++</li>
              <li>Web — HTML, CSS, Tailwind CSS, Node.js, Express</li>
              <li>Backend / Data — Flask, SQLite, MongoDB</li>
              <li>Integrations — AI APIs (Gemini, OpenAI), Figma, LabVIEW</li>
            </ul>
          </section>

          <section id="ambition">
            <h2>[ambition]</h2>
            <p>
              I want to build software that holds up — clean codebases,
              honest interfaces, tools that work on the devices and networks
              people actually have. My immediate plan is to finish the
              Master&apos;s, ship one or two of the side studies into
              something usable, and join a team doing meaningful web or AI
              work in Central Africa.
            </p>
            <p>
              Longer term, I want to contribute to open-source tooling for
              low-bandwidth contexts and eventually lead engineering for a
              product that matters to people here.
            </p>
          </section>

          <section id="connect">
            <h2>[connect]</h2>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              WhatsApp -&gt; +237 673 491 464
            </a>
            <a href={MAIL}>Mail -&gt; banven100@gmail.com</a>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">
              GitHub -&gt; github.com/BANVEN-subzero
            </a>
            <a href={PHONE}>Phone -&gt; +237 673 491 464</a>
            <a href={CV} download="Nyuydze-Banven-Eric-Junior-CV.pdf">
              CV -&gt; download (pdf)
            </a>
            <p className="loc">Yaoundé, Cameroon</p>
          </section>
        </section>

        {/* Sticky contact bar */}
        <nav className="contact-bar" aria-label="Quick contact">
          <a
            className="cbtn cbtn-wa"
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="cbtn-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.97.58 3.8 1.57 5.33L2 22l4.9-1.65a9.86 9.86 0 0 0 5.14 1.42h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.78 14.31c-.24.68-1.42 1.31-1.96 1.36-.5.05-1.13.21-3.7-.78-3.11-1.23-5.07-4.41-5.22-5.6-.15-1.19-.16-2.99 1.05-4.13.5-.47.97-.61 1.28-.62.32-.01.51-.01.74 0 .23.01.57-.09.89.69.32.78 1.07 2.68 1.16 2.87.09.19.16.41.04.66-.12.25-.18.41-.36.62-.18.21-.38.47-.55.63-.18.18-.37.37-.16.71.21.34.91 1.5 1.96 2.43 1.34 1.19 2.47 1.56 2.81 1.73.34.18.55.15.74-.09.19-.25.81-.94 1.03-1.26.21-.32.41-.27.71-.16.3.11 1.89.89 2.21 1.06.32.18.55.27.62.41.07.15.07.83-.17 1.51z" />
              </svg>
            </span>
            <span className="cbtn-label">WhatsApp</span>
          </a>
          <a className="cbtn" href={MAIL}>
            <span className="cbtn-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="1" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </span>
            <span className="cbtn-label">Mail</span>
          </a>
          <a
            className="cbtn"
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="cbtn-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.27-1.7-1.27-1.7-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.93 10.93 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
              </svg>
            </span>
            <span className="cbtn-label">GitHub</span>
          </a>
          <a className="cbtn" href={PHONE}>
            <span className="cbtn-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <span className="cbtn-label">Call</span>
          </a>
          <a
            className="cbtn cbtn-cv"
            href={CV}
            download="Nyuydze-Banven-Eric-Junior-CV.pdf"
          >
            <span className="cbtn-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
            </span>
            <span className="cbtn-label">Download CV</span>
          </a>
        </nav>

        {/* Footer spacer so contact bar never hides the last content */}
        <div className="footer-spacer" aria-hidden="true" />
      </main>
    </>
  );
}
