# Inventario de QR por lotes

## Cambios SQL

La migración `supabase/migrations/202611120001_qr_inventory_batches.sql` realiza únicamente cambios aditivos:

- Crea `public.qr_batches` para registrar nombre, cantidad, usuario propietario y fecha del lote.
- Añade a `public.qr_codes` `batch_id`, `unit_number`, `store_name` e `inventory_status`.
- Permite `destination = NULL` para unidades nuevas no asignadas. Las filas existentes conservan su destino y reciben `inventory_status = 'asignado'` mediante el valor predeterminado.
- Añade unicidad por lote/unidad. La restricción `UNIQUE(code)` ya existente sigue protegiendo los identificadores públicos globalmente.
- Crea la RPC transaccional `create_qr_batch`, que inserta el lote y todas sus unidades o no inserta ninguna. Exige sesión autenticada y solo concede ejecución al rol `authenticated`; `anon` no puede llamar a esta RPC.
- Habilita RLS en `qr_batches`; las políticas nuevas limitan lectura e inserción al propietario autenticado. Las políticas de lectura, inserción y actualización existentes de `qr_codes` permanecen intactas.
- Endurece la política de borrado de `qr_codes`: los QR individuales existentes siguen siendo eliminables, pero una unidad de lote no se puede borrar y dejar incompleto su paquete de impresión.

No cambia `employees`, no elimina filas, no regenera códigos y no toca contadores ni fechas de los QR existentes. La relación del lote usa `ON DELETE RESTRICT` para impedir que borrar un lote separe unidades de su historial.

## Aplicación

- Proyecto existente: revisar y ejecutar solamente la migración nueva en Supabase SQL Editor, después de guardar una copia de seguridad habitual. El SQL es idempotente para poder reintentarlo.
- Proyecto nuevo: ejecutar primero `supabase/schema.sql` y luego las migraciones versionadas en orden.
- Esta implementación no ejecuta SQL ni conecta a la instancia remota. La sección de inventario requiere que la migración esté aplicada.

La cuenta debe tener configurado `QR_PUBLIC_BASE_URL` con el origen HTTPS público de producción. La exportación de ZIP y CSV falla explícitamente si falta o si apunta a localhost; no se imprimen URLs de desarrollo.
