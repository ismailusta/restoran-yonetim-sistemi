export type ItemType = 'kitchen' | 'bar';

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  type: ItemType;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Ticket {
  id: string;
  orderId: string;
  tableNumber: number;
  items: CartItem[];
  createdAt: string;
}
