import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/theme-toggle";
import { getUser } from "~/lib/auth/require-auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Returns user or null (does NOT redirect) so landing page is public
  const user = await getUser(request);
  return { user };
}

// NOTE: This keeps the original section structure but upgrades styles, semantics,
// content quality, and introduces smooth-scroll + active section highlighting.

export function meta() {
  return [
    { title: "Your SaaS - Modern Infrastructure" },
    {
      name: "description",
      content: "Build, deploy, and scale with confidence.",
    },
  ];
}

// Placeholder sections; later replace with 21st.dev component imports.
export default function LandingPage() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div
      className="relative min-h-dvh w-full bg-background dark:bg-black"
      data-landing
    >
      {/* Ocean Abyss Background with Top Glow (dark mode only) */}
      <div className="absolute inset-0 z-0 hidden dark:block pointer-events-none dark:bg-black bg-ocean-abyss" />
      {/* Foreground content */}
      <div className="relative z-10 flex flex-col min-h-dvh scroll-smooth">
        <NavBar user={user} />
        <Hero />
        <LogoCloud />
        <Features />
        <OutcomesStats />
        <HowItWorks />
        <WhyChoose />
        <Integrations />
        <Testimonials />
        <Pricing />
        <FAQ />
        <BottomCTA />
        <SiteFooter />
      </div>
    </div>
  );
}

function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={"px-4 md:px-8 lg:px-12 py-16 md:py-24 " + className}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

