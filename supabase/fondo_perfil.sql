-- Fondo del encabezado del perfil en la web. Si queda vacío se usa el predeterminado (/fondos/jugador.webp).
-- La imagen se sube al bucket "avatares" como perfil_<id>_fondo_<fecha>.jpg: mismo permiso que la foto,
-- y eliminar-cuenta la borra junto con el resto de los archivos perfil_<id>_
alter table perfiles add column if not exists fondo_url text;
