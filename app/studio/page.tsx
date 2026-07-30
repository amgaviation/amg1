import dynamic from "next/dynamic";
import { BRAND, NAV_LINKS, PORTFOLIO, QUOTE_MAILTO, TAGLINE } from "@/lib/studio/brand";
import { StudioCursor } from "./_components/cursor";
import { GearPanel, GearSequence } from "./_components/gear";
import { HeroSceneMount } from "./_components/hero-scene-mount";
import { Magnetic } from "./_components/magnetic";
import { Reveal } from "./_components/reveal";
import { ScrollProgress } from "./_components/scroll-progress";
import { SiteNav } from "./_components/site-nav";

/**
 * The three heaviest client components all live below the fold, so they are
 * code-split out of the initial bundle. `ssr` stays on (the default), which is
 * the point: their markup is still in the served HTML — so they work without JS
 * and are readable to crawlers — but their JavaScript is a separate chunk that
 * does not sit between the browser and the hero's first paint.
 */
const BookingDemo = dynamic(() =>
  import("./_components/booking-demo").then((m) => m.BookingDemo),
);
const OpsDemo = dynamic(() => import("./_components/ops-demo").then((m) => m.OpsDemo));
const ContactForm = dynamic(() =>
  import("./_components/contact-form").then((m) => m.ContactForm),
);

/**
 * 3 Green Studios — the whole site, one route.
 *
 * Content rules this page is built under (from the brief, and they are hard
 * rules): no invented metrics, no fake testimonials or client logos, no "trusted
 * by", no counts, no pricing. AMG Aviation Group is the one real client. The two
 * demo panels are labelled sample data in their own headers. If a number is not
 * something Tony can stand behind, it is not on this page.
 */

const AUDIENCE = [
  "Flight schools",
  "FBOs",
  "MROs & repair stations",
  "DPEs & instructors",
  "Aircraft detailers",
  "Part 91 flight departments",
  "Aviation service businesses",
];

const SERVICES = [
  {
    code: "01",
    title: "Marketing websites",
    body: "The public site: fast on a phone, clear about what you do, and written so a first-time caller already knows whether you can help them.",
    meta: ["Next.js", "Copy + structure", "SEO basics"],
  },
  {
    code: "02",
    title: "Online booking & scheduling",
    body: "Aircraft, instructors, sim time, shop bays. Availability rules, blackout dates, minimum notice, cancellations, reminders — the parts that make a scheduler survive contact with a busy week.",
    meta: ["Resource calendars", "Rules & conflicts", "Email reminders"],
  },
  {
    code: "03",
    title: "Client & member portals",
    body: "Logins for students, owners, crew, or partners. Documents, currency, work in progress, and invoices in one place — and each role only sees its own.",
    meta: ["Role-based access", "Documents", "Status views"],
  },
  {
    code: "04",
    title: "Payments & billing",
    body: "Stripe done properly: checkout, subscriptions, invoices, receipts, refunds, failed-payment retries. Money that reconciles is not a feature you bolt on later.",
    meta: ["Stripe Checkout", "Subscriptions", "Invoices & receipts"],
  },
  {
    code: "05",
    title: "Ops dashboards & admin tools",
    body: "The internal screens your team actually lives in — squawks, work orders, blocks, utilisation, who owes what. Built for the person doing the job, not for a screenshot.",
    meta: ["Data tables", "Filters & exports", "Audit trails"],
  },
  {
    code: "06",
    title: "Care plans",
    body: "Flat-rate maintenance after launch: updates, backups, uptime checks, and small changes without a fresh quote every time you want a page edited.",
    meta: ["Updates & backups", "Uptime checks", "Small changes included"],
  },
];

const PROCESS = [
  {
    code: "01",
    title: "Scope",
    body: "A call about how you actually operate, then a written fixed-scope quote within two business days: what is included, what is not, and what it costs. No hourly surprises.",
  },
  {
    code: "02",
    title: "Build",
    body: "You get a clickable preview URL early, and it updates as work lands. You can see the thing taking shape instead of waiting a month for a reveal.",
  },
  {
    code: "03",
    title: "Verify",
    body: "Every release is tested before handoff — forms, payments, permissions, keyboard access, and the small screen widths your customers are actually on.",
  },
  {
    code: "04",
    title: "Maintain",
    body: "Take an optional care plan, or take the keys. Either way the code is yours and there is no lock-in on the hosting.",
  },
];

const WHY = [
  {
    title: "You won't spend the first call explaining your business",
    body: "Squawks, currency, work orders, blocks, hobbs and tach, MEL deferrals, 100-hour and annual timing — these are the nouns the software has to be built around, and they are already familiar here.",
  },
  {
    title: "A pilot who ships production software",
    body: "The founder flies and writes the code. That means the operational edge cases get designed in, not discovered by your front desk three weeks after launch.",
  },
  {
    title: "Tested before it reaches you",
    body: "Every release goes through a pass on forms, payments, role permissions, keyboard access, and mobile widths before handoff. The list is the same every time, which is the point.",
  },
  {
    title: "One studio, one point of contact",
    body: "You work with the person who builds it. Nothing gets lost between an account manager, a designer, and an offshore dev team, because there aren't any.",
  },
];

