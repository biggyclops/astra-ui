import type { ReactNode } from "react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Atom,
  Bot,
  BrainCircuit,
  Command,
  Database,
  Gauge,
  Home,
  Lightbulb,
  Network,
  PlaySquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import "./intel.css";

type Tone = "cyan" | "blue" | "violet" | "amber" | "mint" | "pink";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
};

const navItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Explore", icon: Search },
  { label: "Agents", icon: Users },
  { label: "Jobs", icon: Atom },
  { label: "Media", icon: PlaySquare },
  { label: "Knowledge", icon: Database },
  { label: "Autonomy", icon: Network, href: "/autonomy" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const systems: Array<[string, string, LucideIcon]> = [
  ["Core", "Preview", ShieldCheck],
  ["Agents", "Example 7 / 7", Bot],
  ["Knowledge Graph", "Example", BrainCircuit],
  ["Autonomy", "Preview", Network],
  ["Global Sync", "Example", Gauge],
];

const tasks = [
  ["Index new research papers", "Example · running"],
  ["Generate media assets", "Example · queued"],
  ["Plan autonomous run", "Example · scheduled"],
] as const;

const activity = [
  ["Hermes", "Dispatched message", "2m ago"],
  ["Atlas", "Mapped 12 new connections", "14m ago"],
  ["Media", "Generated 4 assets", "37m ago"],
  ["Hades", "Completed analysis", "1h ago"],
  ["Mini-Beast", "Learned from session", "2h ago"],
] as const;

const agents: Array<[string, Tone]> = [
  ["Mini-Beast", "cyan"],
  ["Hades", "amber"],
  ["Atlas", "blue"],
  ["Hermes", "blue"],
  ["Phobos", "violet"],
  ["Media", "pink"],
  ["Autonomy", "mint"],
  ["Jobs", "amber"],
];

const kpis = [
  ["428K", "Knowledge Nodes", "↑ 12%"],
  ["1.3K", "Active Connections", "↑ 8%"],
  ["97", "Running Jobs", "↑ 24%"],
  ["7", "Active Agents", "—"],
] as const;

const output = [
  ["22:12", "Atlas", "Linked 3 related concepts"],
  ["22:11", "Media", "Generated visual asset"],
  ["22:10", "Mini-Beast", "Adapted model weights"],
  ["22:08", "Hades", "Identified conflicting data"],
  ["22:06", "Jobs", "Scheduled 8 new tasks"],
] as const;

const graphLabels: Array<[string, string, string, Tone, boolean]> = [
  ["Mini-Beast", "ADAPTIVE INTELLIGENCE", "mini-beast", "cyan", false],
  ["Hades", "ANALYSIS & TRUTH", "hades", "amber", true],
  ["Atlas", "KNOWLEDGE & CONTEXT", "atlas", "cyan", false],
  ["Hermes", "COMMUNICATION & FLOW", "hermes", "blue", true],
  ["Phobos", "SIMULATION & FORESIGHT", "phobos", "violet", false],
  ["Media", "CREATION & EXPRESSION", "media", "pink", false],
  ["Jobs", "TASKS & AUTOMATION", "jobs", "amber", true],
  ["Autonomy", "ACTION & CONTROL", "autonomy", "mint", true],
];

function Panel({
  title,
  children,
  action,
  className = "",
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`intel-panel ${className}`}>
      <div className="intel-panel__head">
        <h2 className="intel-panel__title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="intel-status">
      <span className="intel-status__icon">
        <Icon size={13} strokeWidth={1.7} />
      </span>
      <span className="intel-status__label">{label}</span>
      <span className="intel-status__value">
        <i className="intel-live-dot" aria-hidden="true" />
        {value}
      </span>
    </div>
  );
}

function KnowledgeGraph() {
  return (
    <section
      className="intel-graph"
      aria-label="Example Astra knowledge graph visualization"
    >
      <div className="intel-graph__orbit intel-graph__orbit--outer" aria-hidden="true" />
      <div className="intel-graph__orbit intel-graph__orbit--mid" aria-hidden="true" />
      <div className="intel-graph__orbit intel-graph__orbit--inner" aria-hidden="true" />
      <div className="intel-graph__glow" aria-hidden="true" />

      <p className="intel-graph__eyebrow">KNOWLEDGE</p>
      <p className="intel-graph__motto">A MORE CAPABLE TOMORROW</p>

      {graphLabels.map(([name, detail, slot, tone, rightAligned]) => (
        <div
          key={name}
          className={`intel-graph__label intel-graph__label--${tone} intel-graph__label--${slot}`}
        >
          <div className="intel-graph__beacon" aria-hidden="true" />
          <div className={rightAligned ? "intel-graph__copy intel-graph__copy--right" : "intel-graph__copy"}>
            <p className="intel-graph__name">{name}</p>
            <p className="intel-graph__detail">{detail}</p>
          </div>
        </div>
      ))}

      <div className="intel-graph__core">
        <img src="/astra-core-logo.png" alt="" className="intel-graph__core-mark" />
        <div className="intel-graph__core-ring" aria-hidden="true" />
        <p className="intel-graph__core-word">ASTRA</p>
        <p className="intel-graph__core-tag">
          UNDERSTAND
          <br />
          CONNECT
          <br />
          EXECUTE
        </p>
      </div>

      <p className="intel-graph__note">Static network graph placeholder · example data</p>
    </section>
  );
}

