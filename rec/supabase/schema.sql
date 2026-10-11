-- Run this whole file in Supabase Dashboard -> SQL Editor. Safe to re-run.
-- No login system: anyone can VIEW and anyone can SHARE a bus location.

create table if not exists buses (
  id bigint generated always as identity primary key,
  name text not null,
  route_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
-- Exactly one row per bus = latest location only (no unlimited history).
create table if not exists bus_locations (
  id bigint generated always as identity primary key,
  bus_id bigint not null unique references buses(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  sharing boolean not null default true,     -- false after Stop Sharing
  is_demo boolean not null default false,    -- true for simulated movement
  shared_by text,                            -- anonymous per-device id (lock)
  updated_at timestamptz not null default now()
);
create table if not exists bus_stops (
  id bigint generated always as identity primary key,
  bus_id bigint not null references buses(id) on delete cascade,
  stop_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  stop_order int not null
);

-- Clean up anything from the older login-based version
drop table if exists profiles cascade;
drop function if exists is_admin() cascade;
drop function if exists handle_new_user() cascade;

alter table buses enable row level security;
alter table bus_locations enable row level security;
alter table bus_stops enable row level security;

drop policy if exists "read buses" on buses;
drop policy if exists "admin buses" on buses;
drop policy if exists "read stops" on bus_stops;
drop policy if exists "admin stops" on bus_stops;
drop policy if exists "read locations" on bus_locations;
drop policy if exists "authorized sharers insert locations" on bus_locations;
drop policy if exists "authorized sharers update locations" on bus_locations;
drop policy if exists "public insert locations" on bus_locations;
drop policy if exists "public update locations" on bus_locations;
drop policy if exists "anyone insert locations" on bus_locations;
drop policy if exists "anyone update locations" on bus_locations;

-- Everyone can read. Buses and stops are edited only from the Supabase dashboard (Table Editor / SQL).
create policy "read buses" on buses for select using (true);
create policy "read stops" on bus_stops for select using (true);
create policy "read locations" on bus_locations for select using (true);

-- Anyone may write a location, but only sane values (loose box around Chennai; widen it if your buses go further).
create policy "anyone insert locations" on bus_locations for insert to anon, authenticated
  with check (
    shared_by is not null
    and latitude between 12.0 and 14.0 and longitude between 79.5 and 81.0
  );
create policy "anyone update locations" on bus_locations for update to anon, authenticated
  using (true)
  with check (
    shared_by is not null
    and latitude between 12.0 and 14.0 and longitude between 79.5 and 81.0
  );
-- (No delete policy: nobody can delete rows from the app.)

-- ---------- "One broadcaster per bus" lock + server clock ----------
-- A different device cannot update a bus that another device updated within the last 60 seconds.
-- updated_at is always SERVER time, so a phone with a wrong clock cannot break the lock or the "x s ago" display.
-- Also rejects updates arriving faster than once per second per bus (basic flood protection).
create or replace function enforce_single_sharer() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if old.sharing and old.shared_by is not null and new.shared_by is distinct from old.shared_by
       and now() - old.updated_at < interval '60 seconds' then
      raise exception 'This bus is currently being shared by another device';
    end if;
    if new.shared_by is not distinct from old.shared_by and new.sharing = old.sharing
       and now() - old.updated_at < interval '1 second' then
      return old; -- ignore flood, keep the existing row
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists bus_locations_single_sharer on bus_locations;
create trigger bus_locations_single_sharer before insert or update on bus_locations
  for each row execute function enforce_single_sharer();

-- ---------- Realtime ----------
do $$ begin
  alter publication supabase_realtime add table bus_locations;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table buses;
exception when duplicate_object then null; end $$;

-- Next: run supabase/seed_rec_routes.sql to load the 6 REC routes.
