import { 
  type User, type InsertUser,
  type EmergencyAlert, type InsertEmergencyAlert,
  type EquipmentRecord, type InsertEquipmentRecord,
  type ChemicalRecord, type InsertChemicalRecord,
  type RecentSearch
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;

  // Recent Searches
  createRecentSearch(search: Omit<RecentSearch, "id" | "createdAt">): Promise<RecentSearch>;
  getRecentSearches(userId: number): Promise<RecentSearch[]>;
  deleteRecentSearch(id: number, userId: number): Promise<boolean>;

  // Emergency Alerts
  createAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getActiveAlerts(): Promise<EmergencyAlert[]>;
  resolveAlert(id: number): Promise<void>;

  // Equipment Records
  createEquipmentRecord(record: InsertEquipmentRecord): Promise<EquipmentRecord>;
  getEquipmentByName(name: string): Promise<EquipmentRecord | undefined>;
  getAllEquipment(): Promise<EquipmentRecord[]>;

  // Chemical Records
  createChemicalRecord(record: InsertChemicalRecord): Promise<ChemicalRecord>;
  getChemicalByName(name: string): Promise<ChemicalRecord | undefined>;
  getAllChemicals(): Promise<ChemicalRecord[]>;
}
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { users, recentSearches, emergencyAlerts, equipmentRecords, chemicalRecords } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updated] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Recent Searches
  async createRecentSearch(search: Omit<RecentSearch, "id" | "createdAt">): Promise<RecentSearch> {
    const [recentSearch] = await db.insert(recentSearches).values(search).returning();
    return recentSearch;
  }

  async getRecentSearches(userId: number): Promise<RecentSearch[]> {
    return await db.select()
      .from(recentSearches)
      .where(eq(recentSearches.userId, userId))
      .orderBy(desc(recentSearches.createdAt));
  }

  async deleteRecentSearch(id: number, userId: number): Promise<boolean> {
    const [deleted] = await db.delete(recentSearches)
      .where(eq(recentSearches.id, id))
      .returning();
    return !!deleted;
  }

  // Emergency Alerts
  async createAlert(insertAlert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [alert] = await db.insert(emergencyAlerts).values(insertAlert).returning();
    return alert;
  }

  async getActiveAlerts(): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts).where(eq(emergencyAlerts.resolved, false));
  }

  async resolveAlert(id: number): Promise<void> {
    await db.update(emergencyAlerts).set({ resolved: true }).where(eq(emergencyAlerts.id, id));
  }

  // Equipment Records
  async createEquipmentRecord(record: InsertEquipmentRecord): Promise<EquipmentRecord> {
    const [equipment] = await db.insert(equipmentRecords).values(record).returning();
    return equipment;
  }

  async getEquipmentByName(name: string): Promise<EquipmentRecord | undefined> {
    // Basic case-insensitive search
    const results = await db.select().from(equipmentRecords);
    return results.find(e => e.name.toLowerCase() === name.toLowerCase());
  }

  async getAllEquipment(): Promise<EquipmentRecord[]> {
    return await db.select().from(equipmentRecords);
  }

  // Chemical Records
  async createChemicalRecord(record: InsertChemicalRecord): Promise<ChemicalRecord> {
    const [chemical] = await db.insert(chemicalRecords).values(record).returning();
    return chemical;
  }

  async getChemicalByName(name: string): Promise<ChemicalRecord | undefined> {
    const results = await db.select().from(chemicalRecords);
    return results.find(c => c.name.toLowerCase() === name.toLowerCase());
  }

  async getAllChemicals(): Promise<ChemicalRecord[]> {
    return await db.select().from(chemicalRecords);
  }
}

export const storage = new DatabaseStorage();