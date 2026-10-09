-- Categoría de cada novedad, para los filtros de /novedades. Las opciones están en lib/novedades.ts
-- y se eligen en el admin al crear o editar una novedad.
alter table novedades add column if not exists categoria text;

-- Las que ya existían (por ahora "Se lanza Futboleros!!") van a Actualizaciones
update novedades set categoria = 'Actualizaciones' where categoria is null;
