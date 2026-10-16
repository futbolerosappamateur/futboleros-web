-- Versión de la publicidad para celular (2026-10-16). Es opcional: si está cargada, en pantallas
-- de hasta 640 px se muestra esta imagen en lugar de la ancha; si no, la ancha se ve entera.
alter table publicidades add column if not exists imagen_mobile_url text;

-- Control: tiene que aparecer la columna nueva
select column_name, data_type
from information_schema.columns
where table_name = 'publicidades' and column_name = 'imagen_mobile_url';
