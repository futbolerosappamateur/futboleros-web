import type { Metadata } from 'next'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackLink from '../components/BackLink'
import styles from '../legal.module.css'
import consumidor from '../consumidor.module.css'

export const metadata: Metadata = {
  title: 'Eliminar cuenta',
  description: 'Cómo eliminar tu cuenta de Futboleros y qué datos se borran.',
}

const EMAIL = 'contacto@futboleros.com.ar'
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent('Eliminar mi cuenta de Futboleros')}`

// La página para borrar la cuenta sin la app que pide Google Play. Reemplaza a /eliminar-cuenta.html del sitio
// anterior (next.config.mjs redirige la dirección vieja). Lo que se borra es lo que borra la función eliminar-cuenta
// de la app: si eso cambia, cambiar también este texto
export default function EliminarCuenta() {
  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.inner}>
          <BackLink href="/" className={styles.back}>Inicio</BackLink>
          <h1 className={styles.title}>ELIMINAR CUENTA</h1>
          <p className={styles.updated}>Tu cuenta y tus datos de Futboleros</p>

          <div className={styles.section}>
            <p className={styles.body}>
              Podés eliminar tu cuenta de Futboleros cuando quieras, sin explicar el motivo. La eliminación no se
              puede deshacer.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>DESDE LA APP</h2>
            <p className={styles.body}>
              Abrí el menú, entrá a Ajustes, tocá Eliminar cuenta y confirmá. La cuenta se borra en el momento.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>SIN LA APP</h2>
            <p className={styles.body}>
              Si ya no tenés la app o no podés ingresar, escribinos a {EMAIL} desde el email con el que te
              registraste y pedinos que eliminemos tu cuenta. La eliminamos dentro de los 5 días hábiles y te
              avisamos por email cuando esté hecho.
            </p>
          </div>
          <div className={styles.section}>
            <a href={MAILTO} className={consumidor.boton}>PEDIR LA ELIMINACIÓN POR EMAIL</a>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>QUÉ SE BORRA</h2>
            <p className={styles.body}>
              {`- Tu cuenta: el email y la contraseña con los que entrás.
- Tu perfil y los datos que cargaste en él, como el nombre, la foto y el domicilio.
- Tus figuritas.
- Tus estadísticas, tus calificaciones y tu lugar en los grupos y en las convocatorias.
- Tus mensajes y conversaciones del chat.
- Los testimonios que escribiste y los que te escribieron.
- Tus notificaciones.

Si tenés el débito automático del Plan 10, se da de baja antes de borrar la cuenta: no se te cobra más.`}
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>QUÉ SE CONSERVA</h2>
            <p className={styles.body}>
              {`- Los registros de los pagos del Plan 10 (fecha, monto y número de operación de Mercado Pago), ya sin tu perfil, durante el plazo que exigen las normas contables e impositivas.
- Los pedidos que hayas hecho con los botones de arrepentimiento o de baja, durante el plazo que exigen las normas de defensa del consumidor.
- En los partidos que jugaste, tu nombre puede seguir apareciendo en los equipos y las jugadas, como parte del historial del grupo.`}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
