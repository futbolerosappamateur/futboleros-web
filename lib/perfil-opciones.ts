// Opciones del perfil: copia de las listas de la app (futboleros/screens/EditarPerfil.js).
// Si se agregan o cambian opciones en la app, hay que actualizarlas acá también.

export const GENEROS = ['Masculino', 'Femenino', 'Otro']

// Las listas masculina y femenina van en el mismo orden: al cambiar de género se traduce por posición
export const ESTILOS_MASC = ['Pichero', 'Morfón', 'Rústico', 'Mágico', 'Lagunero', 'Arquero', 'Todoterreno', 'Defensivo', 'Ofensivo']
export const ESTILOS_FEM  = ['Pichera', 'Morfona', 'Rústica', 'Mágica', 'Lagunera', 'Arquera', 'Todoterreno', 'Defensiva', 'Ofensiva']

const CARACT_BASE = [
  'Atajando soy Clemente',
  'Siempre llego tarde',
  'Me canso en el primer tiempo',
  'Gambeteo hasta al árbitro',
  'Grito los goles propios y ajenos',
  'Me lesiono mirando',
  'Tengo un caño guardado',
  'Siempre tengo una excusa',
  'Me la paso pidiendo la pelota',
  'Entro fuerte pero con respeto',
  'Cobro todo foul',
  'Soy más de cabeza que de pie',
  'La toco y me voy',
  'Hablo todo el partido',
]
export const CARACT_MASC = ['Adicto al puntinazo', ...CARACT_BASE]
export const CARACT_FEM  = ['Adicta al puntinazo', ...CARACT_BASE]
export const MAX_CARACTERISTICAS = 3

export const PAISES = [
  { code: 'AR', nombre: 'Argentina' }, { code: 'BR', nombre: 'Brasil' },
  { code: 'UY', nombre: 'Uruguay' }, { code: 'PY', nombre: 'Paraguay' },
  { code: 'CL', nombre: 'Chile' }, { code: 'CO', nombre: 'Colombia' },
  { code: 'PE', nombre: 'Perú' }, { code: 'BO', nombre: 'Bolivia' },
  { code: 'VE', nombre: 'Venezuela' }, { code: 'EC', nombre: 'Ecuador' },
  { code: 'MX', nombre: 'México' }, { code: 'ES', nombre: 'España' },
  { code: 'IT', nombre: 'Italia' }, { code: 'DE', nombre: 'Alemania' },
  { code: 'FR', nombre: 'Francia' }, { code: 'PT', nombre: 'Portugal' },
  { code: 'GB', nombre: 'Inglaterra' }, { code: 'US', nombre: 'EE.UU.' },
]
export const NOMBRE_PAIS: Record<string, string> = Object.fromEntries(PAISES.map(p => [p.code, p.nombre]))

export const TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const REDES = [
  { key: 'instagram', label: 'Instagram', placeholder: 'tu_usuario', icono: '/redes/instagram.webp' },
  { key: 'facebook', label: 'Facebook', placeholder: 'tu.usuario', icono: '/redes/facebook.webp' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'tu_usuario', icono: '/redes/tiktok.webp' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'tu_usuario', icono: '/redes/x.webp' },
  { key: 'youtube', label: 'YouTube', placeholder: 'tu_canal', icono: '/redes/youtube.webp' },
  { key: 'web', label: 'Tu web', placeholder: 'https://tusitio.com', icono: '/redes/web.webp' },
]

