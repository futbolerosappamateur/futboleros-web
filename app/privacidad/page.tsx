import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackLink from '../components/BackLink'
import styles from '../legal.module.css'

const TEXTO = `1. Introducción

Futboleros respeta la privacidad de sus usuarios y se compromete a proteger los datos personales que recopila.

2. Información que recopilamos

Podemos recopilar:
- Nombre o apodo.
- Correo electrónico.
- Fotografía de perfil.
- Datos deportivos y estadísticas.
- Información sobre grupos y partidos.
- Datos técnicos del dispositivo.
- Registros de acceso y uso de la plataforma.

3. Finalidad del tratamiento

Los datos serán utilizados para:
- Crear y administrar cuentas.
- Permitir la interacción entre usuarios.
- Gestionar grupos y partidos.
- Mostrar estadísticas deportivas.
- Mejorar la experiencia de uso.
- Brindar soporte técnico.
- Cumplir obligaciones legales.

4. Compartición de datos

Futboleros no venderá datos personales a terceros. Los datos podrán compartirse únicamente:
- Cuando sea necesario para prestar el servicio.
- Por requerimiento legal.
- Con proveedores tecnológicos que colaboren en la operación de la plataforma.

5. Seguridad

Se implementarán medidas razonables de seguridad para proteger la información almacenada. Sin embargo, ningún sistema puede garantizar seguridad absoluta frente a accesos no autorizados.

6. Conservación de datos

Los datos serán conservados mientras la cuenta permanezca activa o durante el tiempo necesario para cumplir obligaciones legales.

7. Derechos del usuario

Los usuarios podrán:
- Acceder a sus datos.
- Rectificar información incorrecta.
- Solicitar la eliminación de su cuenta.
- Solicitar la supresión de datos personales cuando corresponda.

8. Eliminación de cuenta

El usuario podrá solicitar la eliminación de su cuenta mediante los mecanismos disponibles dentro de la aplicación o a través del canal de contacto informado por Futboleros.

9. Menores de edad

Los menores de 18 años deberán utilizar la plataforma bajo supervisión de sus padres o representantes legales.

10. Información visible para otros usuarios

Determinados datos del perfil tienen carácter público dentro de la comunidad de Futboleros y podrán ser visualizados por otros usuarios registrados. La información visible podrá incluir, entre otros datos, la fotografía de perfil, la figurita personalizada, el nombre o apodo, la posición de juego, las estadísticas deportivas, los grupos en los que participa y demás información vinculada a la actividad desarrollada dentro de la plataforma.

Los datos del perfil serán visibles únicamente para los usuarios registrados de Futboleros. La plataforma no publica dichos perfiles para el acceso general de Internet, salvo que el usuario otorgue su consentimiento o que Futboleros incorpore en el futuro una funcionalidad específica que así lo permita.

11. Cambios en esta política

Futboleros podrá actualizar esta Política de Privacidad cuando resulte necesario. Las modificaciones serán publicadas dentro de la aplicación.

12. Contacto

Para consultas relacionadas con privacidad y protección de datos personales, los usuarios podrán comunicarse a través de los canales oficiales de Futboleros.`

function parseSections(texto: string) {
  const parrafos = texto.split('\n\n').filter(Boolean)
  return parrafos.map((p, i) => {
    const lines = p.split('\n')
    const isTitle = /^\d/.test(lines[0].trim())
    return { key: i, title: isTitle ? lines[0] : null, body: isTitle ? lines.slice(1).join('\n').trim() : p }
  })
}

export default function Privacidad() {
  const sections = parseSections(TEXTO)
  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.inner}>
          <BackLink href="/" className={styles.back}>Inicio</BackLink>
          <h1 className={styles.title}>POLÍTICA DE PRIVACIDAD</h1>
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
