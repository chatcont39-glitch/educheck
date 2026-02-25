import { Type } from "@google/genai";

export enum ItemCategory {
  COMPUTERS = "COMPUTADORES",
  PERIPHERALS = "PERIFÉRICOS",
  CABLES = "CABOS"
}

export interface ChecklistItem {
  id: string;
  name: string;
  category: ItemCategory;
  expectedQuantity: number;
  currentQuantity: number;
  isComplete: boolean;
}

export interface ChecklistData {
  id: string;
  teacherName: string;
  date: string;
  usageStartTime?: string;
  usageEndTime?: string;
  items: ChecklistItem[];
  justification?: string;
  signature?: string; // Base64 signature image
  status: 'pending' | 'completed';
}
