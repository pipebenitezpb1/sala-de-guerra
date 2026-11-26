# Sala de Guerra

Juego de estrategia nuclear en realidad virtual (WebXR) para Meta Quest. Estás sentado en un búnker de mando, con el planeta flotando sobre la mesa. Nadie gana; alguien pierde menos.

**Jugar:** abre la página de GitHub Pages de este repositorio en el navegador del Quest y pulsa **ENTER VR**. Usa audífonos.

## Controles
- **Joystick:** girar el globo. **Grip:** agarrar y arrastrar el globo.
- **Gatillo** sobre una ciudad o silo enemigo: fijar objetivo. **Gatillo otra vez:** lanzar.
- **Gatillo** sobre un misil enemigo: interceptar.
- En escritorio: arrastrar el globo para girarlo, clic = gatillo. Añade `?fast` a la URL para un modo rápido de prueba.

Texturas de la Tierra: ejemplos de three.js (NASA). Voz del operador: síntesis de macOS.

---

## Ficha para el Taller de Diseño de Interfaces

**Unidad 3 · Interfaces Gráficas · Módulo de realidad virtual (WebXR)** · Taller de Diseño de Interfaces, Universidad Adolfo Ibáñez · 2026 · Ficha en el portafolio: [https://portafolio.insta3d.cl/sala-de-guerra/](https://portafolio.insta3d.cl/sala-de-guerra/)

### Objetivos
- Diseñar una interfaz de estrategia legible en realidad virtual, sin mouse ni pantalla plana.
- Usar el globo terráqueo como mapa y como control a la vez.
- Hacer sentir el peso de las decisiones con sonido, voz y consecuencias.

### Público y contexto de uso
Jugadores con visor Meta Quest, sentados y con audífonos; partidas cortas.

### Proceso e iteraciones
- **v1:** búnker, globo y misiles; mapa en la pared, voces civiles y sirenas.
- **v2** (`v2.html`): tensión, decisiones con autoridad, construcción, silos ocultos, invierno nuclear y finales.
- **v3** (`index.html`): consola física, unidades, mundo vivo, llamadas y campaña.
- Tutorial interactivo, porque los controles no se descubrían solos.
- Manos reales, familia en el mapa y salida del búnker.

**Tecnologías:** WebXR + three.js; texturas de la Tierra de los ejemplos de three.js (NASA); voz del operador sintetizada.
**Ejecutar en local:** `python3 -m http.server 8000` y abrir `localhost:8000` (WebXR necesita HTTPS o localhost).

> 📌 **Por aportar:** capturas de v1, v2 y v3 y notas de pruebas con usuarios.

### Video demostrativo
> 📌 **Por aportar:** video grabado desde el Quest, subido a YouTube y enlazado aquí.