// Del usuario cargado al link de su perfil, como en la app (screens/VerPerfil.js).
// Si cargaron directamente un link http(s), se usa tal cual.
export function urlRed(key: string, valor: string) {
  const v = valor.trim()
  if (/^https?:\/\//i.test(v)) return v
  const u = v.replace(/^@/, '')
  switch (key) {
    case 'instagram': return `https://instagram.com/${u}`
    case 'facebook': return `https://facebook.com/${u}`
    case 'tiktok': return `https://tiktok.com/@${u}`
    case 'x': return `https://x.com/${u}`
    case 'youtube': return `https://youtube.com/@${u}`
    default: return `https://${v}`
  }
}

export const CLUBES = [
  // Argentina — Primera División
  'River Plate','Boca Juniors','Racing Club','Independiente','Independiente Rivadavia',
  'San Lorenzo','Huracán','Vélez Sársfield','Estudiantes','Gimnasia y Esgrima La Plata',
  'Talleres','Belgrano','Colón',"Newell's Old Boys",'Rosario Central','Lanús','Banfield',
  'Platense','Aldosivi','Tigre','Argentinos Juniors','Defensa y Justicia','Godoy Cruz',
  'Patronato','Atlético Tucumán','Atlético Rafaela','San Martín de Tucumán','Sarmiento',
  'Central Córdoba','Instituto','San Martín de San Juan','Barracas Central',
  'Arsenal de Sarandí','Riestra','Unión',
  // Argentina — Ascenso
  'All Boys','Almagro','Almirante Brown','Agropecuario','Acassuso','Armenio','Atlanta',
  'Berazategui','Central Ballester','Central Español','Central Norte','Chacarita',
  'Chaco For Ever','Ciudad Bolívar','Claypole','Colegiales','Comunicaciones',
  'Defensores de Belgrano','Defensores de Cambaceres','Deportivo Español',
  'Deportivo Madryn','Deportivo Maipú','Deportivo Merlo','Dock Sud','El Porvenir',
  'Estrella del Sur','Excursionistas','Ferrocarril Oeste','Flandria','Güemes',
  'Juventud Unida','Laferrere','Lamadrid','Leandro N Alem','Leones','Liniers',
  'Los Andes','Luján','Lugano','Midland','Mitre','Morón','Muñiz','Nueva Chicago',
  'Puerto Nuevo','Quilmes Atlético','Real Pilar','Recoleta FC','Sacachispas',
  'San Miguel','San Telmo','SM Burzaco','Sportivo Barrancas','Sportivo Italiano',
  'Temperley','Tristán Suárez','UAI Urquiza','Victoriano','Villa Calmines',
  'Villa San Carlos','Yupanqui','2 de Mayo','Argentino de Merlo','Argentino de Rosario',
  'Justo José de Urquiza',
  // Brasil
  'Atlético Mineiro','Atlético Paranaense','Bahia','Botafogo','RB Bragantino',
  'Chapecoense','Corinthians','Coritiba','Cruzeiro','Flamengo','Fluminense',
  'Grêmio','Internacional','Palmeiras','Remo','Santos','São Paulo','Vasco','Vitória',
  // Uruguay
  'Nacional','Peñarol','Boston River','Cerro Largo','Cerro','Danubio',
  'Defensor Sporting','Fénix','Juventud','Maldonado','Montevideo City','Progreso',
  'Wanderers','Albion','Mercedes','Centro Español',
  // Paraguay
  'Olimpia','Guaraní','Libertad','Cerro Porteño','Atlético Tembetary',
  'Deportivo Paraguayo','General Caballero','Sportivo Ameliano',
  'Sportivo Luqueño','Sportivo Trinidense',
  // Chile
  'Colo-Colo','Audax Italiano','Cobresal','Coquimbo Unido','Deportes Concepción',
  'Deportes La Serena','Deportes Limache','Everton de Viña del Mar','Huachipato',
  'Nublense',"O'Higgins",'Palestino','Universidad de Chile','Universidad de Concepción',
  'Universidad Católica','Unión La Calera',
  // España
  'Real Madrid','Barcelona','Atlético Madrid','Alavés','Athletic Bilbao','Betis',
  'Celta','Deportivo Coruña','Elche','Espanyol','Getafe','Levante','Málaga',
  'Osasuna','Rayo Vallecano','Real Sociedad','Sevilla','Valencia','Villarreal',
  'Racing Santander',
  // Inglaterra
  'Arsenal','Aston Villa','Bournemouth','Brentford','Brighton','Chelsea','Coventry',
  'Crystal Palace','Everton','Fulham','Hull City','Ipswich Town','Leeds',
  'Liverpool','Manchester City','Manchester United','Newcastle','Nottingham Forest',
  'Sunderland','Tottenham',
  // Alemania
  'Augsburgo','Bayer Leverkusen','Bayern Múnich','Borussia Dortmund',
  'Borussia Mönchengladbach','Eintracht Frankfurt','Friburgo','Hamburgo',
  'Hoffenheim','Köln','Mainz','Paderborn','RB Leipzig','Schalke 04','Stuttgart',
  'Union Berlín','Werder Bremen','Elversberg',
  // Países Bajos
  'Ajax','AZ Alkmaar','Excelsior','Feyenoord','Fortuna Sittard','Go Ahead Eagles',
  'Groningen','Heracles','NAC Breda','NEC','PSV','SC Heerenveen','Sparta Rotterdam',
  'Telstar','Twente','Utrecht','Volendam','Zwolle',
  // México
  'Atlas',
  // Otros
  'Inter Miami','Juventus','Milan','Inter de Milán','PSG',
]

const sinAcentos = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function buscarClubes(texto: string) {
  if (!texto || texto.length < 2) return []
  const q = sinAcentos(texto)
  return CLUBES.filter(c => sinAcentos(c).includes(q)).slice(0, 8)
}

// Valores viejos de la app traen emoji adelante ("💪 Todoterreno")
export const sinEmojis = (s: string) => s.replace(/[^\p{L}\s]/gu, '').trim()
