import { pgTable, text, serial, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  type: text("type").notNull().default('text'), // 'text', 'node_status', 'job', 'media_preview'
  metadata: jsonb("metadata"), // stores specific card data based on type
  createdAt: timestamp("created_at").defaultNow(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  thumb_url: text("thumb_url"),
  type: text("type").notNull(), // 'video', 'image'
  mtime: timestamp("mtime").defaultNow(),
  tags: jsonb("tags").$type<string[]>().default([]),
  favorite: boolean("favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  type: text("type").$type<"comfyui.image" | "comfyui.video" | "media.describe" | "system.task">().notNull(),
  title: text("title").notNull(),
  status: text("status").$type<"queued" | "running" | "done" | "failed">().notNull(),
  node: text("node").$type<"Kratos" | "Hades" | "Hermes">().notNull(),
  progress: integer("progress").notNull().default(0),
  inputs: jsonb("inputs").$type<{ id: string, type: string, url: string, thumb_url?: string }[]>().default([]),
  outputs: jsonb("outputs").$type<{ id: string, type: string, url: string, thumb_url?: string }[]>().default([]),
  logs: jsonb("logs").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'Kratos', 'Hades', 'Hermes'
  status: text("status").notNull(), // 'online', 'offline', 'degraded'
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Base schemas
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertMediaSchema = createInsertSchema(media).omit({ id: true, createdAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true });
export const insertNodeSchema = createInsertSchema(nodes).omit({ id: true, createdAt: true });

// Types
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;
