-- ============================================================
-- Carta de Tragos SNACK Ristrel - Supabase Setup
-- ============================================================
-- Correr este SQL en el SQL Editor de Supabase (una sola vez)
-- ============================================================

-- Tabla de secciones del menu
create table if not exists menu_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Tabla de items del menu
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references menu_sections(id) on delete cascade,
  name text not null,
  price text,
  description text,
  tags text not null default '',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_menu_items_section on menu_items(section_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table menu_sections enable row level security;
alter table menu_items enable row level security;

-- Lectura publica (cualquiera con el anon key puede SELECT)
drop policy if exists "Public read sections" on menu_sections;
create policy "Public read sections" on menu_sections
  for select using (true);

drop policy if exists "Public read items" on menu_items;
create policy "Public read items" on menu_items
  for select using (true);

-- Escritura solo para usuarios autenticados
drop policy if exists "Auth write sections" on menu_sections;
create policy "Auth write sections" on menu_sections
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Auth write items" on menu_items;
create policy "Auth write items" on menu_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- Seed: secciones e items actuales
-- ============================================================
do $$
declare
  s_nacionales uuid;
  s_cervezas uuid;
  s_importados uuid;
  s_caipis uuid;
begin
  -- Si ya hay datos, no re-seedear
  if exists (select 1 from menu_sections) then
    return;
  end if;

  insert into menu_sections (name, sort_order) values ('Tragos Nacionales', 10) returning id into s_nacionales;
  insert into menu_sections (name, sort_order) values ('Cervezas', 20) returning id into s_cervezas;
  insert into menu_sections (name, sort_order) values ('Tragos Importados', 30) returning id into s_importados;
  insert into menu_sections (name, sort_order) values ('Caipis', 40) returning id into s_caipis;

  insert into menu_items (section_id, name, price, description, tags, sort_order) values
    (s_nacionales, 'Aperol Spritz', '9.000', 'Aperol, espumante y soda', 'aperitivo spritz', 10),
    (s_nacionales, 'Batido de Gancia', '9.000', 'Gancia + azucar + limon', 'aperitivo gancia', 20),
    (s_nacionales, 'Campari con Naranja', '8.000', null, 'aperitivo campari', 30),
    (s_nacionales, 'Cynar Julep', '8.000', 'Hojas de menta, azucar, jugo de limon, cynar, jugo de pomelo rosado', 'aperitivo cynar frutal pomelo', 40),
    (s_nacionales, 'Cynar Pomelo', '8.000', 'Cynar + paso los toros pomelo', 'aperitivo cynar pomelo', 50),
    (s_nacionales, 'Daikiri', '8.500', 'Ron + pulpa a eleccion (frutilla, frutos rojos, maracuya o anana)', 'ron frutal daikiri frutilla rojos maracuya anana', 60),
    (s_nacionales, 'Destornillador', '8.000', 'Jugo de naranja + vodka', 'vodka naranja', 70),
    (s_nacionales, 'Fernet con Pepsi', '8.000', null, 'aperitivo fernet pepsi', 80),
    (s_nacionales, 'Gin Tonic con Frutos Rojos', '9.000', null, 'gin tonic frutal rojos', 90),
    (s_nacionales, 'Gin Tonic Nacional', '8.000', null, 'gin tonic nacional', 100),
    (s_nacionales, 'Mojito', '9.000', 'Ron, hojas de menta, azucar, lima, hielo, y soda', 'ron mojito menta lima', 110),
    (s_nacionales, 'Mojito Blue', '9.000', 'Lima, Ron, Blue Curacao, hojas de menta y 7up', 'ron mojito blue lima curacao', 120),
    (s_nacionales, 'Negroni', '9.000', 'Gin, campari y vermouth', 'gin campari vermouth negroni', 130),
    (s_nacionales, 'Ocean Spritz', '9.000', 'Gin, Blue curacao, espumante y soda', 'gin spritz blue curacao', 140),
    (s_nacionales, 'Ruso Blanco', '9.000', 'En honor al gran Lebowski: Vodka, crema de leche, hielo y licor de cafe', 'vodka cafe ruso lebowski', 150),
    (s_nacionales, 'Sex on the Beach', '8.000', 'Jugo de naranja + vodka + licor de durazno + granadina', 'vodka frutal naranja durazno', 160),
    (s_nacionales, 'Tequila Sunrise', '9.000', 'Tequila + jugo de naranja', 'tequila frutal naranja sunrise', 170),
    (s_nacionales, 'Tinto de Verano', '8.000', 'Vino malbec, 7up y hielo', 'vino malbec tinto verano', 180),
    (s_nacionales, 'Trago Largo Energizante', '9.000', 'Vodka + speed', 'vodka energizante speed', 190),
    (s_nacionales, 'Whiscola', '8.000', null, 'whisky whiscola pepsi', 200);

  insert into menu_items (section_id, name, price, description, tags, sort_order) values
    (s_cervezas, 'Chopp de Patagonia 300cc', null, null, 'cerveza patagonia', 10),
    (s_cervezas, 'Chopp de Stella 300cc', null, null, 'cerveza stella', 20),
    (s_cervezas, 'Corona Porron', null, null, 'cerveza corona porron', 30),
    (s_cervezas, 'Lata de Quilmes', null, null, 'cerveza quilmes lata', 40),
    (s_cervezas, 'Lata Patagonia 473', null, null, 'cerveza patagonia lata', 50),
    (s_cervezas, 'Pinta Patagonia 500cc', null, null, 'cerveza patagonia pinta', 60),
    (s_cervezas, 'Pinta Stella 500 cc', null, null, 'cerveza stella pinta', 70),
    (s_cervezas, 'Quilmes Lata 473 cc', null, null, 'cerveza quilmes lata', 80),
    (s_cervezas, 'Stella Artois Lata 473 cc', null, null, 'cerveza stella lata', 90);

  insert into menu_items (section_id, name, price, description, tags, sort_order) values
    (s_importados, 'Malibu Cola', '9.000', 'Malibu + pepsi', 'ron malibu cola pepsi', 10),
    (s_importados, 'Malibu Punch', '9.000', 'Malibu + jugo de naranja', 'ron malibu frutal punch naranja', 20),
    (s_importados, 'Malibu Sunrise', '9.000', 'Malibu, pulpa de anana, jugo de naranja y granadina', 'ron malibu frutal sunrise anana', 30),
    (s_importados, 'Trago Absolut', '10.000', 'Con pepsi o jugo de naranja', 'vodka absolut pepsi naranja', 40),
    (s_importados, 'Trago Bacardi con Pepsi', '9.000', null, 'ron bacardi pepsi', 50),
    (s_importados, 'Trago Beefeater Tonic', '11.000', null, 'gin beefeater tonic', 60),
    (s_importados, 'Trago Bombay Tonic', '11.000', null, 'gin bombay tonic', 70),
    (s_importados, 'Trago Jack Daniels con Pepsi', '12.000', null, 'whisky jack daniels pepsi', 80),
    (s_importados, 'Trago Jagermeister', '11.000', null, 'aperitivo jagermeister jagger', 90),
    (s_importados, 'Trago Tanqueray Tonic', '11.000', null, 'gin tanqueray tonic', 100),
    (s_importados, 'Trago Tequila Cuervo Sunrise', '10.000', null, 'tequila cuervo sunrise frutal', 110);

  insert into menu_items (section_id, name, price, description, tags, sort_order) values
    (s_caipis, 'Caipi Frutos Rojos', '9.500', 'Vodka, hielo, lima, frutos rojos y azucar', 'vodka frutal caipi rojos', 10),
    (s_caipis, 'Caipirinha', '9.000', 'Cachaza, lima, hielo y azucar', 'ron caipirinha cachaza lima', 20),
    (s_caipis, 'Caipirissima', '9.000', 'Ron, lima, hielo y azucar', 'ron caipirissima lima', 30),
    (s_caipis, 'Caipiroshka', '9.000', 'Vodka, hielo, lima y azucar', 'vodka caipiroshka lima', 40),
    (s_caipis, 'Caipiuva', '9.000', 'Vino malbec, hielo, lima y azucar', 'vino malbec caipiuva lima', 50),
    (s_caipis, 'Jaggerinha', '11.000', 'Jaggermeister, lima y azucar', 'aperitivo jagger jaggerinha lima', 60);
end $$;
