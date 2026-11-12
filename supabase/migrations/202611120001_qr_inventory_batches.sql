-- Inventario de QR imprimibles. Migración aditiva: conserva los QR actuales
-- y no toca public.employees ni elimina registros.

create table if not exists public.qr_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  name text not null,
  quantity integer not null check (quantity between 1 and 50),
  created_at timestamptz not null default now()
);

create unique index if not exists qr_batches_id_user_idx
  on public.qr_batches (id, user_id);

alter table public.qr_codes
  add column if not exists batch_id uuid,
  add column if not exists unit_number integer,
  add column if not exists store_name text,
  add column if not exists inventory_status text not null default 'asignado';

alter table public.qr_codes alter column destination drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'qr_codes_batch_owner_fkey'
      and conrelid = 'public.qr_codes'::regclass
  ) then
    alter table public.qr_codes
      add constraint qr_codes_batch_owner_fkey
      foreign key (batch_id, user_id)
      references public.qr_batches(id, user_id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'qr_codes_inventory_status_check'
      and conrelid = 'public.qr_codes'::regclass
  ) then
    alter table public.qr_codes
      add constraint qr_codes_inventory_status_check
      check (inventory_status in ('disponible', 'asignado'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'qr_codes_batch_unit_pair_check'
      and conrelid = 'public.qr_codes'::regclass
  ) then
    alter table public.qr_codes
      add constraint qr_codes_batch_unit_pair_check
      check ((batch_id is null) = (unit_number is null));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'qr_codes_available_state_check'
      and conrelid = 'public.qr_codes'::regclass
  ) then
    alter table public.qr_codes
      add constraint qr_codes_available_state_check
      check (
        (inventory_status = 'disponible'
          and destination is null
          and store_name is null
          and status = 'borrador'
          and batch_id is not null
          and unit_number is not null)
        or (inventory_status = 'asignado' and destination is not null)
      );
  end if;
end;
$$;

create unique index if not exists qr_codes_batch_unit_idx
  on public.qr_codes (batch_id, unit_number)
  where batch_id is not null;

create index if not exists qr_codes_inventory_idx
  on public.qr_codes (user_id, inventory_status, status);

create index if not exists qr_batches_user_created_idx
  on public.qr_batches (user_id, created_at desc);

alter table public.qr_batches enable row level security;

drop policy if exists "qr batches select own" on public.qr_batches;
create policy "qr batches select own" on public.qr_batches
  for select using (auth.uid() = user_id);

drop policy if exists "qr batches insert own" on public.qr_batches;
create policy "qr batches insert own" on public.qr_batches
  for insert with check (auth.uid() = user_id);

-- Conserva la acción de borrado para QR antiguos/individuales, pero no permite
-- romper el contenido de un lote borrando una de sus unidades por REST.
drop policy if exists "own delete" on public.qr_codes;
create policy "own delete" on public.qr_codes
  for delete using (auth.uid() = user_id and batch_id is null);

create or replace function public.create_qr_batch(
  p_name text,
  p_quantity integer,
  p_codes text[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_batch_id uuid;
  v_existing_count integer;
begin
  if v_user_id is null then
    raise exception 'Se requiere una sesión autenticada.' using errcode = '42501';
  end if;

  if p_name is null or length(btrim(p_name)) not between 1 and 80 then
    raise exception 'El nombre del lote debe tener entre 1 y 80 caracteres.'
      using errcode = '22023';
  end if;

  if p_quantity is null or p_quantity not between 1 and 50
     or coalesce(array_length(p_codes, 1), 0) <> p_quantity
     or (select count(distinct code) from unnest(p_codes) as codes(code)) <> p_quantity
     or exists (select 1 from unnest(p_codes) as codes(code) where code !~ '^[A-Za-z0-9]{8,32}$') then
    raise exception 'Cantidad o identificadores de lote no válidos.'
      using errcode = '22023';
  end if;

  -- Respeta el límite actual de 50 QR por usuario y serializa lotes concurrentes.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select count(*) into v_existing_count
    from public.qr_codes where user_id = v_user_id;
  if v_existing_count + p_quantity > 50 then
    raise exception 'El lote supera el límite actual de 50 QR por usuario.'
      using errcode = '23514';
  end if;

  insert into public.qr_batches (user_id, name, quantity)
  values (v_user_id, btrim(p_name), p_quantity)
  returning id into v_batch_id;

  insert into public.qr_codes (
    user_id, name, destination, code, status, scans,
    batch_id, unit_number, inventory_status
  )
  select
    v_user_id,
    btrim(p_name) || ' · Unidad ' || lpad(units.ordinality::text, 3, '0'),
    null,
    units.code,
    'borrador',
    0,
    v_batch_id,
    units.ordinality::integer,
    'disponible'
  from unnest(p_codes) with ordinality as units(code, ordinality);

  return v_batch_id;
end;
$$;

revoke all on function public.create_qr_batch(text, integer, text[]) from public;
revoke all on function public.create_qr_batch(text, integer, text[]) from anon;
grant execute on function public.create_qr_batch(text, integer, text[]) to authenticated;

comment on table public.qr_batches is
  'Lotes de QR físicos; las unidades se conservan en qr_codes.';
comment on column public.qr_codes.inventory_status is
  'disponible para asignar o asignado a una tienda/destino; el estado de redirección sigue en status.';
