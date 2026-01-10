import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  location: text("location").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  resolved: boolean("resolved").notNull().default(false),
});

export const equipmentRecords = pgTable("equipment_records", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  details: jsonb("details").notNull(),
  imageUrl: text("image_url"),
});

export const chemicalRecords = pgTable("chemical_records", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hazards: text("hazards").array(),
  precautions: text("precautions").array(),
  imageUrl: text("image_url"),
});

export const papers = pgTable("papers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  url: text("url").notNull(),
  cached: boolean("cached").default(false),
});

export const insertUserSchema = createInsertSchema(users);
export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({ id: true });
export const insertEquipmentRecordSchema = createInsertSchema(equipmentRecords).omit({ id: true });
export const insertChemicalRecordSchema = createInsertSchema(chemicalRecords).omit({ id: true });
export const insertPaperSchema = createInsertSchema(papers).omit({ id: true });

export type User = typeof users.$inferSelect;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type EquipmentRecord = typeof equipmentRecords.$inferSelect;
export type ChemicalRecord = typeof chemicalRecords.$inferSelect;
export type Paper = typeof papers.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type InsertEquipmentRecord = z.infer<typeof insertEquipmentRecordSchema>;
export type InsertChemicalRecord = z.infer<typeof insertChemicalRecordSchema>;
export type InsertPaper = z.infer<typeof insertPaperSchema>;