export type ItemType = 'kitchen' | 'bar';

export interface MenuItemModifier {
  id: number;
  label: string;
  priceDelta: number;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  type: ItemType;
  category: string;
  modifiers?: MenuItemModifier[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  lineKey: string;
  selectedModifiers: MenuItemModifier[];
}

export type TableStatus = 'empty' | 'occupied';

export interface TableState {
  area: string;
  tableNumber: number;
  items: CartItem[];
  status: TableStatus;
  total: number;
  updatedAt: string | null;
}
