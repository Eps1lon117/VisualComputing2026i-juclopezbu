# Taller - Construyendo el Mundo 3D: Vértices, Aristas y Caras

## Juan Camilo Lopez Bustos

## 2026-02-20


---

## Descripción breve

El objetivo del taller es aprender a usar las diferentes herramientas para la visualización y manipulación de las caracteristicas básicas de objetos tri-dimensionales, tales como aristas, caras y vertices.

Esto se logró a traves de la implementación de las herramientas de unity y python (en colab), las cuales a traves de scripts y metodos de diferentes bibliotecas ayudaron a obtener información de una figura tri-dimensional 
sencilla que se escogio bajo el formato  `.OBJ` el cual se observa en la siguiente imagen:


![Modelo pokeball](semana_1_1_construyendo_mundo_3d/media/pokebola.png)

Gracias a estas herramientas y al uso de scripts se logró recabar la información necesaria sobre las aristas, caras y vertices además de su visualización
 con dichas caracteristicas.

---

## Implementaciones

### Python
En Python se utilizaron las librerias de `trimesh`, `vedo`, `matplotlib`, `pythreejs` y `pyglet` para lograr una correcta visualización del objeto, y poder analizar las caracteristicas del mismo usando `trimesh`, las
demás librerias apoyaban la visualización ya que colab no cuenta con un motor gráfico integrado, logrando así realizar el contedo de aristas, caras y nodos, además de vizualizarlos y poder interactuar con el objeto.


### Unity

Con esta erramienta solo fue necesaria la implementación de un escript de `C#` el cual recolectó la información del número de aristas, caras y nodos, y la visualización de estas se realizón con la misma herramienta, ya
lo que facilitó la realización de la actividad.

---

## Resultados visuales


Incluye al menos 2 capturas, GIFs o videos por cada implementación. Los archivos deben estar en la carpeta `media/` del proyecto.

### Python - Implementación

![Resultado Python 1](./media/python_resultado_1.gif)


Resultado de la implementación del script en python con el entorno grafico.


### Unity - Implementación

![Resultado Unity 1](./media/unity_resultado_1.gif)

Demostración del funcionamiento del script y visualización de aristas y nodos, más colores originales del objeto.


![Resultado Unity 1](./media/unity_resultado_2.gif)

Demostración del funcionamiento del script y visualización de aristas y nodos.


---

## Código relevante

Incluye snippets del código más importante o enlaces a los archivos completos.

### Ejemplo de código Python:

```python
import cv2
import numpy as np

# Cargar imagen
image = cv2.imread('input.jpg')

# Aplicar filtro
filtered = cv2.GaussianBlur(image, (5, 5), 0)
```

### Ejemplo de código Unity (C#):

```csharp
void Update() {
    transform.Rotate(Vector3.up * rotationSpeed * Time.deltaTime);
}
```

### Ejemplo de código Three.js:

```javascript
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Box() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}
```

---

## Prompts utilizados

Lista los prompts utilizados con herramientas de IA generativa durante el desarrollo del taller (si aplica).

### Ejemplos:

```
"Crea un script en Python que detecte bordes usando el algoritmo de Canny"

"Explícame cómo implementar flujo óptico con OpenCV"

"Genera un shader básico en GLSL para efecto de ondas"
```

Si no utilizaste IA generativa, indica: "No se utilizaron prompts de IA en este taller."

---

## Aprendizajes y dificultades

Reflexión personal sobre el proceso de desarrollo del taller en 2-3 párrafos.

### Aprendizajes

¿Qué aprendiste o reforzaste con este taller? ¿Qué conceptos técnicos quedaron más claros?

### Dificultades

¿Qué parte fue más compleja o desafiante? ¿Cómo lo resolviste?

### Mejoras futuras

¿Qué mejorarías o qué aplicarías en futuros proyectos?

---

## Contribuciones grupales (si aplica)

Si el taller fue realizado en grupo, describe exactamente lo que tú hiciste:

```markdown
- Programé el detector de características SIFT en Python
- Implementé la interfaz de usuario en Three.js
- Generé los GIFs y documentación del README
- Realicé las pruebas de rendimiento y optimización
```

Si fue individual, indica: "Taller realizado de forma individual."

---

## Estructura del proyecto

```
semana_XX_Y_nombre_taller/
├── python/          # Código Python (si aplica)
├── unity/           # Proyecto Unity (si aplica)
├── threejs/         # Código Three.js/React (si aplica)
├── processing/      # Código Processing (si aplica)
├── media/           # OBLIGATORIO: Imágenes, videos, GIFs
└── README.md        # Este archivo
```

---

## Referencias

Lista las fuentes, tutoriales, documentación o papers consultados durante el desarrollo:

- Documentación oficial de OpenCV: https://docs.opencv.org/
- Tutorial de React Three Fiber: https://docs.pmnd.rs/react-three-fiber/
- Paper: "SIFT: Scale-Invariant Feature Transform" - David Lowe

---

## Checklist de entrega

- [ ] Carpeta con nombre `semana_XX_Y_nombre_taller`
- [ ] Código limpio y funcional en carpetas por entorno
- [ ] GIFs/imágenes incluidos con nombres descriptivos en carpeta `media/`
- [ ] README completo con todas las secciones requeridas
- [ ] Mínimo 2 capturas/GIFs por implementación
- [ ] Commits descriptivos en inglés
- [ ] Repositorio organizado y público

---

