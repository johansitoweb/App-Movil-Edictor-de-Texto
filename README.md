

# Editor de Texto Simple con React Native

Este es un editor de texto básico construido con **React Native**, diseñado para ofrecer una experiencia de edición intuitiva y estéticamente agradable. Permite a los usuarios crear, editar y guardar documentos, aplicar formatos de texto básicos, y gestionar una lista de documentos favoritos.

-----

## Características

  * **Creación y Edición de Documentos**: Escribe y edita tu contenido en un solo campo de texto, donde la primera línea actúa como el título del documento.
  * **Formato de Texto Rico**:
      * **Negrita**, **Cursiva**, **Subrayado**.
      * **Color de Fuente** (con un selector predefinido).
      * **Tamaño de Fuente** (con un selector predefinido).
      * **Alineación de Texto** (izquierda, centro, derecha).
  * **Manejo de Páginas**: Añade nuevas "páginas" a tu documento para una mejor organización.
  * **Guardado y Carga de Documentos**: Los documentos se guardan automáticamente y se pueden cargar desde una lista de documentos guardados (usando la primera línea como título).
  * **Documentos Favoritos**: Marca documentos como favoritos para acceder a ellos rápidamente en una sección dedicada.
  * **Contadores de Texto**: Visualiza el número de páginas, palabras y caracteres de tu documento.
  * **Interfaz de Usuario Estética**:
      * **Pantalla de Carga (Splash Screen)**: Una pantalla de bienvenida atractiva al iniciar la aplicación.
      * **Diseño Moderno**: Botones estilizados, sombras suaves y una paleta de colores cohesiva para una experiencia visual agradable.
      * **Modales Mejorados**: Ventanas modales interactivas y bien diseñadas para la carga de documentos y selectores de formato.

-----

## Cómo Funciona

El editor utiliza un `TextInput` principal para la entrada de texto y un `Text` superpuesto (`renderedTextContainer`) para mostrar el texto con el formato aplicado en tiempo real. Los formatos se aplican insertando marcadores (ej. `**texto**` para negrita, `[color:#FF0000]texto[/color]` para color) en la cadena de texto subyacente.

La gestión del cursor y la selección se maneja de forma programática para garantizar una experiencia de usuario fluida, incluso al aplicar formatos que modifican la longitud del texto.

-----

## Requisitos

  * Node.js
  * npm o Yarn
  * Expo CLI (recomendado para un inicio rápido)

-----

## Instalación y Ejecución

Sigue estos pasos para poner en marcha el editor en tu entorno local:

1.  **Clona el repositorio (o copia el código):**
    Si tienes el código en un archivo, créate un nuevo proyecto de React Native:

    ```bash
    npx create-expo-app mi-editor-de-texto
    cd mi-editor-de-texto
    ```

    Luego, reemplaza el contenido de `App.js` con el código proporcionado.

2.  **Instala las dependencias:**
    Asegúrate de que estás en el directorio de tu proyecto y ejecuta:

    ```bash
    npm install
    # o
    yarn install
    ```

3.  **Ejecuta la aplicación:**
    Inicia el servidor de desarrollo de Expo:

    ```bash
    npx expo start
    ```

    Esto abrirá una interfaz en tu navegador. Desde ahí, puedes escanear el código QR con la aplicación **Expo Go** en tu dispositivo móvil (Android o iOS) o usar un simulador/emulador.

-----

## Uso

1.  **Iniciar la Aplicación**: Verás una pantalla de carga y luego serás dirigido al editor principal.
2.  **Título y Contenido**: La primera línea del área de texto es para el título de tu documento. Presiona `Enter` para comenzar el cuerpo del texto.
3.  **Barra de Herramientas Superior**:
      * **Guardar**: Guarda el documento actual.
      * **Página**: Añade una nueva página al documento.
      * **Descargar**: Muestra un mensaje sobre la limitación de la descarga directa en React Native.
      * **Cargar**: Abre un modal para seleccionar y cargar un documento guardado.
      * **Nuevo**: Borra el contenido actual para empezar un documento nuevo.
4.  **Barra de Herramientas de Formato**: Selecciona el texto y luego pulsa los botones para aplicar **negrita (B)**, **cursiva (I)**, **subrayado (U)**, **color de fuente (🎨)**, **tamaño de fuente (A±)** o **alineación (←, ↔, →)**.
5.  **Favoritos**: Pulsa el botón "★ Favorito" en el pie de página para marcar/desmarcar un documento como favorito. Usa "Ver Favoritos" para ir a la lista.

-----

## Consideraciones Técnicas

  * El editor se mantiene **autónomo** sin librerías externas para la gestión de estados complejos o íconos, lo que lo hace ligero y fácil de entender.
  * El sistema de formato se basa en **marcadores de texto** simples (ej. `**`, `[color:...]`) que se interpretan para el renderizado visual.
  * La funcionalidad de "guardar" es una simulación que guarda los documentos en el estado de la aplicación (`savedDocuments`) y se perderá al recargar la aplicación por completo. Para una persistencia real, se necesitaría una solución de almacenamiento local (como `AsyncStorage`) o una base de datos.

-----