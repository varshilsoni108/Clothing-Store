-- The Fashion Hub — helper functions (run after schema + RLS).
-- Securely restores stock for cancelled/returned/failed orders.
create or replace function public.increment_variant_stock(target_variant_id uuid, by_value integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_variants
  set stock_quantity = greatest(0, stock_quantity + by_value)
  where id = target_variant_id;
end;
$$;

grant execute on function public.increment_variant_stock(uuid, integer) to authenticated;
grant execute on function public.increment_variant_stock(uuid, integer) to anon;