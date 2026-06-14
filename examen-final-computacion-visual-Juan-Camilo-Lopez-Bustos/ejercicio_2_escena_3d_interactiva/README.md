# Ejercicio 2 — Escena 3D Interactiva: Exploración Marciana

## Nombre del estudiante

Juan Camilo López Bustos

## Fecha de entrega

`2026-06-14`

---

## Descripción breve

Este ejercicio construye una escena 3D interactiva ambientada en la superficie de Marte, implementada con **React Three Fiber** y **@react-three/drei**. El propósito fue explorar la integración de jerarquías de objetos 3D, transformaciones, materiales PBR, iluminación temática, animaciones continuas e interacción del usuario dentro de un entorno coherente y narrativamente consistente.

La escena incluye un rover autónomo que navega un laberinto marciano usando una máquina de estados con sensores de raycast para evadir obstáculos y alcanzar una baliza meta, un astronauta en órbita alrededor de esa baliza, dos satélites giratorios en altura y un HUD de vista en primera persona (FPV) superpuesto como segundo canvas independiente. El usuario puede controlar la velocidad del rover, la sensibilidad de giro y el alcance de sus sensores en tiempo real mediante paneles de la librería Leva.

El tema elegido corresponde a la categoría **Exploración espacial**, con elementos propios de una misión robótica marciana: superficie rojiza con cráteres y muros de roca, base con balizas de luz naranja, astronauta en traje espacial y satélites de comunicación en órbita baja.

---

## Implementaciones

### Three.js / React Three Fiber

La escena fue construida íntegramente en un único componente `App.jsx` estructurado en 8 módulos funcionales:

1. **`resolveWallCollision`** — función de resolución de colisiones AABB para mantener al rover dentro del laberinto sin atravesar muros.
2. **`RoverFPVCamera`** — cámara en primera persona montada dentro del grupo del rover; exporta su matrix world a un `ref` compartido para el HUD.
3. **`MarsRover`** — rover autónomo con máquina de estados (avance libre, evasión frontal, wall-following, anti-stuck), 5 sensores de raycast y feedback visual de láser en tiempo real.
4. **`OrbitingAstronaut`** — astronauta que orbita la baliza meta con trayectoria sinusoidal, modelado con geometrías primitivas (`capsuleGeometry`, `sphereGeometry`, `boxGeometry`).
5. **`RotatingSatellite`** — satélite con paneles solares emissivos que rota en dos ejes independientes.
6. **`MarsEnvironment`** — escenario completo: suelo plano rojizo, muros perimetrales, muros interiores del laberinto, cráter cilíndrico tumbado, rocas dispersas y base de exploración con balizas.
7. **`GoalBeacon`** — baliza meta con animación flotante sinusoidal y `pointLight` naranja integrada.
8. **`FPVScene`** — escena espejo ligera para el canvas HUD, que posiciona su cámara usando la matrix world exportada por el rover.

Tecnologías: React 19, `@react-three/fiber`, `@react-three/drei` (OrbitControls, Trail, Stars, useFBO, PerspectiveCamera), `leva`, `three.js`, Vite 8.

---

## Resultados visuales

### Vista orbital principal

![Captura 1](./media/captura_1.png)

Vista aérea de la escena marciana completa: el laberinto con sus muros de roca, el rover autónomo con sus sensores de láser activos, el astronauta en órbita y los satélites en altura. El cielo nocturno marciano está poblado con miles de estrellas generadas con el componente `Stars`.

### HUD de primera persona (FPV)

![Captura 2](./media/captura_2.png)

Detalle del canvas secundario superpuesto en la esquina inferior derecha, etiquetado como `◉ ROVER CAM — FPV`. Muestra en tiempo real la perspectiva desde el mástil de la cámara del rover, sincronizado fotograma a fotograma con la posición y orientación del vehículo en la escena principal.

### Demostración animada

![Demo](./media/demo.gif)

GIF demostrativo que muestra: navegación autónoma del rover esquivando los muros del laberinto, órbita continua del astronauta, rotación de los satélites, animación flotante de la baliza meta, sincronización del HUD FPV y uso de los controles Leva para ajustar velocidad y sensores en tiempo real.

---

## Código relevante

### Máquina de estados del rover (núcleo algorítmico)

