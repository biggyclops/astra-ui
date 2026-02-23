import { db } from "./db";
import { asc, eq, gt } from "drizzle-orm";
import { jobs, nodes, messages, media } from "@shared/schema";
import type {
  InsertJob,
  InsertMessage,
  InsertNode,
  InsertMedia,
  Job,
  Message,
  Node,
  Media,
} from "@shared/schema";

type SeedPayload = {
  nodes: InsertNode[];
  jobs: InsertJob[];
  media: InsertMedia[];
  messages: InsertMessage[];
};

/**
 * Memory-only storage for DEMO mode (no DATABASE_URL).
 * Resets on restart. That's fine for Mini-Beast demos.
 */
class MemoryStorage {
  private _messages: Message[] = [];
  private _jobs: Job[] = [];
  private _nodes: Node[] = [];

  private msgId = 1;
  private jobId = 1;
  private nodeId = 1;

  constructor() {
    // Seed defaults so UI doesn't look empty
    const now = new Date();
    this._messages.push({
      id: this.msgId++,
      role: "system",
      content: "Welcome to Astra UI console.",
      type: "text",
      metadata: null,
      createdAt: now,
    } as any);

    this._nodes = [
      { id: this.nodeId++, name: "Kratos", status: "online", details: { ollama: "ok" } as any, updatedAt: now } as any,
      { id: this.nodeId++, name: "Hades", status: "unknown", details: { comfyui: "unknown" } as any, updatedAt: now } as any,
      { id: this.nodeId++, name: "Hermes", status: "online", details: { storage: "ok" } as any, updatedAt: now } as any,
    ];
  }

  async getMessages(): Promise<Message[]> {
    return this._messages;
  }

  async getMessagesAfterId(afterId: number): Promise<Message[]> {
    // Exclusive by design: return messages with id > afterId.
    return this._messages.filter(m => m.id > afterId);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const created: Message = {
      id: this.msgId++,
      createdAt: new Date(),
      ...(message as any),
    };
    this._messages.push(created);
    return created;
  }

  async getJobs(): Promise<Job[]> {
    return this._jobs;
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this._jobs.find(j => j.id === id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const created: Job = {
      id: this.jobId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(job as any),
    };
    this._jobs.push(created);
    return created;
  }

  async updateJob(
    id: number,
    updates: Partial<Pick<Job, "status" | "progress" | "outputs" | "logs" | "updatedAt">>
  ): Promise<Job | undefined> {
    const idx = this._jobs.findIndex(j => j.id === id);
    if (idx === -1) return undefined;
    this._jobs[idx] = { ...this._jobs[idx], ...updates, updatedAt: new Date() } as any;
    return this._jobs[idx];
  }

  async getNodes(): Promise<Node[]> {
    return this._nodes;
  }

  async getMedia(): Promise<Media[]> {
    return [];
  }

  async seedDatabase(_seed: SeedPayload): Promise<void> {
    // Memory storage is already seeded in the constructor.
  }
}

class DatabaseStorage {
  async getMessages(): Promise<Message[]> {
    return await db!.select().from(messages).orderBy(asc(messages.id));
  }

  async getMessagesAfterId(afterId: number): Promise<Message[]> {
    // Exclusive by design: return messages with id > afterId.
    return await db!.select().from(messages).where(gt(messages.id, afterId)).orderBy(asc(messages.id));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db!.insert(messages).values(message as any).returning();
    return created;
  }

  async getJobs(): Promise<Job[]> {
    return await db!.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db!.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [created] = await db!.insert(jobs).values(job as any).returning();
    return created;
  }

  async updateJob(
    id: number,
    updates: Partial<Pick<Job, "status" | "progress" | "outputs" | "logs" | "updatedAt">>
  ): Promise<Job | undefined> {
    const [updated] = await db!.update(jobs).set(updates).where(eq(jobs.id, id)).returning();
    return updated;
  }

  async getNodes(): Promise<Node[]> {
    return await db!.select().from(nodes);
  }

  async getMedia(): Promise<Media[]> {
    return await db!.select().from(media).orderBy(asc(media.id));
  }

  async seedDatabase(seed: SeedPayload): Promise<void> {
    const existingNodes = await this.getNodes();
    if (existingNodes.length === 0 && seed.nodes.length > 0) {
      await db!.insert(nodes).values(seed.nodes as any);
    }

    const existingJobs = await this.getJobs();
    if (existingJobs.length === 0 && seed.jobs.length > 0) {
      await db!.insert(jobs).values(seed.jobs as any);
    }

    const existingMedia = await this.getMedia();
    if (existingMedia.length === 0 && seed.media.length > 0) {
      await db!.insert(media).values(seed.media as any);
    }

    const existingMessages = await this.getMessages();
    if (existingMessages.length === 0 && seed.messages.length > 0) {
      await db!.insert(messages).values(seed.messages as any);
    }
  }
}

// ✅ Export whichever storage makes sense
export const storage = db ? new DatabaseStorage() : new MemoryStorage();