const AMG_BUILT = [
  "Public marketing site",
  "Multi-role operations portal — client, crew, and partner workspaces",
  "Crew credential management",
  "Mission workflows and document handling",
  "Stripe subscriptions and invoicing",
];

const AMG_STACK = ["Next.js", "React", "Supabase", "Stripe", "Vercel"];

// Baked at build time. A one-page marketing site is rebuilt on every deploy, so
// this stays current without shipping a clock to the client.
const YEAR = new Date().getFullYear();

export default function StudioPage() {
  return (
    <main className="studio-root" id="top">
      <a href="#hero-copy" className="s-skip">
        Skip to content
      </a>

      <ScrollProgress />
      <StudioCursor />
      <SiteNav />

      {/* ---------------------------------------------------------------- hero */}
      <GearSequence className="s-hero">
        <HeroSceneMount />

        <div className="s-shell s-hero-inner">
          <div className="s-hero-copy" id="hero-copy">
            {/* One template literal, not `{BRAND.name} · …`: JSX drops the
                leading space of a text node that follows an expression, which
                renders as "3 Green Studios· Aviation". */}
            <p className="s-eyebrow">{`${BRAND.name} · Aviation web & software`}</p>

            <h1 className="s-display s-hero-title">
              Websites, booking, and billing
              <br />
              <span className="s-hero-title-accent">built for aviation businesses.</span>
            </h1>

            <p className="s-hero-sub">
              Flight schools, FBOs, MROs, DPEs, detailers, and small flight
              departments. Marketing sites, online scheduling, client portals,
              Stripe payments, and the ops dashboards that hold the whole thing
              together.
            </p>

            <div className="s-hero-cta s-settle">
              <Magnetic>
                <a href={QUOTE_MAILTO} className="s-btn s-btn--primary">
                  Get a fixed quote
                </a>
              </Magnetic>
              <Magnetic>
                <a href="#work" className="s-btn s-btn--ghost">
                  See the work
                </a>
              </Magnetic>
            </div>

            <p className="s-hero-fine">
              Fixed-scope quotes in two business days. You work with the person who
              builds it.
            </p>
          </div>

          <div className="s-hero-panel">
            <div className="s-hud s-hero-gear">
              <p className="s-mono s-hero-gear-head">Gear position</p>
              <GearPanel />
              <p className="s-mono s-hero-tagline">{TAGLINE}</p>
            </div>
          </div>
        </div>
      </GearSequence>

      {/* ------------------------------------------------------- who we serve */}
      <section className="s-section s-serve" id="serve" aria-labelledby="serve-title">
        <div className="s-shell">
          <h2 className="s-eyebrow" id="serve-title">
            Who we serve
          </h2>
        </div>
        <div className="s-marquee" aria-hidden="true">
          {/* Two identical tracks so the loop has no seam. Content is duplicated
              for the animation only, which is why the row is aria-hidden and the
              real list follows below for assistive tech. */}
          {[0, 1].map((track) => (
            <div className="s-marquee-track" key={track}>
              {AUDIENCE.map((item) => (
                <span className="s-chip" key={`${track}-${item}`}>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
        <ul className="s-vh">
          {AUDIENCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------ services */}
      <section className="s-section" id="services" aria-labelledby="services-title">
        <div className="s-shell s-sticky-grid">
          <div className="s-sticky-head">
            <p className="s-eyebrow">Services</p>
            <h2 className="s-display s-h2" id="services-title">
              Six things, done properly.
            </h2>
            <p className="s-body-muted">
              Most jobs are one or two of these. A few are all six. Either way the
              quote is fixed before anything gets built.
            </p>
            <div className="s-rule" />
          </div>

          <div className="s-service-grid">
            {SERVICES.map((service, index) => (
              // The reveal lives on the wrapper, not the card: both animate
              // `transform`, and stacking them on one element makes the hover
              // lift fight the entrance.
              <Reveal key={service.code} delay={index * 60}>
                <div className="s-card">
                  <p className="s-mono s-card-code">{service.code}</p>
                  <h3 className="s-card-title">{service.title}</h3>
                  <p className="s-card-body">{service.body}</p>
                  <ul className="s-card-meta">
                    {service.meta.map((meta) => (
                      <li className="s-mono" key={meta}>
                        {meta}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- case study */}
      <section className="s-section" id="work" aria-labelledby="work-title">
        <div className="s-shell">
          <Reveal>
            <p className="s-eyebrow">Flagship case study</p>
            <h2 className="s-display s-h2" id="work-title">
              {PORTFOLIO.client}
            </h2>
            <p className="s-case-lede">
              A public marketing site plus a multi-role operations portal, running
              on one codebase.
            </p>
          </Reveal>

          <Reveal delay={80} className="s-case-grid">
            <div className="s-case-block">
              <h3 className="s-mono s-case-label">The problem</h3>
              <p>
                Three audiences — clients, crew, and partners — each needing a
                different view of the same operational data, plus quoting, crew
                credential paperwork, mission documents, and recurring billing
                that all have to reconcile with each other.
              </p>
            </div>

            <div className="s-case-block">
              <h3 className="s-mono s-case-label">What was built</h3>
              <ul className="s-case-list">
                {AMG_BUILT.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="s-case-block">
              <h3 className="s-mono s-case-label">Stack</h3>
              <ul className="s-stack-row">
                {AMG_STACK.map((tech) => (
                  <li className="s-chip" key={tech}>
                    {tech}
                  </li>
                ))}
              </ul>
            </div>

            <div className="s-case-block">
              <h3 className="s-mono s-case-label">Outcome</h3>
              <p>
                One codebase covers both the public site and the portal. Client,
                crew, and partner workspaces are separated by role; crew
                credentials, mission paperwork, and Stripe subscriptions run
                through the same data rather than three disconnected tools. It is
                live in production.
              </p>
              <p className="s-case-honesty">
                Built and operated by the studio&rsquo;s founder — we run what we
                build. No usage numbers, revenue figures, or testimonials are
                published here: if a metric isn&rsquo;t one we can stand behind,
                it doesn&rsquo;t go on the page.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="s-case-foot">
            <a
              className="s-link s-case-link"
              href={PORTFOLIO.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit {PORTFOLIO.host}
              <span aria-hidden="true">↗</span>
              <span className="s-vh">(opens in a new tab)</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- demos */}
      <section className="s-section" id="demos" aria-labelledby="demos-title">
        <div className="s-shell">
          <Reveal className="s-demos-head">
            <p className="s-eyebrow">Live demos</p>
            <h2 className="s-display s-h2" id="demos-title">
              Don&rsquo;t take our word for it. Click something.
            </h2>
            <p className="s-body-muted">
              These are not screenshots. Both panels run in your browser, right
              now, on invented data — the same kind of components we ship, minus a
              real client&rsquo;s records. Keyboard works everywhere.
            </p>
          </Reveal>

          <div className="s-demo-grid">
            <Reveal delay={60}>
              <BookingDemo />
            </Reveal>
            <Reveal delay={120}>
              <OpsDemo />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- process */}
      <section className="s-section" id="process" aria-labelledby="process-title">
        <div className="s-shell s-sticky-grid">
          <div className="s-sticky-head">
            <p className="s-eyebrow">Process</p>
            <h2 className="s-display s-h2" id="process-title">
              Scope, build, verify, maintain.
            </h2>
            <p className="s-body-muted">
              Four steps, in that order, every time. The checklist is boring on
              purpose — that is what makes a handoff predictable.
            </p>
            <div className="s-rule" />
          </div>

          <ol className="s-step-list">
            {PROCESS.map((step, index) => (
              <Reveal as="li" key={step.code} delay={index * 70} className="s-step">
                <span className="s-mono s-step-code" aria-hidden="true">
                  {step.code}
                </span>
                <div>
                  <h3 className="s-step-title">{step.title}</h3>
                  <p className="s-card-body">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------------- why */}
      <section className="s-section" id="why" aria-labelledby="why-title">
        <div className="s-shell">
          <Reveal>
            <p className="s-eyebrow">Why an aviation studio</p>
            <h2 className="s-display s-h2" id="why-title">
              A generalist agency has to learn your industry on your budget.
            </h2>
          </Reveal>

          <div className="s-why-grid">
            {WHY.map((item, index) => (
              <Reveal key={item.title} delay={index * 60} className="s-why-item">
                <h3 className="s-why-title">{item.title}</h3>
                <p className="s-card-body">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- contact */}
      <section className="s-section s-contact" id="contact" aria-labelledby="contact-title">
        <div className="s-shell s-contact-grid">
          <Reveal className="s-contact-copy">
            <p className="s-eyebrow">Contact</p>
            <h2 className="s-display s-h2" id="contact-title">
              Cleared to build.
            </h2>
            <p className="s-body-muted">
              Tell us what you run and what it has to do. You get a fixed-scope
              quote within two business days — a real number against a written
              scope, not a range and a discovery invoice.
            </p>

            <dl className="s-contact-facts">
              <div>
                <dt className="s-mono">Email</dt>
                <dd>
                  <a className="s-link" href={`mailto:${BRAND.email}`}>
                    {BRAND.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="s-mono">Based</dt>
                <dd>{BRAND.locationLong}</dd>
              </div>
              <div>
                <dt className="s-mono">Turnaround</dt>
                <dd>Fixed-scope quote in two business days</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={80} className="s-hud s-contact-panel">
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="s-footer">
        <div className="s-shell s-footer-inner">
          <div>
            <p className="s-footer-mark">
              <span className="s-nav-pips s-nav-pips--static" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {BRAND.name}
            </p>
            <p className="s-footer-note">{BRAND.locationLong}</p>
          </div>

          <nav className="s-footer-links" aria-label="Footer">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
          </nav>

          <p className="s-mono s-footer-year">© {YEAR} {BRAND.name}</p>
        </div>
      </footer>
    </main>
  );
}
