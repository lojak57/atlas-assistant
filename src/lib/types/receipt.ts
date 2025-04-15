export interface Receipt {
  date: string;
  vendor: string;
  total: number | string;
  tax?: number | string;
  category: string;
  items?: ReceiptItem[];
  notes?: string;
  imageUrl?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}