```javascript
// 5 rayos de sensor — frente, ±45°, ±90° lateral
const fDir = new THREE.Vector3(0, 0, -1).applyQuaternion(q)
const lDir = new THREE.Vector3(0, 0, -1)
  .applyAxisAngle(new THREE.Vector3(0,1,0),  Math.PI/4).applyQuaternion(q)
const rDir = new THREE.Vector3(0, 0, -1)
  .applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/4).applyQuaternion(q)

raycaster.set(roverPos, fDir)
const hitF = raycaster.intersectObjects(obstacles, true)[0]?.distance < sensorLen

// Máquina de estados
if (forceTurnRef.current > 0) {
  // Giro forzado anti-stuck: rotar en dirección elegida e ignorar sensores
  forceTurnRef.current -= delta
  rover.rotation.y += evasionRef.current * rotSpeed * delta
  rover.translateZ(-speed * 0.4 * delta)
} else if (hitF) {
  // Obstáculo al frente: girar hacia el lado más libre
  let dir = hitR && !hitL ? 1 : hitL && !hitR ? -1 : evasionRef.current
  rover.rotation.y += dir * rotSpeed * delta
} else {
  // Camino libre: orientarse hacia la meta
  const toGoal = new THREE.Vector3()
    .subVectors(goalPos, roverPos).normalize()
  const angle = Math.atan2(toGoal.x, toGoal.z)
  rover.rotation.y = THREE.MathUtils.lerp(rover.rotation.y, angle, 0.03)
  rover.translateZ(-speed * delta)
}
```

### Exportación de la matrix world para el HUD FPV

```javascript
// Dentro de RoverFPVCamera (montado en el grupo del rover)
useFrame(() => {
  camRef.current.updateMatrixWorld()
  fpvMatrixRef.current = camRef.current.matrixWorld.clone()
})

// Dentro de FPVScene (canvas HUD separado)
useFrame(() => {
  const m = fpvMatrixRef.current
  camRef.current.position.setFromMatrixPosition(m)
  camRef.current.quaternion.setFromRotationMatrix(m)
})
```

### Colisión AABB contra muros del laberinto

```javascript
function resolveWallCollision(pos) {
  const p = pos.clone()
  p.x = THREE.MathUtils.clamp(p.x, -BORDER_X + 0.3, BORDER_X - 0.3)
  p.z = THREE.MathUtils.clamp(p.z,  BORDER_Z_MIN + 0.3, BORDER_Z_MAX - 0.3)

  for (const b of WALL_BOXES) {
    const inX = p.x > b.minX - ROVER_RADIUS && p.x < b.maxX + ROVER_RADIUS
    const inZ = p.z > b.minZ - ROVER_RADIUS && p.z < b.maxZ + ROVER_RADIUS
    if (!inX || !inZ) continue
    // Empujar por el eje de menor penetración
    const minD = Math.min(dxMin, dxMax, dzMin, dzMax)
    if (minD === dxMin) p.x = b.minX - ROVER_RADIUS
    else if (minD === dzMin) p.z = b.minZ - ROVER_RADIUS
    // ...
  }
  return p
}
```

### Astronauta en órbita sinusoidal

```javascript
useFrame(({ clock }) => {
  const t = clock.elapsedTime * 0.6
  const gp = goalRef.current.position
  astronautRef.current.position.set(
    gp.x + Math.cos(t) * 3.5,
    Math.max(ASTRONAUT_Y, gp.y + Math.sin(t * 0.7) * 1.8 + 2.5),
    gp.z + Math.sin(t) * 3.5
  )
  astronautRef.current.rotation.y = -t
})
```

---

## Prompts utilizados

```
"Cómo implementar detección de obstáculos con Raycaster en React Three Fiber
para un rover autónomo que navega un laberinto"

"Explícame cómo exportar la matrix world de una cámara montada en un objeto
y usarla para sincronizar una cámara en un canvas separado (HUD)"

"Cómo hacer colisión AABB simple entre un objeto móvil y paredes estáticas
en Three.js sin usar un motor de física"

"Qué diferencia hay entre makeDefault y una cámara sin makeDefault
en React Three Fiber cuando se tienen dos Canvas independientes"

"Genera un componente de astronauta en Three.js usando solo geometrías
primitivas: cápsula para el cuerpo, esfera para el casco"
```

