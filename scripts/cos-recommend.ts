#!/usr/bin/env tsx
/**
 * ASTRA-S12 — Chief of Staff recommendation engine (v1)
 *
 * Local, read-only. Prints one next ticket and one next role, or unknown.
 * This is a recommendation — not an approval and not a dispatch.
 *
 * Does not: invoke roles, call cloud models, merge, deploy, or talk to GitHub.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KIND = "recommendation";
const OS_ROLES = [
  "PROGRAMMER",
  "QA",
  "DESIGN",
  "CTO",
  "EM",
  "DOCS",
  "PRODUCT",
  "COS",
] as const;
type OsRole = (typeof OS_ROLES)[number];

type TicketStatus = "active" | "parked" | "rejected" | "done" | "unknown";

type StoryRow = {
  order: number | null;
  id: string;
  priority: string;
  vehicle: string;
  note: string;
  status: TicketStatus;
  trackA: boolean;
};

type Blocker = {
  id: string;
  owner: string;
  summary: string;
  blocks: string;
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

const PATHS = {
  constitution: "docs/astra-os/CONSTITUTION.md",
  master: "docs/ASTRA_MASTER.md",
  rolesIndex: "docs/astra-os/ROLES.md",
  rolesDir: "docs/astra-os/roles",
  cosPacket: "docs/astra-os/roles/COS.md",
  status: "docs/project_status.yaml",
  roadmap: "docs/ROADMAP.md",
  handoffs: "docs/handoffs",
  ticketsIndex: "docs/astra-os/TICKETS.md",
  ticketsDir: "docs/astra-os/tickets",
  stories: "docs/product/STORIES.md",
  decisions: "docs/product/DECISIONS.md",
  glossary: "docs/astra-os/GLOSSARY.md",
} as const;

function readRepo(rel: string): string | null {
  const abs = join(repoRoot, rel);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf8");
}

function missing(rel: string, unknowns: string[]): boolean {
  if (existsSync(join(repoRoot, rel))) return false;
  unknowns.push(`missing ${rel}`);
  return true;
}

function expandStoryIds(raw: string): string[] {
  const trimmed = raw.trim();
  const range = trimmed.match(/^(?:ASTRA-)?S(\d+)\s*[–-]\s*(?:ASTRA-)?S?(\d+)$/i);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    const ids: string[] = [];
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) ids.push(`ASTRA-S${n}`);
    return ids;
  }
  if (/^ASTRA-[A-Z0-9-]+$/i.test(trimmed)) return [trimmed.toUpperCase()];
  if (/^S\d+$/i.test(trimmed)) return [`ASTRA-${trimmed.toUpperCase()}`];
  return [trimmed];
}

function classify(priority: string, vehicle: string, note: string): TicketStatus {
  const blob = `${priority} ${vehicle} ${note}`.toLowerCase();
  if (blob.includes("reject")) return "rejected";
  if (blob.includes("parked") || blob.includes("do not staff") || blob.includes("unstaffed")) {
    return "parked";
  }
  if (blob.includes("done") || blob.includes("complete") || blob.includes("closed")) return "done";
  return "active";
}

function parseStoriesTable(md: string): StoryRow[] {
  const rows: StoryRow[] = [];
  const lineRe =
    /^\|\s*([^|]*?)\s*\|\s*(ASTRA-[A-Z0-9-]+|S\d+(?:\s*[–-]\s*S?\d+)?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$/gim;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(md))) {
    const orderRaw = m[1].trim();
    const order = /^\d+$/.test(orderRaw) ? Number(orderRaw) : null;
    const priority = m[3].trim();
    const vehicle = m[4].trim();
    const note = m[5].trim();
    const trackA = /P0/i.test(priority) || /merge set|track a/i.test(`${vehicle} ${note}`);
    const status = classify(priority, vehicle, note);
    for (const id of expandStoryIds(m[2])) {
      if (id === "ID") continue;
      rows.push({ order, id, priority, vehicle, note, status, trackA });
    }
  }
  return rows;
}

function parseOsTickets(indexMd: string | null, ticketsDir: string, unknowns: string[]): StoryRow[] {
  const rows: StoryRow[] = [];
  const dir = join(repoRoot, ticketsDir);
  if (!existsSync(dir)) {
    unknowns.push(`missing ${ticketsDir}`);
    return rows;
  }
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const id = file.replace(/\.md$/i, "").toUpperCase();
    const body = readFileSync(join(dir, file), "utf8");
    const state = (body.match(/\*\*State\*\*\s*\|\s*([^|]+)/i)?.[1] ?? "").trim();
    let status: TicketStatus = "unknown";
    const sl = state.toLowerCase();
    if (/reject/.test(sl)) status = "rejected";
    else if (/park|hold/.test(sl)) status = "parked";
    else if (/done|implemented|complete/.test(sl)) status = "done";
    else if (/approved|in progress|active|proposed/.test(sl)) status = "active";
    rows.push({
      order: null,
      id,
      priority: "OS",
      vehicle: file,
      note: state || "OS ticket",
      status,
      trackA: false,
    });
  }
  if (indexMd) {
    const lineRe = /^\|\s*\[?(ASTRA-OS-\d+)\]?[^\|]*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$/gim;
    let m: RegExpExecArray | null;
    while ((m = lineRe.exec(indexMd))) {
      const id = m[1].toUpperCase();
      if (!rows.some((r) => r.id === id)) {
        const status = classify("", m[3], m[3]);
        rows.push({
          order: null,
          id,
          priority: "OS",
          vehicle: m[3].trim(),
          note: m[2].trim(),
          status: status === "active" && /implemented|done/i.test(m[3]) ? "done" : status,
          trackA: false,
        });
      }
    }
  }
  return rows;
}

function parseBlockers(yaml: string): Blocker[] {
  const blockers: Blocker[] = [];
  const block = yaml.split(/^blockers:\s*$/m)[1];
  if (!block) return blockers;
  const rest = block.split(/^\S/m)[0] ?? block;
  const chunks = rest.split(/^\s*-\s+id:\s*/m).slice(1);
  for (const chunk of chunks) {
    const id = chunk.match(/^([^\n]+)/)?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
    const owner = chunk.match(/owner:\s*["']?([^\n"']+)/)?.[1]?.trim() ?? "";
    const summary = chunk.match(/summary:\s*["']?([^\n"']+)/)?.[1]?.trim() ?? "";
    const blocks = chunk.match(/blocks:\s*["']?([^\n"']+)/)?.[1]?.trim() ?? "";
    if (id) blockers.push({ id, owner, summary, blocks });
  }
  return blockers;
}

function parseNextRolesFromDecisions(md: string): { id: string; role: string }[] {
  const out: { id: string; role: string }[] = [];
  const blocks = md.split(/^## /m).slice(1);
  for (const block of blocks) {
    const id = block.match(/Decision ID:\s*(ASTRA-PD-\d+)/i)?.[1]?.toUpperCase();
    const role = block.match(/Next Responsible Role:\s*([^\n]+)/i)?.[1]?.trim();
    if (id && role) out.push({ id, role });
  }
  return out;
}

function mapOwnerToRole(owner: string): OsRole | null {
  const t = owner.toLowerCase();
  if (/programmer/.test(t)) return "PROGRAMMER";
  if (/\bqa\b/.test(t)) return "QA";
  if (/design/.test(t)) return "DESIGN";
  if (/\bcto\b/.test(t)) return "CTO";
  if (/\bem\b|engineering manager/.test(t)) return "EM";
  if (/docs|documentation/.test(t)) return "DOCS";
  if (/product/.test(t) && !/cto/.test(t)) return "PRODUCT";
  if (/chief of staff|\bcos\b/.test(t)) return "COS";
  return null;
}

function prioRank(p: string): number {
  const m = p.match(/P(\d+)/i);
  if (m) return Number(m[1]);
  if (/high/i.test(p)) return 20;
  return 50;
}

function pickNextTicket(rows: StoryRow[]): { ticket: StoryRow | null; why: string } {
  const eligible = rows.filter((r) => r.status === "active");
  if (eligible.length === 0) return { ticket: null, why: "no active (non-parked, non-rejected) tickets in local canon" };

  const trackA = eligible.filter((r) => r.trackA || r.id === "ASTRA-S1" || r.id === "ASTRA-S2");
  const pool = trackA.length > 0 ? trackA : eligible;
  const why =
    trackA.length > 0
      ? "Product lock: Track A (S1/S2) is NOW and must not be displaced by OS-line work"
      : "no Track A NOW rows; using remaining active tickets";

  pool.sort((a, b) => {
    const pr = prioRank(a.priority) - prioRank(b.priority);
    if (pr !== 0) return pr;
    const ao = a.order ?? 999;
    const bo = b.order ?? 999;
    if (ao !== bo) return ao - bo;
    return a.id.localeCompare(b.id);
  });
  return { ticket: pool[0], why };
}

function pickNextRole(
  ticket: StoryRow,
  blockers: Blocker[],
  decisionRoles: { id: string; role: string }[],
  unknowns: string[],
): { role: string; why: string } {
  const related = blockers.filter((b) => {
    const blob = `${b.blocks} ${b.id} ${b.summary}`.toUpperCase();
    return blob.includes(ticket.id) || (blob.includes("AUTONOMY-HONESTY") && ticket.trackA);
  });
  const mapped = related
    .map((b) => ({ blocker: b, role: mapOwnerToRole(b.owner) }))
    .filter((x): x is { blocker: Blocker; role: OsRole } => x.role != null);
  const unique = [...new Set(mapped.map((x) => x.role))];

  if (unique.length === 1) {
    return {
      role: unique[0],
      why: `single project_status blocker owner for this ticket: ${mapped[0].blocker.owner}`,
    };
  }
  if (unique.length > 1) {
    unknowns.push(
      `multiple blocker owners for ${ticket.id}: ${unique.join(", ")} — CoS must not assign multiple departments`,
    );
    return {
      role: "unknown",
      why: "more than one blocker owner; refusing to invent a multi-role handoff",
    };
  }

  const lastPd = decisionRoles.at(-1);
  if (lastPd) {
    const mappedPd = mapOwnerToRole(lastPd.role);
    if (mappedPd === "COS") {
      unknowns.push(
        `${lastPd.id} names Chief of Staff as coordinator, not a worker, and no single blocker owner was found`,
      );
      return {
        role: "unknown",
        why: `${lastPd.id} handed Track A to CoS; v1 will not invent the next worker`,
      };
    }
    if (mappedPd) {
      return { role: mappedPd, why: `${lastPd.id} Next Responsible Role: ${lastPd.role}` };
    }
    unknowns.push(`could not map Next Responsible Role "${lastPd.role}" from ${lastPd.id} to an OS role`);
  }

  return { role: "unknown", why: "no single OS role is named for this ticket in local canon" };
}

function latestHandoff(): string {
  const dir = join(repoRoot, PATHS.handoffs);
  if (!existsSync(dir)) return "(none)";
  const files = readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f))
    .sort();
  return files.at(-1) ?? "(none)";
}

function main(): void {
  const unknowns: string[] = [];
  const sources: string[] = [];

  const bootFiles: Array<keyof typeof PATHS> = [
    "constitution",
    "master",
    "rolesIndex",
    "status",
    "roadmap",
    "ticketsIndex",
    "stories",
    "decisions",
  ];
  for (const key of bootFiles) {
    const rel = PATHS[key];
    if (!missing(rel, unknowns)) sources.push(rel);
  }
  if (!missing(PATHS.cosPacket, unknowns)) sources.push(PATHS.cosPacket);
  else {
    unknowns.push("COS.md missing — ASTRA-OS-002 packet not in this checkout; reported honestly");
  }
  sources.push(`handoff:${latestHandoff()}`);

  const storiesMd = readRepo(PATHS.stories) ?? "";
  const ticketsMd = readRepo(PATHS.ticketsIndex);
  const decisionsMd = readRepo(PATHS.decisions) ?? "";
  const statusYaml = readRepo(PATHS.status) ?? "";

  const storyRows = parseStoriesTable(storiesMd);
  const osRows = parseOsTickets(ticketsMd, PATHS.ticketsDir, unknowns);
  const byId = new Map<string, StoryRow>();
  for (const row of [...osRows, ...storyRows]) byId.set(row.id, row);
  const rows = [...byId.values()].filter((r) => r.id !== "ASTRA-S4" || r.status !== "active");
  // ASTRA-S4 is Phase 2 park. Never treat it as the CoS orchestrator, even if a row looks active.
  for (const row of rows) {
    if (row.id === "ASTRA-S4") row.status = "parked";
  }

  const blockers = parseBlockers(statusYaml);
  const decisionRoles = parseNextRolesFromDecisions(decisionsMd);
  const { ticket, why: ticketWhy } = pickNextTicket(rows);

  let nextTicket = "unknown";
  let nextRole = "unknown";
  let rationale: string[] = [];

  if (!ticket) {
    unknowns.push(ticketWhy);
    rationale.push(ticketWhy);
  } else {
    nextTicket = ticket.id;
    rationale.push(`${ticket.id} selected: ${ticketWhy}.`);
    rationale.push(`Local row: priority=${ticket.priority}; vehicle=${ticket.vehicle}; status=${ticket.status}.`);
    rationale.push(`Product note: ${ticket.note || "(none)"}`.replace(/\.\s*$/, "") + ".");
    const picked = pickNextRole(ticket, blockers, decisionRoles, unknowns);
    nextRole = picked.role;
    rationale.push(picked.why + ".");
  }

  const parked = rows.filter((r) => r.status === "parked" || r.status === "rejected").map((r) => r.id);
  rationale.push(
    parked.length
      ? `Parked/rejected IDs not recommended Active: ${[...new Set(parked)].sort().join(", ")}.`
      : "No parked/rejected Product IDs were parsed.",
  );

  const lines = [
    `KIND: ${KIND}`,
    "NOT: approval",
    "NOT: dispatch",
    `NEXT_TICKET: ${nextTicket}`,
    `NEXT_ROLE: ${nextRole}`,
    "RATIONALE:",
    ...rationale.map((l) => `  - ${l}`),
    "UNKNOWNS:",
    ...(unknowns.length ? unknowns.map((u) => `  - ${u}`) : ["  - (none)"]),
    "SOURCES:",
    ...sources.map((s) => `  - ${s}`),
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

main();
