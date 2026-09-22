import type { ReactNode } from "react";
import { Link } from "wouter";
import {
  Activity,
  Bot,
  BrainCircuit,
  Command,
  Cpu,
  Network,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import "./intel.css";

type Tone = "cyan" | "blue" | "violet" | "amber" | "mint" | "pink";

const systems = [
  ["Core", "Online"],
  ["Agents", "7 / 7"],
  ["Knowledge graph", "Live"],
  ["Autonomy", "Operational"],
  ["Global sync", "Healthy"],
];

const tasks = [
  ["Index new research papers", "Running", "cyan"],
  ["Generate media assets", "Queued", "blue"],
  ["Plan autonomous run", "Scheduled", "violet"],
] as const;

const activity = [
  ["Hermes", "Dispatched message", "2m ago", "cyan"],
  ["Atlas", "Mapped 12 new connections", "14m ago", "blue"],
  ["Media", "Generated 4 assets", "37m ago", "pink"],
  ["Hades", "Completed analysis", "1h ago", "amber"],
  ["Mini-Beast", "Learned from session", "2h ago", "mint"],
] as const;

const agents = [
  ["Mini-Beast", "cyan"],
  ["Hades", "amber"],
  ["Atlas", "blue"],
  ["Hermes", "blue"],
  ["Phobos", "violet"],
  ["Media", "pink"],
  ["Autonomy", "mint"],
  ["Jobs", "amber"],
] as const;

const output = [
  ["22:12", "Atlas", "Linked 3 related concepts", "blue"],
  ["22:11", "Media", "Generated visual asset", "pink"],
  ["22:10", "Mini-Beast", "Applied model weights", "cyan"],
  ["22:08", "Hades", "Identified conflicting data", "amber"],
  ["22:06", "Jobs", "Scheduled 8 new tasks", "amber"],
] as const;

const graphLabels: Array<[string, string, Tone, number, number]> = [
  ["MINI-BEAST", "ADAPTIVE INTELLIGENCE", "cyan", 36, 17],
  ["HADES", "ANALYSIS & TRUTH", "amber", 66, 18],
  ["HERMES", "COMMUNICATION & FLOW", "blue", 81, 42],
  ["AUTONOMY", "ACTION & CONTROL", "mint", 79, 68],
  ["JOBS", "TASKS & AUTOMATION", "amber", 64, 84],
  ["MEDIA", "CREATION & EXPRESSION", "pink", 35, 83],
  ["PHOBOS", "SIMULATION & FORESIGHT", "violet", 19, 67],
  ["ATLAS", "KNOWLEDGE & CONTEXT", "cyan", 17, 42],
];

const graphNodes = Array.from({ length: 76 }, (_, index) => {
  const angle = index * 2.39996;
  const radius = 14 + ((index * 37) % 30);
  return {
    x: 50 + Math.cos(angle) * radius * 0.96,
    y: 50 + Math.sin(angle) * radius,
    r: index % 11 === 0 ? 1.35 : index % 4 === 0 ? 0.82 : 0.48,
    tone: (["cyan", "blue", "cyan", "mint", "amber", "violet"] as Tone[])[index % 6],
  };
});

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`intel-panel ${className}`}>
      <div className="intel-panel__title">{title}</div>
      {children}
    </section>
  );
}

function Sparkline({ variant = 0 }: { variant?: number }) {
  const paths = [
    "M1 25 L8 20 L14 21 L22 14 L29 15 L36 10 L43 12 L50 11 L58 6 L68 4",
    "M1 27 L9 25 L16 19 L23 17 L30 19 L37 15 L44 17 L51 14 L58 10 L68 8",
    "M1 27 L9 25 L16 20 L23 22 L31 17 L38 18 L45 14 L53 15 L60 11 L68 7",
  ];
  return (
    <svg className="intel-sparkline" viewBox="0 0 70 31" aria-hidden="true">
      <path d={paths[variant % paths.length]} />
    </svg>
  );
}

function KnowledgeGraph() {
  const edges = graphNodes.flatMap((node, index) => {
    const targets = [index + 7, index + 19];
    return targets
      .filter((target) => target < graphNodes.length)
      .map((target) => ({ from: node, to: graphNodes[target], key: `${index}-${target}` }));
  });

  return (
    <section className="intel-stage" aria-label="Example Astra knowledge graph visualization">
      <div className="intel-stage__eyebrow">KNOWLEDGE</div>
      <div className="intel-orbit intel-orbit--outer" />
      <div className="intel-orbit intel-orbit--middle" />
      <div className="intel-orbit intel-orbit--inner" />
      <svg className="intel-graph" viewBox="0 0 100 100" role="img" aria-label="Circular network of example agents and knowledge connections">
        <defs>
          <radialGradient id="graphFade">
            <stop offset="0" stopColor="#0fe9ff" stopOpacity=".13" />
            <stop offset=".72" stopColor="#0b4d71" stopOpacity=".05" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter id="nodeGlow" x="-250%" y="-250%" width="600%" height="600%">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#graphFade)" />
        {edges.map(({ from, to, key }, index) => (
          <line
            key={key}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className={`intel-edge intel-edge--${index % 5}`}
          />
        ))}
        {graphNodes.map((node, index) => (
          <circle
            key={index}
            cx={node.x}
            cy={node.y}
            r={node.r}
            className={`intel-node intel-tone--${node.tone}`}
            filter={node.r > 1 ? "url(#nodeGlow)" : undefined}
          />
        ))}
      </svg>

      {graphLabels.map(([name, description, tone, x, y]) => (
        <div key={name} className={`intel-agent intel-agent--${tone}`} style={{ left: `${x}%`, top: `${y}%` }}>
          <span className="intel-agent__beacon" />
          <strong>{name}</strong>
          <small>{description}</small>
        </div>
      ))}

      <div className="intel-core">
        <div className="intel-core__rings" aria-hidden="true" />
        <img src="/astra-core-logo.png" alt="Astra Core" />
        <strong>ASTRA</strong>
        <span>UNDERSTAND · CONNECT · EXECUTE</span>
      </div>
      <div className="intel-stage__motto">A MORE CAPABLE TOMORROW</div>
    </section>
  );
}

