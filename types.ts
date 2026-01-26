
export type MedicalState = 'Buono' | 'Discreto' | 'Grave' | 'Critico';
export type ConditionType = 'Acuto' | 'Cronico' | '';
export type UserRole = 'admin' | 'user';

export interface JournalEntry {
  id: string;
  date: string;
  healthStatus: string;
  aloeDosage: string;
  weight?: string;
}

export interface Patient {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  medicalCondition: string;
  conditionType: ConditionType;
  medicalState: MedicalState;
  aloeTweak: string;
  journal?: JournalEntry[]; // Monthly tracking history
}

export interface WorkspaceUser {
  id: string;
  workspaceId: string;
  salespersonId: string;
  username: string;
  userId?: string; // Linked Supabase Auth ID
}

export interface ModifierGroup {
  id: string;
  workspaceId: string;
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  workspaceId: string;
  name: string;
  sku?: string;
  variantMap?: Record<string, Record<string, string>>; // e.g. { "ALOE-S": { "Size": "Small" } }
  price: number;
  costPerItem: number;
  labourCost: number;
  externalCommission: number;
  modifierGroupIds: string[];
}

export interface GeneralCost {
  id: string;
  workspaceId: string;
  name: string;
  amount: number;
  category: string;
  date: string;
}

export interface Salesperson {
  id: string;
  workspaceId: string;
  name: string;
}

export interface RawMaterial {
  id: string;
  workspaceId: string;
  name: string;
  unit: string;
  totalQuantity: number;
  totalPrice: number;
}

export interface IngredientRequirement {
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  rawMaterialId?: string;
}

export interface Recipe {
  id: string;
  workspaceId: string;
  productId?: string;
  modifierGroupId?: string;
  modifierOption?: string;
  ingredients: IngredientRequirement[];
}

export interface OrderItem {
  productId: string;
  selectedModifiers: Record<string, string>;
  quantity: number;
}

export interface Order {
  id: string;
  workspaceId: string;
  patientId: string;
  items: OrderItem[];
  date: string;
  isExternal: boolean;
  isShipping?: boolean;
  isFree?: boolean;
  commission: number;
  salespersonId?: string;
  status: 'In attesa' | 'Completato';
}

export interface CityFolder {
  id: string;
  workspaceId: string;
  name: string;
}

export interface Workspace {
  id: string;
  name: string;
  adminPassword?: string; // Deprecated
  ownerId?: string; // Linked Supabase Auth ID
}

export interface AppData {
  patients: Patient[];
  products: Product[];
  orders: Order[];
  recipes: Recipe[];
  cities: CityFolder[];
  modifierGroups: ModifierGroup[];
  salespersons: Salesperson[];
  generalCosts: GeneralCost[];
  workspaceUsers: WorkspaceUser[];
  rawMaterials: RawMaterial[];
}
