create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null, price int not null, category text not null,
  size text, condition text, image_url text, stock int not null default 1,
  created_at timestamptz default now()
);
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null, total int not null,
  status text not null default 'pending',  -- pending | paid | shipped | cancelled
  created_at timestamptz default now()
);
alter table products enable row level security;
alter table orders enable row level security;
create policy "products public read" on products for select using (true);
create policy "orders own read" on orders for select using (auth.uid() = user_id);
create policy "orders own insert" on orders for insert with check (auth.uid() = user_id and status = 'pending');
insert into products (name, price, category, size, condition) values
('Boxy Denim Jacket', 189000, 'Jaket', 'L', 'Like new'),
('Vintage Band Tee', 129000, 'Atasan', 'M', 'Good'),
('Pleated Wool Trousers', 169000, 'Bawahan', '32', 'Like new'),
('Corduroy Overshirt', 149000, 'Jaket', 'XL', 'Good'),
('Washed Carpenter Pants', 175000, 'Bawahan', '30', 'Good'),
('Striped Knit Sweater', 139000, 'Atasan', 'M', 'Like new'),
('Leather Crossbody Bag', 219000, 'Aksesoris', '-', 'Good'),
('Retro Track Jacket', 199000, 'Jaket', 'L', 'Like new');