export default function Intel() {
  return (
    <div className="intel-shell">
      <div className="intel-shell__grid">
        <aside className="intel-nav" aria-label="Intel prototype navigation">
          <Link href="/" className="intel-brand" aria-label="Back to Astra home">
            <span className="intel-brand__mark">
              <img src="/astra-core-logo.png" alt="" />
            </span>
            <span className="intel-brand__text">
              <img src="/astra-wordmark.png" alt="ASTRA" className="intel-brand__wordmark" />
              <span className="intel-brand__tag">INTELLIGENCE IN MOTION</span>
            </span>
          </Link>

          <nav className="intel-nav__list" aria-label="Primary navigation">
            {navItems.map(({ label, icon: Icon, href }) => {
              const active = label === "Home";
              const className = `intel-nav__item${active ? " is-active" : ""}`;
              if (href) {
                return (
                  <Link key={label} href={href} className={className}>
                    <Icon size={17} strokeWidth={1.6} />
                    <span>{label}</span>
                  </Link>
                );
              }
              return (
                <button
                  key={label}
                  type="button"
                  className={className}
                  disabled
                  title="Prototype — not available"
                  aria-disabled="true"
                >
                  <Icon size={17} strokeWidth={1.6} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="intel-nav__meta">
            <p>Astra Intel prototype</p>
            <p>Example build</p>
            <p className="intel-nav__meta-status">
              <i aria-hidden="true" />
              Example data · not live telemetry
            </p>
          </div>
        </aside>

        <div className="intel-main">
          <header className="intel-header">
            <div className="intel-search" aria-label="Read-only prototype search">
              <Search size={17} />
              <span>Ask Astra anything…</span>
              <kbd>⌘ K</kbd>
            </div>
            <div className="intel-presence">
              <span className="intel-chip">PROTOTYPE · EXAMPLE DATA</span>
              <span className="intel-presence__live">
                <i className="intel-live-dot" aria-hidden="true" />
                Preview
              </span>
              <time dateTime="2025-04-24T22:14:00">Thu, Apr 24, 2025 · 22:14</time>
            </div>
          </header>

          <main className="intel-layout">
            <aside className="intel-rail intel-rail--left" aria-label="System overview">
              <Panel title="SYSTEM STATUS">
                <div className="intel-stack">
                  {systems.map(([label, value, icon]) => (
                    <StatusRow key={label} label={label} value={value} icon={icon} />
                  ))}
                </div>
              </Panel>

              <Panel
                title="ACTIVE TASKS"
                action={<span className="intel-chip intel-chip--quiet">3</span>}
              >
                <div className="intel-stack intel-stack--loose">
                  {tasks.map(([task, status]) => (
                    <div key={task} className="intel-task">
                      <span className="intel-task__spinner" aria-hidden="true" />
                      <div>
                        <p>{task}</p>
                        <small>{status}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="RECENT ACTIVITY">
                <div className="intel-stack intel-stack--loose">
                  {activity.map(([agent, detail, time]) => (
                    <div key={`${agent}-${detail}`} className="intel-activity">
                      <span className="intel-activity__icon" aria-hidden="true">
                        <Activity size={13} />
                      </span>
                      <div>
                        <p>{agent}</p>
                        <small>{detail}</small>
                      </div>
                      <time>{time}</time>
                    </div>
                  ))}
                </div>
              </Panel>
            </aside>

            <KnowledgeGraph />

            <aside className="intel-rail intel-rail--right" aria-label="Global intelligence metrics">
              <Panel
                title="GLOBAL INSIGHTS"
                action={<span className="intel-chip intel-chip--quiet">Example data</span>}
              >
                <div className="intel-kpis">
                  {kpis.map(([value, label, change]) => (
                    <div key={label} className="intel-kpi">
                      <div>
                        <p className="intel-kpi__value">{value}</p>
                        <p className="intel-kpi__label">{label}</p>
                      </div>
                      <div className="intel-kpi__meta">
                        <p>{change}</p>
                        <span className="intel-signal" aria-hidden="true" />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="AGENT HEALTH">
                <div className="intel-stack">
                  {agents.map(([name, tone]) => (
                    <div key={name} className="intel-health">
                      <i className={`intel-dot intel-dot--${tone}`} aria-hidden="true" />
                      <span className="intel-health__name">{name}</span>
                      <span className="intel-health__state">Preview</span>
                      <span className="intel-health__bars" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((bar) => (
                          <i key={bar} className={bar < 4 ? "is-on" : undefined} />
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                title="SYSTEM OUTPUT"
                action={<span className="intel-chip intel-chip--quiet">Read only</span>}
              >
                <div className="intel-output">
                  {output.map(([time, source, message]) => (
                    <div key={`${time}-${source}`} className="intel-output__row">
                      <span>{time}</span>
                      <strong>{source}</strong>
                      <span>{message}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </aside>
          </main>
        </div>
      </div>

      <footer className="intel-footer">
        <div className="intel-command" aria-label="Read-only command preview">
          <Command size={17} />
          <span>Command Astra…</span>
          <small>PROTOTYPE · READ ONLY</small>
          <button type="button" disabled aria-label="Command execution unavailable">
            <Sparkles size={16} />
          </button>
        </div>
        <div className="intel-actions" aria-label="Example command modes">
          {(["Search", "Reason", "Create", "Automate"] as const).map((action) => (
            <span key={action} className="intel-actions__chip">
              <Lightbulb size={14} />
              {action}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
