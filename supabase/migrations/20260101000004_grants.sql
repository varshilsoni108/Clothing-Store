-- The Fashion Hub — table privilege grants
-- Run against existing deployments too (this is additive; it does not touch
-- schema, RLS policies, or seed data).
--
-- Why this is needed: tables created through raw SQL migrations (as opposed to
-- the Dashboard's Table Editor) receive NO privileges for the `anon`,
-- `authenticated`, or `service_role` roles. RLS (20260101000001_rls.sql)
-- correctly filters rows, but the roles cannot even reach the policies until
-- they hold table privileges. Every read then fails with:
--   permission denied for table <name>  (SQLSTATE 42501)
--
-- Grants below mirror exactly what each RLS policy allows. Row filtering itself
-- is still enforced entirely by Row Level Security.

-- ────────────────────────────────────────────────────────────────────────────
-- anon — public storefront reads (active rows only, enforced by RLS)
-- ────────────────────────────────────────────────────────────────────────────
grant select on table public.categories       to anon;
grant select on table public.products         to anon;
grant select on table public.product_images   to anon;
grant select on table public.product_variants to anon;

-- ────────────────────────────────────────────────────────────────────────────
-- authenticated — storefront reads + own-row / own-subtree writes via RLS
-- ────────────────────────────────────────────────────────────────────────────
grant select on table public.categories       to authenticated;
grant select on table public.products         to authenticated;
grant select on table public.product_images   to authenticated;
grant select on table public.product_variants to authenticated;

grant select, update on table public.profiles to authenticated;
grant all on table public.carts               to authenticated;
grant all on table public.cart_items          to authenticated;
grant all on table public.addresses           to authenticated;
grant select, update on table public.orders   to authenticated; -- update gated to cancel by RLS
grant select on table public.order_items      to authenticated;

-- Functions referenced by RLS policy expressions must also be executable by the
-- calling roles (default function privileges already expose them to PUBLIC; this
-- makes the dependency explicit and robust against template-level revokes).
grant execute on function public.is_admin() to anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- service_role — full access (bypasses RLS; trusted server code / admin only)
-- ────────────────────────────────────────────────────────────────────────────
grant all on table public.profiles,
  public.categories,
  public.products,
  public.product_images,
  public.product_variants,
  public.carts,
  public.cart_items,
  public.addresses,
  public.orders,
  public.order_items
  to service_role;