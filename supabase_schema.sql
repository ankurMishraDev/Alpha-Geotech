-- Alpha GeoTech Ledger System Database Schema

-- Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_number TEXT,
    company_address TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_number TEXT,
    supplier_address TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    project_identifier TEXT, -- User defined project ID
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Products (Ledger Entry for Client)
CREATE TABLE client_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Product Charges
CREATE TABLE client_product_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_product_id UUID NOT NULL REFERENCES client_products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('add', 'subtract')),
    charge_type TEXT NOT NULL, -- 'GST', 'TDS', 'Delay', 'Expenses', 'Others', etc.
    amount NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Product Payments
CREATE TABLE client_product_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_product_id UUID NOT NULL REFERENCES client_products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_mode TEXT NOT NULL, -- 'UPI', 'Bank', 'Cheque', 'Cash', 'Other'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Products (Ledger Entry for Supplier)
CREATE TABLE supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Product Charges
CREATE TABLE supplier_product_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_product_id UUID NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('add', 'subtract')),
    charge_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Product Payments
CREATE TABLE supplier_product_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_product_id UUID NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_mode TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);