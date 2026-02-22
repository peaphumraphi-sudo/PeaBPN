
export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  qrCode?: string;
}

export interface VehicleInventory {
  vehicleId: string;
  plateNumber: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
}

export interface DailyCountLog {
  id: string;
  date: string;
  vehicleId: string;
  reporter: string;
  receiver: string;
  items: {
    itemId: string;
    actualQuantity: number;
  }[];
}

export interface EquipmentChecklist {
  id: string;
  vehicleId: string;
  date: string;
  sender: string;
  receiver: string;
  tools: {
    toolName: string;
    status: 'READY' | 'MISSING' | 'DAMAGED';
  }[];
}
