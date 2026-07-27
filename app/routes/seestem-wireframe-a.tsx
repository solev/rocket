import * as React from "react";
import { Link } from "react-router";

export default function WireframeA() {
  return (
    <div className="min-h-screen bg-[rgba(245,247,248,1)] text-foreground">
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center gap-4">
        <div className="font-semibold tracking-tight">Seestem.dev</div>
        <nav className="ml-auto flex gap-4 text-sm text-muted-foreground">
          <Link to="/seestem-wireframe-b">Wireframe B</Link>
          <Link to="/seestem-wireframe-c">Wireframe C</Link>
          <a href="#" className="underline">
            Contact
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-7">
            <p className="text-xs font-medium uppercase text-teal-600/90">Vision</p>
            <h1 className="mt-4 text-5xl font-bold leading-tight">
              AI Engineering for Product Teams
            </h1>
            <p className="mt-6 text-muted-foreground max-w-xl">
              We build production-grade AI systems, agents, and developer
              tooling that integrate with your stack and ship with tests,
              observability, and CI/CD.
            </p>

            <div className="mt-8 w-full max-w-lg space-y-3">
              <div className="rounded border bg-white p-4 font-mono text-sm text-slate-700">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">MACOS / LINUX</div>
                  <button className="text-xs text-teal-600">Copy</button>
                </div>
                <div className="mt-3">$ npm i @seestem/agent && npx seestem init</div>
              </div>

              <div className="flex gap-3">
                <button className="rounded bg-teal-600 px-5 py-2 text-white">Request a pilot</button>
                <button className="rounded border px-5 py-2">See docs</button>
              </div>
            </div>
          </div>

          <div className="col-span-5">
            <div className="h-64 rounded-lg border bg-white/60 flex items-center justify-center">
              {/* Placeholder for abstract teal-network SVG/animation */}
              <svg width="320" height="200" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="g" x1="0" x2="1">
                    <stop offset="0" stopColor="#00C2B3" stopOpacity="0.95" />
                    <stop offset="1" stopColor="#00C2B3" stopOpacity="0.35" />
                  </linearGradient>
                </defs>
                <g stroke="#CBD5DA" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 30h296" strokeOpacity="0.25" />
                  <path d="M12 70h296" strokeOpacity="0.25" />
                  <path d="M12 110h296" strokeOpacity="0.25" />
                  <circle cx="50" cy="30" r="5" fill="#00C2B3" />
                  <circle cx="140" cy="70" r="4" fill="#00C2B3" />
                  <circle cx="220" cy="110" r="6" fill="#00C2B3" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        <section className="mt-16">
          <h3 className="text-xl font-semibold">Core offerings</h3>
          <div className="mt-6 grid grid-cols-3 gap-6">
            <div className="rounded border p-6 bg-white/50">Agents & workflows</div>
            <div className="rounded border p-6 bg-white/50">SDK & integrations</div>
            <div className="rounded border p-6 bg-white/50">Observability & ops</div>
          </div>
        </section>
      </main>
    </div>
  );
}