function NavBar({ user }: { user: any }) {
  const sections = React.useMemo(
    () => [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
    []
  );
  const [active, setActive] = React.useState<string>("");
  const isAuthed = !!user;
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.href.slice(1));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  // Smooth scroll for internal nav links (fallback for browsers without CSS smooth-scroll or to offset adjustments later)
  const onNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = (e.currentTarget.getAttribute("href") || "").trim();
    if (href.startsWith("#")) {
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        window.scrollTo({ top: el.offsetTop - 64, behavior: "smooth" });
        history.replaceState(null, "", href); // update hash without extra jump
      }
    }
  };
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur border-b bg-background/70 supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 items-center gap-6 px-4 md:px-8 max-w-6xl">
        <div className="font-semibold tracking-tight">YourSaaS</div>
        <nav className="hidden md:flex gap-1 text-sm">
          {sections.map(({ label, href }) => {
            const isActive = active && href === `#${active}`;
            return (
              <a
                key={href}
                href={href}
                onClick={onNavClick}
                className={
                  "px-3 py-1.5 rounded-md transition-colors " +
                  (isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40")
                }
              >
                {label}
              </a>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {isAuthed ? (
            <Button asChild>
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
              <Button asChild>
                <Link to="/login">Get Started</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <Section id="hero" className="pt-24 md:pt-32 pb-12 text-center">
      <div className="mx-auto max-w-3xl space-y-7">
        <p className="text-xs font-medium uppercase tracking-wider text-primary/80 flex items-center justify-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          Trusted by 2,000+ engineering & ops teams
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 text-transparent bg-clip-text">
          Ship infrastructure-heavy SaaS 10× faster
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
          Abstract away auth, multi-tenant data, rate limits, billing events &
          auditable actions—focus every sprint on what differentiates your
          product.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <Button asChild size="lg" className="px-7">
            <Link to="/login">Start Free Trial</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-7">
            <Link to="/login">Book Demo</Link>
          </Button>
        </div>
        <div className="mt-10 aspect-video w-full rounded-xl border bg-gradient-to-br from-muted to-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
            Product Preview Placeholder
          </div>
        </div>
      </div>
    </Section>
  );
}

function LogoCloud() {
  return (
    <Section id="logos" className="py-12">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-8 place-items-center opacity-70">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded bg-muted" />
        ))}
      </div>
    </Section>
  );
}

function Features() {
  const list = [
    {
      title: "Unified Auth",
      desc: "Password, OAuth, magic links & org membership handled server-side.",
    },
    {
      title: "Multi‑Tenant Data",
      desc: "Row‑level isolation patterns baked into your data layer.",
    },
    {
      title: "Events & Audits",
      desc: "Structured event bus + append‑only audit trails for compliance.",
    },
    {
      title: "Usage & Billing Hooks",
      desc: "Emit metered usage events that billing providers can ingest.",
    },
  ];
  return (
    <Section id="features">
      <HeaderEyebrow
        title="Features"
        subtitle="Each block removes a week of boilerplate."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {list.map((f, i) => (
          <div
            key={f.title}
            className="group rounded-xl border p-6 bg-card/40 hover:bg-card transition-colors relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-primary/5 to-primary/0" />
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary">
                {i + 1}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
            <div className="mt-5 h-28 rounded-md border border-dashed flex items-center justify-center text-[10px] text-muted-foreground">
              Diagram / code sample
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function OutcomesStats() {
  const stats = ["55%", "55%", "55%", "55%", "55%"];
  return (
    <Section id="outcomes" className="pt-0">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
        {stats.map((s, i) => (
          <div key={i} className="space-y-2">
            <div className="text-2xl font-semibold">{s}</div>
            <p className="text-xs text-muted-foreground">Data {i + 1}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Install & Connect",
      body: "Add the SDK, point to your Postgres, run one command to scaffold tables.",
    },
    {
      title: "Model Your Domain",
      body: "Generate tenant, user, org & event helpers—extend with your own logic.",
    },
    {
      title: "Ship Product Faster",
      body: "Auth, tenancy, metrics & audits fade into the background; build differentiators.",
    },
  ];
  return (
    <Section id="how-it-works">
      <HeaderEyebrow
        title="How It Works"
        subtitle="Three steps—production ready from day one."
      />
      <ol className="mt-12 grid gap-6 md:grid-cols-3 list-none counter-reset:step">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="relative rounded-xl border p-6 flex flex-col gap-3 bg-card/40"
          >
            <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {i + 1}
            </div>
            <h3 className="font-medium tracking-tight">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {s.body}
            </p>
            <div className="mt-2 h-20 rounded-md bg-muted/60 border text-[10px] flex items-center justify-center text-muted-foreground">
              CLI / Code snippet
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function WhyChoose() {
  const points = ["Title", "Title", "Title", "Title"];
  return (
    <Section id="why-us">
      <HeaderEyebrow
        title="Why Choose Us"
        subtitle="Make your strengths obvious."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-4">
        {points.map((p, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <div className="h-8 w-8 rounded-full bg-primary/10" />
            <h3 className="font-medium">{p}</h3>
            <p className="text-xs text-muted-foreground">
              Short supporting explanation of the win.
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Integrations() {
  return (
    <Section id="integrations" className="pt-0">
      <HeaderEyebrow
        title="Integrations"
        subtitle="It plays nice with your stack."
      />
      <div className="mt-10 grid grid-cols-3 md:grid-cols-6 gap-8 place-items-center opacity-70">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded bg-muted" />
        ))}
      </div>
    </Section>
  );
}

function Testimonials() {
  return (
    <Section id="testimonials">
      <HeaderEyebrow
        title="What Customers Say"
        subtitle="Users can sell your product better than you."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3 bg-card/50">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, r) => (
                <div key={r} className="h-3 w-3 rounded-full bg-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              “Short compelling testimonial snippet that focuses on tangible
              outcome.”
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="text-xs">
                <div className="font-medium">Name</div>
                <div className="text-muted-foreground">Country</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Pricing() {
  const [annual, setAnnual] = React.useState(true);
  const tiers = [
    {
      name: "Starter",
      monthly: 0,
      annual: 0,
      tagline: "Local & dev usage",
      features: [
        "Unlimited dev tenants",
        "Auth providers",
        "Audit trail",
        "Rate limits",
      ],
    },
    {
      name: "Pro",
      monthly: 69,
      annual: 49,
      tagline: "For production scale",
      highlight: true,
      features: [
        "Everything in Starter",
        "Usage events API",
        "Org roles",
        "Fine‑grained webhooks",
      ],
    },
    {
      name: "Scale",
      monthly: 129,
      annual: 99,
      tagline: "Advanced compliance",
      features: [
        "Everything in Pro",
        "Dedicated region",
        "SLA & support",
        "Custom retention",
      ],
    },
  ];
  return (
    <Section id="pricing">
      <HeaderEyebrow
        title="Pricing"
        subtitle="Predictable usage‑aligned pricing."
      />
      <div className="mt-8 flex items-center justify-center gap-3 text-xs">
        <span className={!annual ? "font-medium" : "text-muted-foreground"}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual((v) => !v)}
          className="relative inline-flex h-6 w-11 items-center rounded-full border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Toggle annual pricing"
        >
          <span
            className={
              "inline-block h-4 w-4 transform rounded-full bg-primary shadow transition-transform " +
              (annual ? "translate-x-6" : "translate-x-1")
            }
          />
        </button>
        <span className={annual ? "font-medium" : "text-muted-foreground"}>
          Annual (save ~30%)
        </span>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => {
          const price = annual ? t.annual : t.monthly;
          return (
            <div
              key={t.name}
              className={
                "rounded-xl border p-6 flex flex-col gap-5 bg-card/40 " +
                (t.highlight
                  ? "border-primary shadow-sm relative ring-1 ring-primary/20"
                  : "")
              }
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] tracking-wide font-medium shadow">
                  MOST POPULAR
                </div>
              )}
              <div className="space-y-1">
                <h3 className="font-semibold tracking-tight">{t.name}</h3>
                <p className="text-xs text-muted-foreground">{t.tagline}</p>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold tracking-tight">
                  {price === 0 ? "Free" : `$${price}`}
                </span>
                {price !== 0 && (
                  <span className="text-xs text-muted-foreground mb-1">
                    /mo
                  </span>
                )}
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary">✔</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={t.highlight ? "default" : "outline"}
                className="mt-auto"
              >
                <Link to="/login">
                  {t.highlight ? "Start Now" : "Get Started"}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function FAQ() {
  const faqs = ["Question 1", "Question 2", "Question 3", "Question 4"];
  return (
    <Section id="faq">
      <HeaderEyebrow
        title="FAQ"
        subtitle="Handle objections before they happen."
      />
      <div className="mt-8 space-y-3">
        {faqs.map((q, i) => (
          <details
            key={i}
            className="group rounded-lg border p-4 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
              {q}
              <span className="transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="mt-2 text-xs text-muted-foreground">
              Concise, reassuring answer that reinforces value and removes
              friction.
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

function BottomCTA() {
  return (
    <Section id="cta" className="pt-0">
      <div className="grid gap-8 md:grid-cols-2 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold">CTA Heading</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Reiterate the core value in a distinct way—then guide users to take
            the next action.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              to="/login"
              className="inline-flex items-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Primary CTA
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-md border px-5 py-2 text-sm font-medium hover:bg-accent"
            >
              Secondary CTA
            </Link>
          </div>
        </div>
        <div className="aspect-video w-full rounded-xl border bg-muted" />
      </div>
    </Section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t py-10 mt-8">
      <div className="mx-auto max-w-6xl px-4 md:px-8 flex flex-col gap-8 text-sm">
        <div className="flex flex-wrap gap-8 justify-between">
          <div className="space-y-2 max-w-xs">
            <div className="font-semibold">YourSaaS</div>
            <p className="text-xs text-muted-foreground">
              Short positioning statement about your platform.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-2">
              <div className="font-medium">Product</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  <a href="#features" className="hover:underline">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:underline">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#why-us" className="hover:underline">
                    Why Us
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Company</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  <a href="#" className="hover:underline">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function HeaderEyebrow({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-4 text-center max-w-2xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm md:text-base text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
