-- Esquema base y seguridad (auth + persistencia multiusuario).
-- En instalaciones existentes, no volver a ejecutar para "actualizar" datos:
-- aplicar las migraciones versionadas de supabase/migrations en su lugar.
-- El inventario por lotes se añade mediante 202611120001_qr_inventory_batches.sql.

-- 1. Tabla de codigos QR.
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  destination text not null,
  code text not null unique,
  -- La migración de inventario completa su FK al lote.
  batch_id uuid,
  status text not null default 'activo'
    check (status in ('activo','pausado','borrador')),
  scans integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qr_codes_user_id_idx on public.qr_codes (user_id);

-- 2. Row Level Security: cada usuario solo accede a sus propias filas.
alter table public.qr_codes enable row level security;

drop policy if exists "own select" on public.qr_codes;
drop policy if exists "own insert" on public.qr_codes;
drop policy if exists "own update" on public.qr_codes;
drop policy if exists "own delete" on public.qr_codes;
drop policy if exists "qr_codes_delete_own" on public.qr_codes;

create policy "own select" on public.qr_codes
  for select using (auth.uid() = user_id);

create policy "own insert" on public.qr_codes
  for insert with check (auth.uid() = user_id);

create policy "own update" on public.qr_codes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "qr_codes_delete_own" on public.qr_codes
  for delete using (auth.uid() = user_id and batch_id is null);

-- 3. Redireccion publica: quien escanea un QR no tiene sesion.
-- SECURITY DEFINER con search_path fijo; solo devuelve el destino si el QR
-- esta activo e incrementa el contador. No expone ninguna fila al publico.
create or replace function public.resolve_qr(p_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_destination text;
begin
  update public.qr_codes
     set scans = scans + 1,
         updated_at = now()
   where code = p_slug
     and status = 'activo'
  returning destination into v_destination;

  return v_destination;
end;
$$;

revoke all on function public.resolve_qr(text) from public;
grant execute on function public.resolve_qr(text) to anon, authenticated;