Las respuestas de IA se usaron como punto de partida; la lógica de anti-stuck, el wall-following y la sincronización de doble canvas fueron ajustados y depurados manualmente.

---

## Aprendizajes y dificultades

### Aprendizajes

Este ejercicio profundizó la comprensión de la arquitectura de `useFrame` en React Three Fiber como bucle de renderizado reactivo: al entender que cada llamada a `useFrame` ocurre una vez por fotograma y que los `ref` son la forma correcta de compartir estado mutable entre componentes sin provocar re-renders, la estructura del código se volvió mucho más clara. También fue muy valioso aprender a usar la matrix world de una cámara para "clonar" su perspectiva en un canvas completamente distinto, lo que abre posibilidades para HUDs, minimapas y sistemas de vigilancia en entornos 3D.

La máquina de estados del rover con comportamiento emergente (evasión + anti-stuck + wall-following) mostró en la práctica cómo comportamientos complejos pueden surgir de reglas locales simples, un principio central en robótica reactiva.

### Dificultades

El problema más complejo fue la sincronización del HUD FPV entre dos canvas independientes. React Three Fiber crea contextos WebGL separados por canvas, por lo que no es posible compartir objetos Three.js directamente. La solución fue exportar únicamente datos primitivos (la matrix world como `THREE.Matrix4`) a través de un `ref` compartido y reconstruir la posición y orientación de la cámara HUD en cada fotograma a partir de esa matrix. Depurar este mecanismo requirió entender la diferencia entre `position.setFromMatrixPosition` y `quaternion.setFromRotationMatrix`.

Otro desafío fue el comportamiento de atasco del rover en esquinas cóncavas del laberinto, donde los sensores de ±45° no detectaban el muro lateral correctamente. Se resolvió añadiendo dos sensores adicionales a ±90° para detección de wall-following y un temporizador de anti-stuck que fuerza un giro completo cuando el rover no avanza más de 8 cm en 600 ms.

### Mejoras futuras

- Implementar un algoritmo de pathfinding (A* o navegación por grafo de visibilidad) para reemplazar la máquina de estados reactiva, lo que daría al rover trayectorias óptimas en lugar de comportamiento emergente.
- Añadir interacción por teclado (WASD) para permitir control manual del rover con posibilidad de alternar entre modo autónomo y manual.
- Incluir efectos de partículas para polvo marciano al frenar o girar, usando el sistema de partículas de Three.js.

---

## Estructura del proyecto

```
ejercicio_2_escena_3d_interactiva/
├── trheejs/
│   ├── src/
│   │   ├── App.jsx          # Componente principal: escena completa (8 módulos)
│   │   ├── main.jsx         # Punto de entrada React
│   │   ├── App.css
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
├── media/
│   ├── captura_1.png        # Vista orbital de la escena
│   ├── captura_2.png        # Detalle del HUD FPV
│   └── demo.gif             # Demostración animada completa
└── README.md
```

---

## Referencias

- Documentación de React Three Fiber: https://docs.pmnd.rs/react-three-fiber/
- Documentación de @react-three/drei: https://drei.pmnd.rs/
- Documentación de Leva (controles GUI): https://github.com/pmndrs/leva
- Three.js — Raycaster: https://threejs.org/docs/#api/en/core/Raycaster
- Three.js — Matrix4: https://threejs.org/docs/#api/en/math/Matrix4
- Bruno Simon — Three.js Journey (referencia de materiales PBR y shadows)

---

## Checklist de entrega

- [x] Carpeta `ejercicio_2_escena_3d_interactiva/`
- [x] Código fuente en `trheejs/src/`
- [x] GIFs/imágenes en `media/` con nombres descriptivos
- [x] README completo con todas las secciones requeridas
- [x] Más de 2 capturas por implementación
- [x] Demo GIF mostrando animación, navegación e interacción
- [x] Jerarquía de objetos 3D implementada
- [x] Materiales PBR (metalness/roughness) y emissivos
- [x] Iluminación temática (directional + ambient + hemisphere + pointLight)
- [x] Interacción del usuario (OrbitControls + paneles Leva)
- [x] Animaciones de personajes y elementos (rover, astronauta, satélites, baliza)
