---
sidebar_position: 2
---

# Contribuir

🎉👍 En primer lugar, ¡gracias por tomarse el tiempo para contribuir!🎉👍! 🎉👍

Files se encuentra actualmente en desarrollo. Estamos dando la bienvenida a los colaboradores que deseen ayudar en Files.

## Involúcrate

Hay muchas maneras de contribuir a Files, y muchas de ellas no implican escribir nada código. Aquí tienes algunas ideas para empezar:

- ¡Empieza a usar Files! Sigue los tutoriales. ¿Funciona todo tal y como esperabas? Si no es así, estamos siempre buscando mejoras. Háganos saber abriendo una issue.
- Mira a través de los [problemas de Files](https://github.com/softeng/Files/issues). Si encuentras un problema que te gustaría corregir, [abre una issue](#your-first-pull-request). Los problemas etiquetados como [primera issue](https://github.com/softeng/Files/labels/good%20first%20issue) son un buen lugar para empezar.
- Ayúdanos a mejorar la documentación. Crea un nuevo problema si encuentras algo que está siendo confuso, algún error gramatical, o si algo puede ser mejorado.
- Echa un vistazo a la sección de [conversaciones en GitHub](https://github.com/softeng/Files/discussions) y da tu opinión sobre una discusión o considera abrir un pull request si ves algo en lo que quieres trabajar.

¡Los contribuidores son siempre bienvenidos!

## Nuestro proceso de desarrollo

Files utiliza [GitHub](https://github.com/softeng/Files) como su fuente inicial. El equipo principal trabajará directamente allí. Todos los cambios serán públicos desde el comienzo.

### Reportando nuevos problemas/errores. {#issues}

Cuando [abra un nuevo problema](https://github.com/softeng/Files/issues), siempre asegúrese de rellenar la plantilla de problemas. Utilizamos problemas de GitHub para rastrear errores públicos. Por favor, asegúrese de que su descripción es clara y tiene suficientes instrucciones para poder reproducir el problema.

- _Un problema, un error_: Por favor, informe de un solo error por cada problema.
- _Proporciona pasos de reproducción_: Lista todos los pasos necesarios para reproducir el problema. La persona que lea tu informe de fallo debería ser capaz de seguir estos pasos para reproducir su problema con un mínimo esfuerzo.

### Solicita una funcionalidad {#feat}

Utilizamos [discusiones en GitHub](https://github.com/softeng/Files/discussions) y [problemas en GitHub](https://github.com/softeng/Files) para rastrear ideas de usuarios. ¡Sugiere una nueva función [aquí](https://github.com/softeng/Files/discussions/new)! Las buenas solicitudes de características tienden a tener:

- Resumen rápido de la idea.
- Qué & por qué quiere añadir la característica específicada.
- Contexto adicional como imágenes, enlaces a recursos para implementar la función, etc.

## Trabajando en el código de Files

### Prerequisitos

- [Entorno Tauri](https://tauri.studio/en/docs/getting-started/intro#setting-up-your-environment)
- [Node JS](https://nodejs.org/en/)
- [Git](https://git-scm.com/)
- [yarn](https://yarnpkg.com/)
- Editor de código, te recomendamos que uses [VS Code](https://code.visualstudio.com/)

### Instalación

1. Después de clonar el repositorio, ejecute `yarn` en la raíz del repositorio y ejecute `yarn` en la carpeta `docs` (si desea trabajar en Files Docs).
2. Para iniciar Files localmente, ejecute `yarn dev`.

    Para iniciar un servidor de desarrollo local que sirva la documentación de Docusaurus, vaya al directorio `docs` y ejecute `yarn start`

### Gitpod para el desarrollo de Files {#gitpod-env}

La forma más fácil de ejecutar Files en Gitpod es utilizar el servicio de [Gitpod](https://gitpod.io/), todo lo que necesitas hacer es hacer clic en el botón de abajo e iniciar sesión con tu cuenta de GitHub. Después, verás un entorno similar al VS Code donde puedes comenzar a desarrollar y publicar tus cambios. Tenga en cuenta que puede tener que esperar hasta unos minutos para que Files funcione en la pestaña VNC desplegada.

## [![Abrir en Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#/https://github.com/softeng/Files)

### Mensajes de confirmación semántica {#commit-msg}

Vea cómo un cambio menor en su estilo de mensaje de confirmación puede hacerle un mejor programador.

Formato: `<type>(<scope>): <subject>`

`<scope>` es opcional

#### Ejemplo

```
función: permitir la sobreescritura de la configuración webpack
^--^  ^------------^
|     |
| +-> Resumen en el tiempo actual.
|
+-------> Tipo: chore, docs, feat, fix, refactor, style, o test.
```

los distintos tipos de commits:

- `feat`: nueva característica para el usuario
- `fix`: corrección de errores para el usuario
- `docs`: cambios a la documentación
- `style`: formateo, falta punto y coma y demás.
- `refactor`: refactorizar código de producción, por ejemplo. renombrando una variable
- `test`: añadiendo pruebas faltantes, refactorizando pruebas.
- `chore`: actualizar tareas grunt, etc

¡Usar minúsculas no mayúsculas!

## Trabajando en el código de Files

El sitio web de documentación de Files se construye usando [Docusaurus 2](https://docusaurus.io/), y su código se encuentra en [`docs`](https://github.com/softeng/Files/tree/master/docs) carpeta.

### Prerequisitos

- [node js](https://nodejs.org/en/)
- [git](https://git-scm.com/downloads)
- [yarn](https://yarnpkg.com/getting-started/install#about-global-installs)
- Editor de código, te recomendamos que uses [VS Code](https://code.visualstudio.com/)

### Instalación

Después de clonar el repositorio, ejecuta `yarn` en la carpeta `docs` (puedes ir a la carpeta `docs` ejecutando el comando `cd docs`).

Si desea utilizar Gitpod, haga clic [aquí](#gitpod-env) para la guía sobre cómo usar Gitpod.

### Desarrollo local

1. Ejecute el comando `yarn start` en la carpeta `docs`.
2. Edite algunos textos de markdown en la carpeta de `documentos` y el sitio web será recargado.

## Solicitudes de incorporación de cambios

### Su primera solicitud de incorporación de cambios. {#first-pull-request}

Así que has decidido contribuir código de vuelta al autor abriendo una solicitud de pull request. Has invertido una buena parte de tiempo, y lo apreciamos. Haremos todo lo posible para trabajar con usted y conseguir que se analice el RP.

Trabajando en tu primera solicitud de Pull Request? Puedes aprender cómo de esta serie de vídeo gratis:

Cómo contribuir a un Proyecto de Código Abierto en GitHub

Tenemos una lista de [problemas para principiantes](https://github.com/softeng/Files/labels/good%20first%20issue) para ayudarte a introducirte en el código base de Files y familiarizarte con nuestro proceso de contribución. Es un gran lugar para empezar.

### Proponiendo un Cambio

Si desea solicitar una nueva característica o mejora pero aún no está pensando en abrir una solicitud de pull request, también puedes [abrir una discusión](#feat) y otros lo codificarán!

Si tiene la intención de arreglar un error, por favor hágalo a través de [problemas](#issues) antes de enviar una solicitud de incorporación de cambios.

Si tiene la intención de añadir una nueva característica, por favor discuta a través de [discusiones en GitHub](#feat) para evitar que varias personas trabajen en la misma solicitud de características.

### Enviando una solicitud de incorporación cambios

asegúrese de que el PR hace sólo una cosa, de lo contrario por favor dividirla. Se recomienda seguir este [estilo de mensaje de commit](#commit-msg).

1. Forkea [el repositorio](https://github.com/softeng/Files) y cree su rama desde `master`.
2. Haga cambios y asegúrese de que su mensaje de confirmación es comprensible.
3. Abre un [PR](https://github.com/softeng/Files/pulls) y asegúrate de describir tu pull request claramente.

## Trabajando en el código de Files

### Configuración regional

Alojamos nuestros locales en [crowdin](https://crwd.in/Files). Para solucionarlo, por favor sigue estos pasos:

- Regístrate en [Crowdin](https://crowdin.com) y Únete a nuestro proyecto [aquí](https://crwd.in/Files).
- Asegúrese de que su local existe allí, si no existe, deja un comentario en [esta discusión](https://github.com/softeng/Files/discussions/30) y añadiré la opción de idioma :)
- Familiarícese con la interfaz de usuario de traducción de Crowdin, ya que deberá usarla para traducir archivos JSON y Markdown
- Traducir el contenido!

#### Archivos prioritarios para traducir en Crowdin

1. `src-ui/Locales`
2. `docs/`

#### Producción

Una vez que los archivos en `src-ui/Locales` han sido traducidos por más del 80%, la añadiremos a la aplicación Files y, para la documentacion, ¡la añadiremos a la producción una vez que la traducción parezca buena!

¡Por favor, comenta [aquí](https://github.com/softeng/Files/discussions/30) si tienes alguna pregunta!

### Biblioteca de Archivos

La librería json de tipos de archivos y miniatura se encuentran en la carpeta `lib` y los iconos se encuentran en la carpeta `src-ui/Icons`. Puedes añadir tipos de archivos e iconos para las extensiones de archivo que quieras usar y enviar un PR.
