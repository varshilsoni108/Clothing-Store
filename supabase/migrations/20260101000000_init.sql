-- The Fashion Hub — initial schema
-- Run this in the Supabase SQL Editor or via `supabase db push`.

-- ────────────────────────────────────────────────────────────────────────────
-- Enums
-- ────────────────────────────────────────────────────────────────────────────
create type public.user_role as enum ('customer', 'admin');

create type public.order_status as enum (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned'
);

create type public.payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- ────────────────────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  email      text,
  phone      text,
  avatar_url text,
  role       public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  price            numeric(10, 2) not null default 0,
  compare_at_price numeric(10, 2),
  category_id      uuid references public.categories (id) on delete set null,
  main_image       text,
  active           boolean not null default true,
  featured         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_active_idx on public.products (active);

create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url  text not null,
  sort_order integer not null default 0
);

create index product_images_product_idx on public.product_images (product_id);

create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  size           text,
  color          text,
  sku            text unique,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  price          numeric(10, 2),
  active         boolean not null default true,
  unique (product_id, size, color)
);

create index product_variants_product_idx on public.product_variants (product_id);

create table public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  quantity   integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index cart_items_cart_idx on public.cart_items (cart_id);

create table public.addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  full_name      text not null,
  phone          text not null,
  address_line_1 text not null,
  address_line_2 text,
  city           text not null,
  state          text not null,
  postal_code    text not null,
  country        text not null default 'India',
  is_default     boolean not null default false,
  created_at     timestamptz not null default now()
);

create index addresses_user_idx on public.addresses (user_id);

create table public.orders (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id),
  order_number             text not null unique,
  subtotal                 numeric(10, 2) not null default 0,
  shipping_amount          numeric(10, 2) not null default 0,
  discount_amount          numeric(10, 2) not null default 0,
  total_amount             numeric(10, 2) not null default 0,
  payment_status           public.payment_status not null default 'pending',
  order_status             public.order_status not null default 'pending',
  shipping_address_snapshot jsonb not null,
  razorpay_order_id        text,
  razorpay_payment_id      text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (order_status);

create table public.order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders (id) on delete cascade,
  product_id          uuid references public.products (id) on delete set null,
  variant_id          uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  price_snapshot      numeric(10, 2) not null,
  size                text,
  color               text,
  quantity            integer not null default 1,
  subtotal            numeric(10, 2) not null default 0,
  image_url_snapshot  text
);

create index order_items_order_idx on public.order_items (order_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Helper functions
-- (Defined after the tables: `is_admin` is LANGUAGE SQL and is validated at
-- creation time, so it must come after `public.profiles` exists.)
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create a profile row automatically when a new Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Triggers
-- ────────────────────────────────────────────────────────────────────────────
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create trigger set_carts_updated_at
  before update on public.carts
  for each row execute procedure public.set_updated_at();

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- Storage
-- ────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "admin insert product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "admin update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "admin delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());