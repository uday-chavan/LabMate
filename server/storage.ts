import { 
  type User, type InsertUser,
  type EmergencyAlert, type InsertEmergencyAlert,
  type EquipmentRecord, type InsertEquipmentRecord,
  type ChemicalRecord, type InsertChemicalRecord
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private alerts: Map<number, EmergencyAlert>;
  private equipment: Map<number, EquipmentRecord>;
  private chemicals: Map<number, ChemicalRecord>;
  private currentIds: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.alerts = new Map();
    this.equipment = new Map();
    this.chemicals = new Map();
    this.currentIds = {
      users: 1,
      alerts: 1,
      equipment: 1,
      chemicals: 1
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "user"
    };
    this.users.set(id, user);
    return user;
  }

  async createAlert(insertAlert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const id = this.currentIds.alerts++;
    const alert: EmergencyAlert = {
      ...insertAlert,
      id,
      userId: insertAlert.userId ?? null,
      timestamp: new Date(),
      resolved: false
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async getActiveAlerts(): Promise<EmergencyAlert[]> {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  async resolveAlert(id: number): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.resolved = true;
      this.alerts.set(id, alert);
    }
  }

  async createEquipmentRecord(record: InsertEquipmentRecord): Promise<EquipmentRecord> {
    const id = this.currentIds.equipment++;
    const equipment: EquipmentRecord = {
      ...record,
      id,
      imageUrl: record.imageUrl ?? null
    };
    this.equipment.set(id, equipment);
    return equipment;
  }

  async getEquipmentByName(name: string): Promise<EquipmentRecord | undefined> {
    return Array.from(this.equipment.values()).find(e => e.name.toLowerCase() === name.toLowerCase());
  }

  async getAllEquipment(): Promise<EquipmentRecord[]> {
    return Array.from(this.equipment.values());
  }

  async createChemicalRecord(record: InsertChemicalRecord): Promise<ChemicalRecord> {
    const id = this.currentIds.chemicals++;
    const chemical: ChemicalRecord = {
      ...record,
      id,
      imageUrl: record.imageUrl ?? null,
      hazards: record.hazards ?? null,
      precautions: record.precautions ?? null
    };
    this.chemicals.set(id, chemical);
    return chemical;
  }

  async getChemicalByName(name: string): Promise<ChemicalRecord | undefined> {
    return Array.from(this.chemicals.values()).find(c => c.name.toLowerCase() === name.toLowerCase());
  }

  async getAllChemicals(): Promise<ChemicalRecord[]> {
    return Array.from(this.chemicals.values());
  }
}

export const storage = new MemStorage();