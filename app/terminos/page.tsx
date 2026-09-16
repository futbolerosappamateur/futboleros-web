import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackLink from '../components/BackLink'
import styles from '../legal.module.css'

const TEXTO = `1. Aceptación de los términos

Al registrarse o utilizar la aplicación Futboleros, el usuario acepta estos Términos y Condiciones de Uso. Si el usuario no está de acuerdo con alguna de las disposiciones aquí establecidas, deberá abstenerse de utilizar la plataforma.

2. Objeto del servicio

Futboleros es una plataforma digital destinada a la organización, gestión y seguimiento de actividades relacionadas con el fútbol amateur. La aplicación permite, entre otras funcionalidades:
- Crear perfiles de jugadores.
- Participar en grupos deportivos.
- Registrar estadísticas y resultados.
- Organizar encuentros.
- Interactuar con otros usuarios.

3. Registro de usuarios

Para acceder a determinadas funcionalidades será necesario crear una cuenta. El usuario declara que la información proporcionada es veraz, completa y actualizada. Cada usuario será responsable de mantener la confidencialidad de sus credenciales de acceso.

4. Conducta del usuario

Los usuarios se comprometen a:
- Utilizar la plataforma de forma lícita.
- Respetar a otros usuarios.
- No publicar contenido discriminatorio, ofensivo, violento o ilegal.
- No suplantar la identidad de terceros.

Futboleros podrá suspender o eliminar cuentas que incumplan estas normas.

4.1 Visibilidad del perfil

Al registrarse en Futboleros, el usuario reconoce y acepta que la plataforma funciona como una comunidad deportiva en la que los perfiles de los jugadores son visibles para los demás usuarios registrados.

La información pública del perfil podrá ser visualizada por cualquier usuario que posea una cuenta activa en Futboleros. Dicha información no será accesible al público general a través de la plataforma, salvo que Futboleros incorpore en el futuro funcionalidades que permitan al usuario decidir lo contrario.

Entre la información que podrá visualizarse se incluye, según las funcionalidades disponibles en cada momento:
- Nombre, apodo o nombre de usuario.
- Fotografía de perfil.
- Figurita personalizada generada mediante inteligencia artificial.
- Posición de juego.
- Equipo o grupos de los que participa.
- Estadísticas deportivas.
- Puntajes, historial deportivo, logros e información relacionada con la actividad dentro de Futboleros.

El usuario comprende que esta información forma parte del funcionamiento esencial de la plataforma y acepta que sea visible para los demás usuarios registrados.

5. Estadísticas y resultados

Las estadísticas, puntajes y registros deportivos pueden ser cargados por administradores o responsables de grupos. Futboleros no garantiza la exactitud absoluta de dicha información y no será responsable por errores, omisiones o discrepancias derivadas de la carga realizada por terceros.

5.1 Estadísticas, puntajes y registros deportivos

Futboleros ofrece herramientas para registrar y visualizar estadísticas, puntajes, calificaciones y demás información relacionada con la actividad deportiva de los usuarios.

Salvo que se indique expresamente lo contrario, dicha información es ingresada por los administradores de los grupos, organizadores de los encuentros u otros usuarios autorizados para realizar la carga de datos, por lo que Futboleros no garantiza su exactitud, integridad o actualización permanente.

Las estadísticas, calificaciones y registros deportivos tienen carácter informativo y recreativo dentro de la plataforma y no constituyen certificaciones oficiales sobre el desempeño deportivo de los usuarios.

Futboleros no será responsable por discrepancias, desacuerdos o controversias entre usuarios respecto de los datos cargados, incluyendo, entre otros, goles, asistencias, tarjetas, calificaciones, posiciones, resultados, historial deportivo u otras estadísticas.

En caso de detectarse un error originado por un funcionamiento incorrecto de la plataforma, Futboleros podrá, a su exclusivo criterio, corregir la información afectada cuando ello resulte técnica y operativamente posible.

6. Contenido generado por usuarios

Los usuarios conservan la titularidad de los contenidos que publiquen. No obstante, otorgan a Futboleros una licencia no exclusiva para almacenar, reproducir y mostrar dicho contenido dentro de la plataforma con el fin de prestar el servicio.

6.1 Generación de imágenes mediante Inteligencia Artificial

Futboleros ofrece una funcionalidad que permite generar una figurita personalizada del jugador mediante herramientas de inteligencia artificial, utilizando la fotografía y/o la información proporcionada por el usuario. El usuario reconoce y acepta que las imágenes son generadas mediante sistemas automatizados de inteligencia artificial y que, debido a la naturaleza de esta tecnología, los resultados pueden presentar diferencias respecto de la apariencia real del usuario o no coincidir plenamente con sus expectativas.

Futboleros no garantiza que la imagen generada represente de manera exacta al usuario ni que el resultado sea totalmente preciso o satisfactorio. La plataforma no será responsable por diferencias estéticas, errores de interpretación, variaciones en rasgos físicos, edad aparente, contextura, vestimenta, colores, expresiones, poses, escudos, accesorios u otros elementos presentes en la imagen generada.

6.2 Autorización para el procesamiento de imágenes

Al utilizar la función de generación de figuritas, el usuario declara ser titular de los derechos sobre la fotografía que carga en la plataforma o contar con la autorización necesaria para su utilización. Asimismo, autoriza a Futboleros a procesar dicha fotografía y la información asociada mediante herramientas de inteligencia artificial exclusivamente con la finalidad de generar la figurita personalizada.

6.3 Uso de las figuritas generadas

Las figuritas generadas mediante la plataforma constituyen una representación gráfica personalizada del usuario dentro del ecosistema de Futboleros. El usuario podrá utilizar y compartir libremente la figurita generada con fines personales y no comerciales. Queda prohibida la reproducción, comercialización o cualquier uso comercial sin autorización previa y por escrito de Futboleros.

7. Propiedad intelectual

La marca Futboleros, su logotipo, diseño, software, contenidos y elementos gráficos son propiedad de sus titulares y se encuentran protegidos por la legislación aplicable. Queda prohibida su reproducción sin autorización previa.

8. Actividad deportiva

Futboleros actúa exclusivamente como plataforma tecnológica. La participación en actividades deportivas organizadas por usuarios implica riesgos inherentes propios de la práctica deportiva. Cada participante asume la responsabilidad de evaluar su condición física y participar bajo su propio riesgo. Futboleros no será responsable por lesiones, accidentes, daños físicos o perjuicios derivados de la práctica deportiva.

9. Suspensión y cancelación de cuentas

Futboleros podrá suspender o cancelar cuentas que:
- Incumplan estos términos.
- Generen riesgos para la comunidad.
- Utilicen la plataforma con fines fraudulentos.

10. Modificaciones

Futboleros podrá modificar estos términos en cualquier momento. Las modificaciones serán comunicadas mediante la aplicación o los medios que se consideren adecuados.

11. Legislación aplicable

Estos términos se regirán por las leyes de la República Argentina. Toda controversia será sometida a los tribunales competentes de la Ciudad Autónoma de Buenos Aires, salvo disposición legal en contrario.`

function parseSections(texto: string) {
  const parrafos = texto.split('\n\n').filter(Boolean)
  return parrafos.map((p, i) => {
    const lines = p.split('\n')
    const isTitle = /^\d/.test(lines[0].trim())
    return { key: i, title: isTitle ? lines[0] : null, body: isTitle ? lines.slice(1).join('\n').trim() : p }
  })
}

export default function Terminos() {
  const sections = parseSections(TEXTO)
  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.inner}>
          <BackLink href="/" className={styles.back}>Inicio</BackLink>
          <h1 className={styles.title}>TÉRMINOS Y CONDICIONES</h1>
          <p className={styles.updated}>Última actualización: Julio de 2026</p>
          {sections.map(s => (
            <div key={s.key} className={styles.section}>
              {s.title && <h2 className={styles.sectionTitle}>{s.title}</h2>}
              <p className={styles.body}>{s.body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
