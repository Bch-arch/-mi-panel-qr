-- Corrige instalaciones donde la migración anterior pudo dejar activa la
-- política "qr_codes_delete_own" original junto a una política "own delete".
-- Termina con una sola política DELETE conocida y preserva el borrado de QR
-- individuales del propietario, excluyendo siempre unidades de lotes.

drop policy if exists "own delete" on public.qr_codes;
drop policy if exists "qr_codes_delete_own" on public.qr_codes;

create policy "qr_codes_delete_own" on public.qr_codes
  for delete using (auth.uid() = user_id and batch_id is null);
