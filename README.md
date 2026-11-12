# -mi-panel-qr
QR dinamicos, Nfc tools
CONTEXTO DEL PROYECTO — MI PANEL QR + NFc

1. Objetivo

Desarrollar una plataforma web privada para administrar códigos QR dinámicos y dispositivos NFC.

El objetivo inicial es utilizarla personalmente y, más adelante, convertirla en un producto SaaS de suscripción mensual o anual para otros usuarios.

2. Concepto principal

La plataforma permitirá:

* Crear códigos QR dinámicos.
* Descargar QR en PNG y SVG.
* Cambiar el destino de un QR sin volver a imprimirlo.
* Registrar y administrar etiquetas NFC.
* Vincular QR y NFC a un mismo destino.
* Administrar diferentes negocios y ubicaciones.
* Consultar estadísticas de escaneos.
* Administrar usuarios con cuentas independientes.

Principio fundamental: los QR y NFC deben utilizar una URL permanente de nuestra plataforma. Esta URL redirige al destino actual, que puede modificarse desde el panel.

Ejemplo:

https://midominio.com/r/abc123

Si el destino cambia de Google Reviews a Instagram, el QR y el NFC siguen funcionando sin necesidad de modificarlos físicamente.

Importante: un NFC normal no puede reprogramarse remotamente por Internet. La plataforma administra su URL y configuración, no modifica físicamente el chip.

3. Relación entre QR y NFC

Decisión confirmada: ambos compartirán un destino central.

Un mismo producto podrá tener:

* Un código QR.
* Uno o varios dispositivos NFC.
* Un destino compartido.

Al cambiar el destino central, todos los dispositivos vinculados utilizarán el nuevo destino.

4. Usuarios y modelo de negocio

* Autenticación mediante correo electrónico y contraseña.
* Varios usuarios con información completamente aislada.
* Cada usuario administra sus propios negocios, ubicaciones, QR y NFC.
* Preparar la arquitectura para futuras suscripciones.
* No implementar todavía todo el sistema de pagos; primero construir una base sólida.

5. Estadísticas

Se desea registrar:

* Cantidad de escaneos.
* Fecha y hora.
* País aproximado.
* Tipo de dispositivo.
* Origen del acceso: QR o NFC.

La recopilación debe respetar la privacidad y evitar almacenar información personal innecesaria.

6. Organización funcional

La plataforma tendrá estas áreas:

1. Dashboard: resumen general.
2. QR: crear, editar, descargar y administrar códigos.
3. NFC: registrar y administrar etiquetas.
4. Dispositivos: vincular QR y NFC.
5. Negocios: organizar los recursos por negocio.
6. Ubicaciones: administrar direcciones físicas.
7. Estadísticas: analizar escaneos y actividad.
8. Configuración: cuenta y preferencias.

7. Arquitectura técnica propuesta

Tecnologías elegidas o previstas:

* Windows.
* Warp como terminal.
* VS Code como editor.
* OpenCode como asistente de programación.
* Next.js para la aplicación.
* Supabase para autenticación y PostgreSQL.
* TypeScript.
* Generación de QR en PNG y SVG.

Node.js y npm ya fueron actualizados anteriormente.

El proyecto Supabase ya fue creado y se estuvo configurando .env.local.

No mostrar ni exponer claves secretas. La clave service_role debe permanecer exclusivamente en el servidor.

8. Base de datos propuesta

Tablas iniciales:

* profiles: perfiles de usuarios.
* businesses: negocios.
* locations: ubicaciones físicas.
* destinations: destinos dinámicos centrales.
* qrs: códigos QR.
* nfc_tags: etiquetas NFC.
* devices: vinculación de dispositivos y destinos.
* scans: registros de escaneos.
* qr_history: historial de cambios.
* subscriptions: futuras suscripciones.

Cada usuario debe acceder únicamente a sus propios registros mediante políticas RLS de Supabase.

La estructura definitiva debe revisarse antes de ejecutar SQL.

9. Estructura de carpetas prevista

Esta es la estructura objetivo, no una confirmación de que todas las carpetas ya existan:

mi-panel-qr/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── qrs/
│   │   ├── nfc/
│   │   ├── devices/
│   │   ├── businesses/
│   │   ├── locations/
│   │   ├── statistics/
│   │   └── settings/
│   ├── r/
│   │   └── [code]/
│   └── api/
├── components/
│   ├── qr/
│   ├── nfc/
│   ├── devices/
│   ├── businesses/
│   ├── dashboard/
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── qr/
│   ├── nfc/
│   ├── destinations/
│   ├── redirects/
│   └── validations/
├── public/
├── .env.local
└── package.json

10. Orden de desarrollo

Construir por etapas, sin intentar desarrollar todo al mismo tiempo:

1. Revisar el proyecto existente.
2. Configurar autenticación y seguridad.
3. Diseñar la base de datos multiusuario.
4. Construir el sistema central de destinos dinámicos.
5. Crear y descargar QR.
6. Registrar y administrar NFC.
7. Vincular QR y NFC.
8. Implementar estadísticas.
9. Organizar negocios y ubicaciones.
10. Preparar suscripciones y comercialización.

11. Forma de trabajar

El usuario está aprendiendo programación y necesita instrucciones guiadas.

Reglas para el asistente de programación:

* Actuar como un ingeniero senior y profesor.
* Dar instrucciones paso a paso.
* No avanzar al siguiente paso hasta verificar el anterior.
* Explicar brevemente qué hace cada cambio.
* Revisar los archivos existentes antes de modificarlos.
* No sobrescribir código sin revisar su contenido.
* Priorizar seguridad, escalabilidad y buenas prácticas.
* Evitar complejidad innecesaria.
* No inventar que algo ya está implementado.
* Cuando haya errores, explicar su causa y cómo solucionarlos.

12. Estado actual

El proyecto Supabase ya fue creado y se comenzó a configurar el entorno local.

Todavía está pendiente verificar la estructura real del repositorio y el estado exacto de la implementación.

Primera tarea para Claude: analizar los archivos actuales del proyecto, identificar qué está implementado y qué falta. No modificar archivos todavía. Presentar un diagnóstico y un plan de trabajo por etapas antes de comenzar a programar.

⸻

IMPORTANTE: Este documento contiene las decisiones y objetivos del proyecto. No es una autorización para generar toda la aplicación de golpe. Primero hay que revisar el proyecto existente y trabajar de forma incremental.
