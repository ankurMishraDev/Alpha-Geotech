export type Client = {
  id: string;
  name: string;
  contact_number: string | null;
  company_address: string | null;
  email: string | null;
  created_at: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact_number: string | null;
  supplier_address: string | null;
  email: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  client_id: string;
  date: string;
  name: string;
  project_identifier: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  client?: Client;
};

export type ClientProduct = {
  id: string;
  project_id: string;
  date: string;
  name: string;
  quantity: number;
  price: number;
  remarks: string | null;
  created_at: string;
};

export type Charge = {
  id: string;
  date: string;
  operation: 'add' | 'subtract';
  charge_type: string;
  amount: number;
  notes: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  date: string;
  amount: number;
  payment_mode: string;
  notes: string | null;
  created_at: string;
};

export type SupplierProduct = {
  id: string;
  project_id: string;
  supplier_id: string;
  date: string;
  name: string;
  quantity: number;
  price: number;
  remarks: string | null;
  created_at: string;
  supplier?: Supplier;
};
