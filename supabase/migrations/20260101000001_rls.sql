-- The Fashion Hub — Row Level Security policies
-- Run after the initial schema migration.

-- ────────────────────────────────────────────────────────────────────────────
-- profiles
-- Customers read/update their own row; admins manage all rows.
-- A customer can never raise their own role (checked below).
-- ────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles select own or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = 'customer');

create policy "profiles admin update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- categories (public read of active; admin write)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.categories enable row level security;

create policy "categories public read"
  on public.categories for select
  using (active = true);

create policy "categories admin all"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- products (public read of active; admin write)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.products enable row level security;

create policy "products public read"
  on public.products for select
  using (active = true);

create policy "products admin all"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- product_images (public read for active products only; admin write)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.product_images enable row level security;

create policy "product_images public read"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.active = true
    )
  );

create policy "product_images admin all"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- product_variants (public read for active products only; admin write)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.product_variants enable row level security;

create policy "product_variants public read"
  on public.product_variants for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.active = true
    )
  );

create policy "product_variants admin all"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- carts / cart_items (owned by the auth user only)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.carts enable row level security;

create policy "carts own all"
  on public.carts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.cart_items enable row level security;

create policy "cart_items own all"
  on public.cart_items for all
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- addresses (owned by the auth user only)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.addresses enable row level security;

create policy "addresses own all"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- orders (owner read; owner update limited to cancellation; admin all)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.orders enable row level security;

create policy "orders owner read"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

-- Customer update policy: allow cancellation only. The check keeps the customer
-- from touching money fields or order statuses beyond cancel/pending.
create policy "orders owner cancel"
  on public.orders for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and order_status = 'cancelled'
    and payment_status in ('pending', 'refunded')
  );

create policy "orders admin all"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- order_items (via order ownership; admin all)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.order_items enable row level security;

create policy "order_items owner read"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "order_items admin all"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());