"use client";

import { useState } from "react";
import Field from "@/components/field";

const R2 = "https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf";

interface Card {
  src: string;
  title: string;
  sub: string;
  r1: string;
  r2: string;
}

const CARDS: Card[] = [
  {
    src: `${R2}/oraciteslArea.mp4`,
    title: "CULTIA",
    sub: "Cultural heritage",
    r1: "Python · Flask",
    r2: "AI chatbot · SQLite",
  },
  {
    src: `${R2}/facet-glass-hero.mp4`,
    title: "MEDISCAN AI",
    sub: "Health information",
    r1: "Concept · AI",
    r2: "Informational tool",
  },
  {
    src: `${R2}/stellarmind-hero.mp4`,
    title: "TRYONS",
    sub: "AR e-commerce",
    r1: "Node.js · Express",
    r2: "MongoDB · Tailwind",
  },
  {
    src: `${R2}/thedropthroughArea.mp4`,
    title: "U-TRUST",
    sub: "Expense tracker",
    r1: "Personal finance",
    r2: "FCFA default",
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

export default function Home() {
  const [active, setActive] = useState(0);

  return (
    <>
      <Field />
      <div className="ui">
        <header className="brand blend">
          <svg
            width="40"
            height="40"
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
          <div className="brand-text">
            <h1>Banven</h1>
            <p>Software engineering</p>
          </div>
        </header>

        <div className="counter blend" aria-label="4 featured projects">
          04
        </div>

        <nav className="tags blend" aria-label="Skill filters">
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

        <aside className="list" aria-label="Selected projects">
          {CARDS.map((card) => (
            <article className="card" key={card.title}>
              <div className="thumb">
                <video
                  src={card.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
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
        </aside>

        <aside className="about blend" aria-label="Profile and contact">
          <img
            className="portrait"
            src="/portrait.png"
            alt="Portrait of Nyuydze Banven Eric Junior"
            width="112"
            height="140"
          />

          <section>
            <h2>[profile]</h2>
            <p>
              Software engineering master&apos;s student at the College of
              Technology, University of Buea. Interested in practical,
              user-focused software: cultural preservation, personal finance,
              e-commerce, and access to understandable information.
            </p>
            <p>
              Two internship periods at Digimark Consulting SARL, working
              across C++, HTML, CSS, JavaScript, Java and Python on responsive
              frontends and backend integration for the TryOns AR e-commerce
              project.
            </p>
          </section>

          <section>
            <h2>[education]</h2>
            <ul>
              <li>
                Master&apos;s Programme in Software Engineering — College of
                Technology, University of Buea (currently enrolled)
              </li>
              <li>
                Bachelor of Technology in Software Engineering — University of
                Buea (GPA 3.40)
              </li>
              <li>
                Software / Web Development Intern — Digimark Consulting SARL
                (Jul–Sep 2024 · Jul–Sep 2025)
              </li>
            </ul>
          </section>

          <section>
            <h2>[stack]</h2>
            <ul>
              <li>Python · JavaScript · Java · C++</li>
              <li>HTML · CSS · Tailwind CSS · Node.js · Express</li>
              <li>Flask · SQLite · MongoDB</li>
              <li>AI API integration (Gemini · OpenAI) · Figma · LabVIEW</li>
            </ul>
          </section>

          <section>
            <h2>[contact]</h2>
            <a href="mailto:banven100@gmail.com">Mail -&gt; banven100@gmail.com</a>
            <a
              href="https://github.com/BANVEN-subzero"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub -&gt; github.com/BANVEN-subzero
            </a>
            <a href="tel:+237673491464">Phone -&gt; +237 673 491 464</a>
            <a
              href="/Nyuydze-Banven-Eric-Junior-CV.pdf"
              download="Nyuydze-Banven-Eric-Junior-CV.pdf"
            >
              CV -&gt; download (pdf)
            </a>
            <p className="loc">Yaoundé, Cameroon</p>
          </section>
        </aside>
      </div>
    </>
  );
}
