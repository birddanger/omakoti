export enum PropertyType {
  SingleFamily = 'Single Family Home',
  Condo = 'Condo',
  Townhouse = 'Townhouse',
  MultiFamily = 'Multi-Family',
  Commercial = 'Commercial'
}

export enum HeatingType {
  District = 'District Heating',
  Electric = 'Electric',
  HeatPump = 'Heat Pump',
  Oil = 'Oil',
  Gas = 'Gas',
  Wood = 'Wood',
  Solar = 'Solar',
  None = 'None'
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Property {
  id: string;
  userId: string; // Owner of the property
  name: string;
  address: string;
  type: PropertyType;
  yearBuilt: number;
  area: number; // m² (SI Unit)
  heatingType: HeatingType;
  floors: number;
  purchaseDate: string;
  description?: string;
}

export interface MaintenanceLog {
  id: string;
  propertyId: string;
  title: string;
  date: string;
  cost: number;
  provider: string; // Contractor name
  category: 'Plumbing' | 'Electrical' | 'HVAC' | 'Roofing' | 'Landscaping' | 'General' | 'Appliance';
  notes: string;
}

export interface PlannedTask {
  id: string;
  propertyId: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedCost: string;
  status: 'pending' | 'completed';
}

export interface AppDocument {
  id: string;
  propertyId: string;
  logId?: string; // Optional: link to a specific maintenance log
  name: string;
  type: string; // MIME type
  data: string; // Base64 encoded data
  date: string;
  size: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface SeasonalChecklist {
  id: string;
  propertyId: string;
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  items: ChecklistItem[];
  completionPercentage?: number;
  lastUpdated: string;
}

export interface Appliance {
  id: string;
  propertyId: string;
  type: string; // e.g., "Ventilation Unit", "Heat Exchanger", "Water Heater", etc.
  modelNumber?: string;
  yearInstalled: number;
  monthInstalled: number;
  manualId?: string; // Document ID for manual/receipt
  dateAdded: string;
}

export interface MaintenancePrediction {
  task: string;
  reason: string;
  estimatedDate: string;
  estimatedCost: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface AppState {
  properties: Property[];
  logs: MaintenanceLog[];
  documents: AppDocument[];
  plannedTasks: PlannedTask[];
  appliances: Appliance[];
}