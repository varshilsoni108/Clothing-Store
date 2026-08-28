-- The Fashion Hub — seed data (categories, products, variants, images)
-- Run after schema + RLS migrations.

-- ────────────────────────────────────────────────────────────────────────────
-- Categories
-- ────────────────────────────────────────────────────────────────────────────
insert into public.categories (name, slug, description, image) values
  ('T-Shirts', 'tshirts', 'Premium everyday tees crafted from combed cotton.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80&auto=format&fit=crop'),
  ('Shirts', 'shirts', 'Sharp casual and formal shirts for every occasion.', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=80&auto=format&fit=crop'),
  ('Denim', 'denim', 'Modern jeans and denim jackets built to last.', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80&auto=format&fit=crop'),
  ('Outerwear', 'outerwear', 'Coats, jackets and windproof layers for colder days.', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=1200&q=80&auto=format&fit=crop'),
  ('Ethnic Wear', 'ethnic-wear', 'Elegant kurtas and ethnic ensembles with a modern fit.', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80&auto=format&fit=crop')
on conflict (slug) do nothing;

-- ────────────────────────────────────────────────────────────────────────────
-- Products
-- Category ids are looked up by slug via CTE lookup below.
-- ────────────────────────────────────────────────────────────────────────────
with cat as (
  select id, slug from public.categories
)
insert into public.products (name, slug, description, price, compare_at_price, category_id, main_image, active, featured) values
(
  'Essential Crewneck Tee',
  'essential-crewneck-tee',
  'A wardrobe staple cut from heavyweight combed cotton with a relaxed fit and reinforced rib collar. Pre-shrunk so it keeps its shape wash after wash.',
  999, 1299, (select id from cat where slug = 'tshirts'),
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Boxy Oversized Tee',
  'boxy-oversized-tee',
  'An oversized boxy silhouette in soft garment-washed cotton jersey. The dropped shoulder and cropped hem give it that effortless street-luxe feel.',
  1199, null, (select id from cat where slug = 'tshirts'),
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Pima Cotton V-Neck',
  'pima-cotton-v-neck',
  'Made from long-staple Pima cotton for an ultra-soft hand feel. A refined V-neck cut that sits perfectly under blazers or on its own.',
  1399, 1699, (select id from cat where slug = 'tshirts'),
  'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=1200&q=80&auto=format&fit=crop', true, false
),
(
  'Athleisure Performance Tee',
  'athleisure-performance-tee',
  'Breathable moisture-wicking fabric with four-way stretch. Designed to move with you, from the gym to brunch and back.',
  1499, 1999, (select id from cat where slug = 'tshirts'),
  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=1200&q=80&auto=format&fit=crop', true, false
),
(
  'Classic Oxford Shirt',
  'classic-oxford-shirt',
  'A timeless button-down in crisp oxford cloth. Single chest pocket, mother-of-pearl buttons and a tailored fit — dress it up or down.',
  2199, 2799, (select id from cat where slug = 'shirts'),
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Linen Relaxed Shirt',
  'linen-relaxed-shirt',
  'Breathable European flax linen in a relaxed cut. Naturally textured, wrinkle-friendly and perfect for warm weather layering.',
  2499, null, (select id from cat where slug = 'shirts'),
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Slim Fit Poplin Shirt',
  'slim-fit-poplin-shirt',
  'A sharp slim-fit shirt in smooth two-way poplin. Excellent drape, neat collar and the perfect canvas for your favourite ties.',
  1999, 2499, (select id from cat where slug = 'shirts'),
  'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=1200&q=80&auto=format&fit=crop', true, false
),
(
  'Herringbone Flannel Shirt',
  'herringbone-flannel-shirt',
  'Warm brushed flannel with a classic herringbone weave. Relaxed fit with chest pockets — an autumn essential.',
  2299, 2899, (select id from cat where slug = 'shirts'),
  'https://images.unsplash.com/photo-1626497764746-6dc36559b758?w=1200&q=80&auto=format&fit=crop', true, false
),
(
  'Slim Fit Stretch Jeans',
  'slim-fit-stretch-jeans',
  'Slim-fit jeans in dark indigo with a touch of stretch for all-day comfort. Fades beautifully over time.',
  2499, 3299, (select id from cat where slug = 'denim'),
  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Relaxed Tapered Jeans',
  'relaxed-tapered-jeans',
  'A modern tapered cut with a relaxed thigh and clean ankle. Mid-weight denim that moves with you.',
  2299, null, (select id from cat where slug = 'denim'),
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&q=80&auto=format&fit=crop', true, false
),
(
  'Classic Straight-Leg Jeans',
  'classic-straight-leg-jeans',
  'The classic straight leg, cut from 12 oz non-stretch denim for an authentic vintage feel.',
  2699, 3199, (select id from cat where slug = 'denim'),
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Denim Trucker Jacket',
  'denim-trucker-jacket',
  'An iconic trucker silhouette in durable 14 oz denim. Waist-adjustable, with buttoned cuffs and a chest flap pocket.',
  3999, 4999, (select id from cat where slug = 'denim'),
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Quilted Liner Bomber',
  'quilted-liner-bomber',
  'A lightweight quilted bomber that works as a standalone piece or a toasty liner under a heavier coat.',
  4599, 5999, (select id from cat where slug = 'outerwear'),
  'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Wool Blend Overcoat',
  'wool-blend-overcoat',
  'A tailored overcoat in a soft wool blend with a sharp notch lapel. Side pockets, satin lining and a clean two-button front.',
  5999, 7999, (select id from cat where slug = 'outerwear'),
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Water-Resistant Parka',
  'water-resistant-parka',
  'A functional parka with a water-resistant shell, adjustable hood and fleece-lined pockets for deep-winter days.',
  5499, 6499, (select id from cat where slug = 'outerwear'),
  'https://images.unsplash.com/photo-1608234807905-4466023792f9?w=1200&q=80&auto=format&fit=crop', true, false
),
(
  'Twill Overshirt Jacket',
  'twill-overshirt-jacket',
  'A rugged overshirt in brushed cotton twill. Wear it open over a tee or layered with a hoodie — endlessly versatile.',
  3499, 4299, (select id from cat where slug = 'outerwear'),
  'https://images.unsplash.com/photo-1551538847-1dbeaf5f6573?w=1200&q=80&auto=format&fit=crop', true, false
),
(
  'Cotton Silk Kurta',
  'cotton-silk-kurta',
  'A hand-finished cotton-silk kurta with a mandarin collar and subtle tonal embroidery along the placket.',
  2599, 3299, (select id from cat where slug = 'ethnic-wear'),
  'https://images.unsplash.com/photo-1598550874175-4d7ef436e1f1?w=1200&q=80&auto=format&fit=crop', true, true
),
(
  'Ajrakh Print Kurta',
  'ajrakh-print-kurta',
  'Artisanal ajrakh block print on breathable mulmul cotton. Generous fit with side slits and a straight hem.',
  2899, null, (select id from cat where slug = 'ethnic-wear'),
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=80&auto=format&fit=crop', true, false
)
on conflict (slug) do nothing;

-- ────────────────────────────────────────────────────────────────────────────
-- Product images (gallery)
-- ────────────────────────────────────────────────────────────────────────────
with p as (select id, slug from public.products)
insert into public.product_images (product_id, image_url, sort_order) values
((select id from p where slug = 'essential-crewneck-tee'), 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'essential-crewneck-tee'), 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80&auto=format&fit=crop', 1),
((select id from p where slug = 'essential-crewneck-tee'), 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80&auto=format&fit=crop', 2),

((select id from p where slug = 'boxy-oversized-tee'), 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'boxy-oversized-tee'), 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'classic-oxford-shirt'), 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'classic-oxford-shirt'), 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80&auto=format&fit=crop', 1),
((select id from p where slug = 'classic-oxford-shirt'), 'https://images.unsplash.com/photo-1588359348347-9bf6c56e8b8d?w=1200&q=80&auto=format&fit=crop', 2),

((select id from p where slug = 'linen-relaxed-shirt'), 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'linen-relaxed-shirt'), 'https://images.unsplash.com/photo-1626497764746-6dc36559b758?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'slim-fit-poplin-shirt'), 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'slim-fit-poplin-shirt'), 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'herringbone-flannel-shirt'), 'https://images.unsplash.com/photo-1626497764746-6dc36559b758?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'herringbone-flannel-shirt'), 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'slim-fit-stretch-jeans'), 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'slim-fit-stretch-jeans'), 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'relaxed-tapered-jeans'), 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'relaxed-tapered-jeans'), 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'classic-straight-leg-jeans'), 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'classic-straight-leg-jeans'), 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'denim-trucker-jacket'), 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'denim-trucker-jacket'), 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'quilted-liner-bomber'), 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'quilted-liner-bomber'), 'https://images.unsplash.com/photo-1551538847-1dbeaf5f6573?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'wool-blend-overcoat'), 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'wool-blend-overcoat'), 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'water-resistant-parka'), 'https://images.unsplash.com/photo-1608234807905-4466023792f9?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'water-resistant-parka'), 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'twill-overshirt-jacket'), 'https://images.unsplash.com/photo-1551538847-1dbeaf5f6573?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'twill-overshirt-jacket'), 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'cotton-silk-kurta'), 'https://images.unsplash.com/photo-1598550874175-4d7ef436e1f1?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'cotton-silk-kurta'), 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=80&auto=format&fit=crop', 1),

((select id from p where slug = 'ajrakh-print-kurta'), 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=80&auto=format&fit=crop', 0),
((select id from p where slug = 'ajrakh-print-kurta'), 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80&auto=format&fit=crop', 1)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────────────────
-- Product variants (size × colour × stock)
-- ────────────────────────────────────────────────────────────────────────────
with p as (select id, slug from public.products)
insert into public.product_variants (product_id, size, color, sku, price, stock_quantity, active) values
-- Essential Crewneck Tee
((select id from p where slug = 'essential-crewneck-tee'), 'S', 'Heather Grey', 'TFH-TEE-001-S', 999, 18, true),
((select id from p where slug = 'essential-crewneck-tee'), 'M', 'Heather Grey', 'TFH-TEE-001-M', 999, 24, true),
((select id from p where slug = 'essential-crewneck-tee'), 'L', 'Heather Grey', 'TFH-TEE-001-L', 999, 30, true),
((select id from p where slug = 'essential-crewneck-tee'), 'XL', 'Heather Grey', 'TFH-TEE-001-XL', 999, 12, true),
((select id from p where slug = 'essential-crewneck-tee'), 'S', 'Black', 'TFH-TEE-001B-S', 999, 20, true),
((select id from p where slug = 'essential-crewneck-tee'), 'M', 'Black', 'TFH-TEE-001B-M', 999, 26, true),
((select id from p where slug = 'essential-crewneck-tee'), 'L', 'Black', 'TFH-TEE-001B-L', 999, 22, true),
((select id from p where slug = 'essential-crewneck-tee'), 'XL', 'Black', 'TFH-TEE-001B-XL', 999, 15, true),
-- Boxy Oversized Tee
((select id from p where slug = 'boxy-oversized-tee'), 'M', 'White', 'TFH-TEE-002-M', 1199, 28, true),
((select id from p where slug = 'boxy-oversized-tee'), 'L', 'White', 'TFH-TEE-002-L', 1199, 22, true),
((select id from p where slug = 'boxy-oversized-tee'), 'XL', 'White', 'TFH-TEE-002-XL', 1199, 16, true),
((select id from p where slug = 'boxy-oversized-tee'), 'M', 'Olive', 'TFH-TEE-002O-M', 1199, 14, true),
((select id from p where slug = 'boxy-oversized-tee'), 'L', 'Olive', 'TFH-TEE-002O-L', 1199, 18, true),
((select id from p where slug = 'boxy-oversized-tee'), 'XL', 'Olive', 'TFH-TEE-002O-XL', 1199, 10, true),
-- Pima Cotton V-Neck
((select id from p where slug = 'pima-cotton-v-neck'), 'S', 'Navy', 'TFH-TEE-003-S', 1399, 10, true),
((select id from p where slug = 'pima-cotton-v-neck'), 'M', 'Navy', 'TFH-TEE-003-M', 1399, 20, true),
((select id from p where slug = 'pima-cotton-v-neck'), 'L', 'Navy', 'TFH-TEE-003-L', 1399, 16, true),
((select id from p where slug = 'pima-cotton-v-neck'), 'XL', 'Navy', 'TFH-TEE-003-XL', 1399, 8, true),
-- Athleisure Performance Tee
((select id from p where slug = 'athleisure-performance-tee'), 'S', 'Grey', 'TFH-TEE-004-S', 1499, 12, true),
((select id from p where slug = 'athleisure-performance-tee'), 'M', 'Grey', 'TFH-TEE-004-M', 1499, 18, true),
((select id from p where slug = 'athleisure-performance-tee'), 'L', 'Grey', 'TFH-TEE-004-L', 1499, 14, true),
((select id from p where slug = 'athleisure-performance-tee'), 'XL', 'Grey', 'TFH-TEE-004-XL', 1499, 6, true),
-- Classic Oxford Shirt
((select id from p where slug = 'classic-oxford-shirt'), 'S', 'White', 'TFH-SHT-001-S', 2199, 20, true),
((select id from p where slug = 'classic-oxford-shirt'), 'M', 'White', 'TFH-SHT-001-M', 2199, 30, true),
((select id from p where slug = 'classic-oxford-shirt'), 'L', 'White', 'TFH-SHT-001-L', 2199, 28, true),
((select id from p where slug = 'classic-oxford-shirt'), 'XL', 'White', 'TFH-SHT-001-XL', 2199, 14, true),
((select id from p where slug = 'classic-oxford-shirt'), 'M', 'Sky Blue', 'TFH-SHT-001B-M', 2199, 12, true),
((select id from p where slug = 'classic-oxford-shirt'), 'L', 'Sky Blue', 'TFH-SHT-001B-L', 2199, 16, true),
-- Linen Relaxed Shirt
((select id from p where slug = 'linen-relaxed-shirt'), 'S', 'Sand', 'TFH-SHT-002-S', 2499, 10, true),
((select id from p where slug = 'linen-relaxed-shirt'), 'M', 'Sand', 'TFH-SHT-002-M', 2499, 14, true),
((select id from p where slug = 'linen-relaxed-shirt'), 'L', 'Sand', 'TFH-SHT-002-L', 2499, 12, true),
((select id from p where slug = 'linen-relaxed-shirt'), 'XL', 'Sand', 'TFH-SHT-002-XL', 2499, 8, true),
-- Slim Fit Poplin Shirt
((select id from p where slug = 'slim-fit-poplin-shirt'), 'M', 'Navy', 'TFH-SHT-003-M', 1999, 16, true),
((select id from p where slug = 'slim-fit-poplin-shirt'), 'L', 'Navy', 'TFH-SHT-003-L', 1999, 12, true),
((select id from p where slug = 'slim-fit-poplin-shirt'), 'XL', 'Navy', 'TFH-SHT-003-XL', 1999, 6, true),
-- Herringbone Flannel Shirt
((select id from p where slug = 'herringbone-flannel-shirt'), 'S', 'Rust', 'TFH-SHT-004-S', 2299, 8, true),
((select id from p where slug = 'herringbone-flannel-shirt'), 'M', 'Rust', 'TFH-SHT-004-M', 2299, 10, true),
((select id from p where slug = 'herringbone-flannel-shirt'), 'L', 'Rust', 'TFH-SHT-004-L', 2299, 12, true),
((select id from p where slug = 'herringbone-flannel-shirt'), 'M', 'Forest', 'TFH-SHT-004B-M', 2299, 9, true),
((select id from p where slug = 'herringbone-flannel-shirt'), 'L', 'Forest', 'TFH-SHT-004B-L', 2299, 7, true),
-- Slim Fit Stretch Jeans
((select id from p where slug = 'slim-fit-stretch-jeans'), '30', 'Indigo', 'TFH-JNS-001-30', 2499, 15, true),
((select id from p where slug = 'slim-fit-stretch-jeans'), '32', 'Indigo', 'TFH-JNS-001-32', 2499, 25, true),
((select id from p where slug = 'slim-fit-stretch-jeans'), '34', 'Indigo', 'TFH-JNS-001-34', 2499, 20, true),
((select id from p where slug = 'slim-fit-stretch-jeans'), '36', 'Indigo', 'TFH-JNS-001-36', 2499, 8, true),
-- Relaxed Tapered Jeans
((select id from p where slug = 'relaxed-tapered-jeans'), '30', 'Mid Wash', 'TFH-JNS-002-30', 2299, 5, true),
((select id from p where slug = 'relaxed-tapered-jeans'), '32', 'Mid Wash', 'TFH-JNS-002-32', 2299, 12, true),
((select id from p where slug = 'relaxed-tapered-jeans'), '34', 'Mid Wash', 'TFH-JNS-002-34', 2299, 10, true),
((select id from p where slug = 'relaxed-tapered-jeans'), '36', 'Mid Wash', 'TFH-JNS-002-36', 2299, 3, true),
-- Classic Straight-Leg Jeans
((select id from p where slug = 'classic-straight-leg-jeans'), '30', 'Black', 'TFH-JNS-003-30', 2699, 6, true),
((select id from p where slug = 'classic-straight-leg-jeans'), '32', 'Black', 'TFH-JNS-003-32', 2699, 14, true),
((select id from p where slug = 'classic-straight-leg-jeans'), '34', 'Black', 'TFH-JNS-003-34', 2699, 11, true),
((select id from p where slug = 'classic-straight-leg-jeans'), '36', 'Black', 'TFH-JNS-003-36', 2699, 4, true),
-- Denim Trucker Jacket
((select id from p where slug = 'denim-trucker-jacket'), 'S', 'Classic Blue', 'TFH-OTW-001-S', 3999, 8, true),
((select id from p where slug = 'denim-trucker-jacket'), 'M', 'Classic Blue', 'TFH-OTW-001-M', 3999, 14, true),
((select id from p where slug = 'denim-trucker-jacket'), 'L', 'Classic Blue', 'TFH-OTW-001-L', 3999, 12, true),
((select id from p where slug = 'denim-trucker-jacket'), 'XL', 'Classic Blue', 'TFH-OTW-001-XL', 3999, 5, true),
-- Quilted Liner Bomber
((select id from p where slug = 'quilted-liner-bomber'), 'S', 'Black', 'TFH-OTW-002-S', 4599, 6, true),
((select id from p where slug = 'quilted-liner-bomber'), 'M', 'Black', 'TFH-OTW-002-M', 4599, 10, true),
((select id from p where slug = 'quilted-liner-bomber'), 'L', 'Black', 'TFH-OTW-002-L', 4599, 9, true),
((select id from p where slug = 'quilted-liner-bomber'), 'XL', 'Black', 'TFH-OTW-002-XL', 4599, 4, true),
-- Wool Blend Overcoat
((select id from p where slug = 'wool-blend-overcoat'), 'M', 'Charcoal', 'TFH-OTW-003-M', 5999, 5, true),
((select id from p where slug = 'wool-blend-overcoat'), 'L', 'Charcoal', 'TFH-OTW-003-L', 5999, 7, true),
((select id from p where slug = 'wool-blend-overcoat'), 'XL', 'Charcoal', 'TFH-OTW-003-XL', 5999, 4, true),
-- Water-Resistant Parka
((select id from p where slug = 'water-resistant-parka'), 'S', 'Army Green', 'TFH-OTW-004-S', 5499, 3, true),
((select id from p where slug = 'water-resistant-parka'), 'M', 'Army Green', 'TFH-OTW-004-M', 5499, 8, true),
((select id from p where slug = 'water-resistant-parka'), 'L', 'Army Green', 'TFH-OTW-004-L', 5499, 6, true),
((select id from p where slug = 'water-resistant-parka'), 'XL', 'Army Green', 'TFH-OTW-004-XL', 5499, 2, true),
-- Twill Overshirt Jacket
((select id from p where slug = 'twill-overshirt-jacket'), 'S', 'Taupe', 'TFH-OTW-005-S', 3499, 9, true),
((select id from p where slug = 'twill-overshirt-jacket'), 'M', 'Taupe', 'TFH-OTW-005-M', 3499, 13, true),
((select id from p where slug = 'twill-overshirt-jacket'), 'L', 'Taupe', 'TFH-OTW-005-L', 3499, 11, true),
((select id from p where slug = 'twill-overshirt-jacket'), 'XL', 'Taupe', 'TFH-OTW-005-XL', 3499, 5, true),
-- Cotton Silk Kurta
((select id from p where slug = 'cotton-silk-kurta'), 'M', 'Ivory', 'TFH-ETH-001-M', 2599, 15, true),
((select id from p where slug = 'cotton-silk-kurta'), 'L', 'Ivory', 'TFH-ETH-001-L', 2599, 13, true),
((select id from p where slug = 'cotton-silk-kurta'), 'XL', 'Ivory', 'TFH-ETH-001-XL', 2599, 9, true),
((select id from p where slug = 'cotton-silk-kurta'), 'M', 'Teal', 'TFH-ETH-001B-M', 2599, 5, true),
((select id from p where slug = 'cotton-silk-kurta'), 'L', 'Teal', 'TFH-ETH-001B-L', 2599, 7, true),
-- Ajrakh Print Kurta
((select id from p where slug = 'ajrakh-print-kurta'), 'M', 'Indigo', 'TFH-ETH-002-M', 2899, 6, true),
((select id from p where slug = 'ajrakh-print-kurta'), 'L', 'Indigo', 'TFH-ETH-002-L', 2899, 8, true),
((select id from p where slug = 'ajrakh-print-kurta'), 'XL', 'Indigo', 'TFH-ETH-002-XL', 2899, 4, true)
on conflict on constraint product_variants_product_id_size_color_key do nothing;