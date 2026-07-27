import * as React from "react";
import { Link } from "react-router";

export default function WireframeC() {
  return (
    <div className="min-h-screen bg-[rgba(250,250,251,1)] text-foreground">
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center gap-4">
        <div className="font-semibold tracking-tight">Seestem.dev</div>
        <nav className="ml-auto flex gap-4 text-sm text-muted-foreground">
          <Link to="/wireframes/a">Wireframe A</Link>
          <Link to="/wireframes/b">Wireframe B</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="text-xs font-medium uppercase text-teal-600">Outcomes</p>
        <h1 className="mt-4 text-4xl font-bold">We design, build, and operate production AI</h1>
        <p className="mt-4 text-muted-foreground">Launch initiatives that move the business needle—MVP to scale with practices and guarantees.</p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button className="rounded bg-teal-600 px-6 py-3 text-white">See case studies</button>
          <button className="rounded border px-6 py-3">Start a project</button>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6">
          <div className="rounded border p-6">Launch</div>
          <div className="rounded border p-6">Operate</div>
          <div className="rounded border p-6">Scale</div>
        </div>
      </main>
    </div>
  );
}