export default function Intel() {
  return (
    <div className="intel-shell">
      <header className="intel-header">
        <Link href="/intel" className="intel-brand" aria-label="Astra Intelligence home">
          <span className="intel-brand__mark"><img src="/astra-core-logo.png" alt="" /></span>
          <span><strong>ASTRA</strong><small>INTELLIGENCE IN MOTION</small></span>
        </Link>
        <div className="intel-search" aria-label="Read-only prototype search">
          <Search size={15} />
          <span>Ask Astra anything…</span>
          <kbd>⌘ K</kbd>
        </div>
        <div className="intel-presence">
          <span className="intel-example-chip">EXAMPLE DATA</span>
          <span className="intel-live-dot" /> Live
          <time>22:14</time>
        </div>
      </header>

      <div className="intel-layout">
        <aside className="intel-rail intel-rail--left" aria-label="System overview">
          <Panel title="SYSTEM STATUS">
            <div className="intel-status-list">
              {systems.map(([name, value], index) => (
                <div className="intel-status" key={name}>
                  <span className="intel-status__icon">{index === 0 ? <Cpu /> : index === 1 ? <Bot /> : index === 2 ? <Network /> : index === 3 ? <Zap /> : <Radio />}</span>
                  <span>{name}</span><i /> <em>{value}</em>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="ACTIVE TASKS">
            <div className="intel-task-count">3</div>
            {tasks.map(([name, state, tone]) => (
              <div className="intel-task" key={name}>
                <span className={`intel-progress intel-progress--${tone}`}><i /></span>
                <div><strong>{name}</strong><small>{state}</small></div>
              </div>
            ))}
          </Panel>

          <Panel title="RECENT ACTIVITY" className="intel-activity-panel">
            {activity.map(([name, detail, time, tone], index) => (
              <div className="intel-activity" key={`${name}-${detail}`}>
                <span className={`intel-activity__icon intel-tone-bg--${tone}`}>{index % 2 ? <Search /> : <Activity />}</span>
                <div><strong>{name}</strong><small>{detail}</small></div><time>{time}</time>
              </div>
            ))}
          </Panel>
        </aside>

        <KnowledgeGraph />

        <aside className="intel-rail intel-rail--right" aria-label="Global intelligence metrics">
          <Panel title="GLOBAL INSIGHTS">
            <span className="intel-live-chip">Example data</span>
            <div className="intel-kpis">
              <div className="intel-kpi"><strong>428K</strong><small>Knowledge nodes</small><em>+12%</em><Sparkline /></div>
              <div className="intel-kpi"><strong>1.3K</strong><small>Active connections</small><em>+8%</em><Sparkline variant={1} /></div>
              <div className="intel-kpi"><strong>97</strong><small>Running jobs</small><em>+24%</em><Sparkline variant={2} /></div>
              <div className="intel-kpi"><strong>7</strong><small>Active agents</small><em>—</em><Sparkline variant={1} /></div>
            </div>
          </Panel>

          <Panel title="AGENT HEALTH">
            <div className="intel-health-list">
              {agents.map(([name, tone], index) => (
                <div className="intel-health" key={name}>
                  <span className={`intel-dot intel-tone-bg--${tone}`} /><strong>{name}</strong><i />
                  <small><span /> Online</small>
                  <div className="intel-health__bars">{[0, 1, 2, 3, 4].map((bar) => <b key={bar} className={bar < 3 + (index % 2) ? "is-on" : ""} />)}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="SYSTEM OUTPUT" className="intel-output-panel">
            <span className="intel-live-chip">Read only</span>
            {output.map(([time, agent, detail, tone]) => (
              <div className="intel-output" key={`${time}-${agent}`}>
                <time>{time}</time><span className={`intel-dot intel-tone-bg--${tone}`} /><strong>{agent}</strong><small>{detail}</small>
              </div>
            ))}
          </Panel>
        </aside>
      </div>

      <footer className="intel-footer">
        <div className="intel-version"><span>Astra OS v0.9.2</span><small><i /> Example data · systems nominal</small></div>
        <div className="intel-command" aria-label="Read-only command preview">
          <Command size={16} /><span>Command Astra…</span><small>PROTOTYPE · READ ONLY</small><button type="button" disabled aria-label="Command execution unavailable"><Zap size={14} /></button>
        </div>
        <div className="intel-actions" aria-label="Example command modes">
          <span><Search /> Search</span><span><BrainCircuit /> Reason</span><span><Sparkles /> Create</span><span><ShieldCheck /> Automate</span>
        </div>
      </footer>
    </div>
  );
}
