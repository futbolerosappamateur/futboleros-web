// Colores de los clubes para "Los más hinchados" de la home (la barra es una bufanda con sus rayas).
// Los nombres de hincha_de vienen de la app y no siempre coinciden con la lista de la web ("Newell's" o
// "Newell's Old Boys", "Vélez Sarsfield" o "Vélez Sársfield"): se comparan sin acentos, signos ni "CA",
// "Club", "FC"..., y si no hay uno igual gana el nombre más largo que esté contenido. Sin colores: null

type Colores = [string, string]

const ROJO = '#d0121b'
const ROJO_OSCURO = '#7f0c12'
const BLANCO = '#ffffff'
const NEGRO = '#1a1a1a'
const AZUL = '#1446a0'
const AZUL_MARINO = '#0f2557'
const CELESTE = '#6cb4e4'
const AMARILLO = '#ffd100'
const ORO = '#f2c230'
const VERDE = '#00843d'
const GRANATE = '#7a1e2e'
const MARRON = '#5c3a21'
const VIOLETA = '#5b2a86'
const ROSA = '#f4a6c6'

const LISTA: [string[], Colores][] = [
  // Argentina — Primera
  [['River Plate', 'River'], [ROJO, BLANCO]],
  [['Boca Juniors', 'Boca'], [AZUL, ORO]],
  [['Racing Club'], [CELESTE, BLANCO]],
  [['Independiente'], [ROJO, ROJO_OSCURO]],
  [['Independiente Rivadavia'], [AZUL, BLANCO]],
  [['San Lorenzo', 'San Lorenzo de Almagro'], [AZUL_MARINO, ROJO]],
  [['Huracán'], [BLANCO, ROJO]],
  [['Vélez Sársfield', 'Vélez'], [BLANCO, AZUL]],
  [['Estudiantes', 'Estudiantes de La Plata'], [ROJO, BLANCO]],
  [['Gimnasia y Esgrima La Plata', 'Gimnasia La Plata', 'Gimnasia'], [AZUL_MARINO, BLANCO]],
  [['Talleres', 'Talleres de Córdoba'], [AZUL_MARINO, BLANCO]],
  [['Belgrano'], [CELESTE, BLANCO]],
  [['Colón'], [ROJO, NEGRO]],
  [["Newell's Old Boys", "Newell's"], [ROJO, NEGRO]],
  [['Rosario Central'], [AZUL, AMARILLO]],
  [['Lanús'], [GRANATE, BLANCO]],
  [['Banfield'], [VERDE, BLANCO]],
  [['Platense'], [MARRON, BLANCO]],
  [['Aldosivi'], [VERDE, AMARILLO]],
  [['Tigre'], [AZUL, ROJO]],
  [['Argentinos Juniors', 'Argentinos'], [ROJO, BLANCO]],
  [['Defensa y Justicia'], [VERDE, AMARILLO]],
  [['Godoy Cruz'], [AZUL, BLANCO]],
  [['Patronato'], [ROJO, NEGRO]],
  [['Atlético Tucumán'], [CELESTE, BLANCO]],
  [['Atlético Rafaela'], [CELESTE, BLANCO]],
  [['San Martín de Tucumán'], [ROJO, BLANCO]],
  [['San Martín de San Juan'], [VERDE, NEGRO]],
  [['Sarmiento'], [VERDE, BLANCO]],
  [['Instituto'], [ROJO, BLANCO]],
  [['Barracas Central'], [ROJO, BLANCO]],
  [['Arsenal de Sarandí', 'Arsenal Sarandí'], [CELESTE, ROJO]],
  [['Riestra', 'Deportivo Riestra'], [NEGRO, BLANCO]],
  [['Unión'], [ROJO, BLANCO]],
  // Argentina — Ascenso
  [['Chacarita'], [ROJO, NEGRO]],
  [['Ferrocarril Oeste', 'Ferro Carril Oeste', 'Ferro'], [VERDE, BLANCO]],
  [['Nueva Chicago'], [VERDE, NEGRO]],
  [['Quilmes', 'Quilmes Atlético'], [BLANCO, AZUL_MARINO]],
  [['All Boys'], [BLANCO, NEGRO]],
  [['Atlanta'], [AMARILLO, AZUL]],
  [['Almagro'], [AZUL, NEGRO]],
  [['Temperley'], [CELESTE, BLANCO]],
  [['Los Andes'], [ROJO, BLANCO]],
  [['Morón', 'Deportivo Morón'], [BLANCO, ROJO]],
  [['Almirante Brown'], [AMARILLO, NEGRO]],
  [['Deportivo Español'], [ROJO, AMARILLO]],
  [['Excursionistas'], [VERDE, BLANCO]],
  [['Defensores de Belgrano'], [ROJO, NEGRO]],
  // Brasil
  [['Atlético Mineiro'], [NEGRO, BLANCO]],
  [['Atlético Paranaense', 'Athletico Paranaense'], [ROJO, NEGRO]],
  [['Flamengo'], [ROJO, NEGRO]],
  [['Palmeiras'], [VERDE, BLANCO]],
  [['Corinthians'], [BLANCO, NEGRO]],
  [['São Paulo'], [ROJO, NEGRO]],
  [['Santos'], [BLANCO, NEGRO]],
  [['Grêmio'], ['#3aa0dc', NEGRO]],
  [['Internacional'], [ROJO, BLANCO]],
  [['Fluminense'], [GRANATE, VERDE]],
  [['Botafogo'], [NEGRO, BLANCO]],
  [['Vasco', 'Vasco da Gama'], [NEGRO, BLANCO]],
  [['Cruzeiro'], [AZUL, BLANCO]],
  [['Bahia'], [AZUL, ROJO]],
  [['Chapecoense'], [VERDE, BLANCO]],
  // Uruguay, Paraguay y Chile
  [['Nacional'], [BLANCO, AZUL]],
  [['Peñarol'], [AMARILLO, NEGRO]],
  [['Danubio'], [BLANCO, NEGRO]],
  [['Defensor Sporting'], [VIOLETA, BLANCO]],
  [['Wanderers'], [NEGRO, BLANCO]],
  [['Olimpia'], [BLANCO, NEGRO]],
  [['Cerro Porteño'], [AZUL, ROJO]],
  [['Libertad'], [BLANCO, NEGRO]],
  [['Guaraní'], [AMARILLO, NEGRO]],
  [['Colo-Colo', 'Colo Colo'], [BLANCO, NEGRO]],
  [['Universidad de Chile'], [AZUL, ROJO]],
  [['Universidad Católica'], [BLANCO, AZUL]],
  // España
  [['Real Madrid'], [BLANCO, ORO]],
  [['Barcelona'], ['#a50044', '#004d98']],
  [['Atlético Madrid', 'Atlético de Madrid'], [ROJO, BLANCO]],
  [['Sevilla'], [BLANCO, ROJO]],
  [['Betis', 'Real Betis'], [VERDE, BLANCO]],
  [['Valencia'], [BLANCO, NEGRO]],
  [['Athletic Bilbao', 'Athletic Club'], [ROJO, BLANCO]],
  [['Real Sociedad'], [AZUL, BLANCO]],
  [['Villarreal'], [AMARILLO, AZUL]],
  [['Celta', 'Celta de Vigo'], [CELESTE, BLANCO]],
  [['Espanyol'], [AZUL, BLANCO]],
  [['Racing Santander'], [VERDE, BLANCO]],
  // Inglaterra
  [['Arsenal'], [ROJO, BLANCO]],
  [['Chelsea'], [AZUL, BLANCO]],
  [['Liverpool'], [ROJO, BLANCO]],
  [['Manchester City'], [CELESTE, BLANCO]],
  [['Manchester United'], [ROJO, NEGRO]],
  [['Tottenham', 'Tottenham Hotspur'], [BLANCO, AZUL_MARINO]],
  [['Newcastle', 'Newcastle United'], [NEGRO, BLANCO]],
  [['Everton'], [AZUL, BLANCO]],
  [['Aston Villa'], [GRANATE, CELESTE]],
  // Alemania, Italia, Francia y Países Bajos
  [['Bayern Múnich', 'Bayern Munich', 'Bayern München', 'Bayern'], [ROJO, BLANCO]],
  [['Borussia Dortmund', 'Dortmund'], [AMARILLO, NEGRO]],
  [['Bayer Leverkusen'], [ROJO, NEGRO]],
  [['Schalke 04', 'Schalke'], [AZUL, BLANCO]],
  [['Juventus'], [NEGRO, BLANCO]],
  [['Milan', 'AC Milan'], [ROJO, NEGRO]],
  [['Inter de Milán', 'Inter Milan', 'Internazionale', 'Inter'], ['#0068a8', NEGRO]],
  [['PSG', 'Paris Saint-Germain', 'Paris Saint Germain'], ['#004170', ROJO]],
  [['Ajax'], [BLANCO, ROJO]],
  [['PSV'], [ROJO, BLANCO]],
  [['Feyenoord'], [ROJO, BLANCO]],
  // Otros
  [['Inter Miami'], [ROSA, NEGRO]],
  [['Atlas'], [ROJO, NEGRO]],
]

// Sin acentos, signos ni las siglas y palabras que cambian de una lista a otra
function normalizar(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(club atletico|club|ca|cd|cf|fc|ac|sc)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const POR_NOMBRE = new Map<string, Colores>()
for (const [nombres, colores] of LISTA) {
  for (const n of nombres) POR_NOMBRE.set(normalizar(n), colores)
}
const CLAVES = [...POR_NOMBRE.keys()].sort((a, b) => b.length - a.length)   // las más largas primero

export function coloresClub(club: string): Colores | null {
  const n = normalizar(club)
  if (!n) return null
  const exacto = POR_NOMBRE.get(n)
  if (exacto) return exacto
  const conEspacios = ` ${n} `
  const clave = CLAVES.find(c => conEspacios.includes(` ${c} `))
  return clave ? POR_NOMBRE.get(clave) ?? null : null
}
