-- ============================================================
-- ThaiGigaBike — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Products table
create table if not exists public.products (
  id           text primary key,
  code         text not null,
  name         text not null,
  name_th      text not null,
  price        integer not null,
  category     text not null,
  bike_models  text[] not null default '{}',
  colors       text[] not null default '{}',
  in_stock     boolean not null default true,
  stock_count  integer not null default 0,
  material     text not null default '',
  description  text not null default '',
  description_th text not null default '',
  images       text[] not null default '{}',
  featured     boolean not null default false,
  created_at   timestamptz default now()
);

-- Enable Row Level Security
alter table public.products enable row level security;

-- Anyone can read products (storefront)
create policy "products_read_public" on public.products
  for select using (true);

-- Only authenticated users (admins) can insert/update/delete
create policy "products_write_auth" on public.products
  for all using (auth.role() = 'authenticated');

-- Orders table
create table if not exists public.orders (
  id           text primary key,
  customer     text not null,
  phone        text not null,
  address      text not null default '',
  items        jsonb not null default '[]',
  subtotal     integer not null default 0,
  shipping_fee integer not null default 0,
  cod_fee      integer not null default 0,
  total        integer not null default 0,
  shipping_method text not null default '',
  payment_method  text not null default '',
  status       text not null default 'pending',
  created_at   timestamptz default now()
);

alter table public.orders enable row level security;

create policy "orders_write_public" on public.orders
  for insert with check (true);

create policy "orders_read_auth" on public.orders
  for select using (auth.role() = 'authenticated');

create policy "orders_update_auth" on public.orders
  for update using (auth.role() = 'authenticated');

-- ============================================================
-- Seed: copy existing products from products.ts
-- (paste your product data here or use the admin panel to add)
-- ============================================================
