-- Fondo del encabezado de la página del grupo en la web. Si queda vacío se usa el predeterminado (/fondos/grupos.webp).
-- Lo carga el admin desde el editor de grupo de la app: la imagen va al bucket "avatares" como
-- grupo_<id>_fondo_<fecha>.jpg, igual que la foto del grupo (grupo_<id>_<fecha>.jpg)
alter table grupos add column if not exists fondo_url text;
