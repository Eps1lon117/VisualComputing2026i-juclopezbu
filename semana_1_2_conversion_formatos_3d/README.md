# Taller - Importando el Mundo: Visualización y Conversión de Formatos 3D

## Juan Camilo Lopez Bustos

## 2026-02-XX

---

## Descripción breve

El objetivo del taller es comprender cómo distintos formatos de modelos tridimensionales almacenan su información geométrica y visual, además de analizar cómo estos son interpretados por diferentes entornos de visualización.

Esto se logró mediante la implementación de herramientas en **Python (Google Colab)** y un visor web en **React Three Fiber**, los cuales permitieron cargar un mismo objeto en distintos formatos `.OBJ`, `.STL` y `.GLTF`, observar sus diferencias y analizar sus propiedades internas.

El modelo utilizado fue convertido entre formatos para comparar:

- número de vértices
- número de caras
- normales
- materiales
- texturas

Además se observó cómo cada formato requiere distintos procesos para reconstruir correctamente su apariencia en pantalla.

---

## Implementaciones

### Python

En Python se utilizaron las librerías `trimesh`, `open3d`, `numpy` y `pyglet` para cargar y analizar los modelos en distintos formatos.

Con estas herramientas se logró:

- cargar archivos `.OBJ`, `.STL` y `.GLTF`
- comparar cantidad de vértices y caras
- detectar diferencias estructurales
- convertir entre formatos
- visualizar los modelos dentro del notebook

Esto permitió analizar cómo cada formato almacena la geometría y qué información adicional posee cada uno.

---

### React Three Fiber (Three.js)

Se desarrolló un visor web interactivo usando:

- React + Vite
- Three.js
- @react-three/fiber
- @react-three/drei

El visor permite alternar entre formatos y observar diferencias visuales entre ellos.

Para esto fue necesario:

- normalizar escala y posición del modelo
- reconstruir materiales para OBJ y STL
- cargar texturas correctamente en GLTF
- aplicar iluminación física

---

## Resultados visuales

Incluye al menos 2 capturas, GIFs o videos por cada implementación.  
Los archivos deben estar en la carpeta `media/` del proyecto.

### Python - Implementación

![Resultado Python 1](./media/python_resultado_1.gif)

Visualización del modelo cargado en diferentes formatos dentro del entorno de Python.

Comparación de propiedades geométricas entre formatos.

---

### React Three Fiber - Implementación

![Resultado Web 1](./media/threeno.js_resultado_1.gif)

Cambio dinámico entre GLTF, OBJ y STL.

Comparación visual de materiales y texturas entre formatos.

---

## Código relevante

Incluye snippets del código más importante o enlaces a los archivos completos.

### Ejemplo de código Python:

```python
def analizar_modelo(ruta):
    print("\n==============================")
    print("Archivo:", ruta)
    print("==============================")

    mesh = trimesh.load(ruta, force='mesh')

    # Conteos básicos
    vertices = len(mesh.vertices)
    caras = len(mesh.faces)

    print("Vértices:", vertices)
    print("Caras:", caras)

    # Normales
    print("Tiene normales:", mesh.vertex_normals is not None)

    # Materiales
    print("Tiene material:", hasattr(mesh.visual, 'material'))

    # Duplicados
    unique_vertices = len(np.unique(mesh.vertices.round(5), axis=0))
    print("Vértices únicos:", unique_vertices)
    print("Duplicados:", vertices - unique_vertices)

    # Área y volumen
    print("Área superficial:", mesh.area)
    print("Volumen:", mesh.volume)

    return mesh
```
Función usada para analizar las propiedades de los diferentes objetos.
### Ejemplo de Java Script (JS):

```javascript
using UnityEngine;
function Model({ format }) {

  /* GLTF */
  if (format === "gltf") {

  const gltf = useLoader(GLTFLoader, "/models/scene.gltf", (loader) => {
    loader.setResourcePath("/models/")
  })

  useEffect(() => {
    normalizeModel(gltf.scene)
  }, [gltf])

  return <primitive object={gltf.scene} />
  }


  /* OBJ */
  if (format === "obj") {
    const obj = useLoader(OBJLoader, "/models/teamugobj.obj")

    obj.traverse((child) => {
      if (child.isMesh) {

        // recalcular normales (EL FIX REAL)
        child.geometry.computeVertexNormals()
        child.geometry.computeBoundingBox()
        child.geometry.center()

        // material físico para que la luz funcione
        child.material = new THREE.MeshStandardMaterial({
          color: 0xbfbfbf,
          roughness: 0.6,
          metalness: 0.1
        })
      }
    })

    return <primitive object={obj} scale={1} />
  }

  /* STL */
  if (format === "stl") {
    const geometry = useLoader(STLLoader, "/models/teamugstl.stl")

    useEffect(() => {
      geometry.center()
      geometry.computeVertexNormals()
    }, [geometry])

    return (
      <mesh geometry={geometry} scale={0.01}>
        <meshStandardMaterial color="#d0d0d0" roughness={0.5} metalness={0.1} />
      </mesh>
    )
  }

  return null
}


```
Función que permite visualizar y ajustar los modelos para cargar texturas y demás de los mismos

---

## Prompts utilizados

Lista los prompts utilizados con herramientas de IA generativa durante el desarrollo del taller (si aplica).

### Ejemplos:

```
"Ayudame a crear un entorno con Three.js con React Three Fiber"

"Configura un entorno para la visualización de un objeto 3d usando python y colab con las herramientas trimesh, open3d, assimp, numpy"

```


---

## Aprendizajes y dificultades

Durante el desarrollo del taller se evidenció que cada formato tridimensional almacena información distinta, lo que obliga al motor gráfico a reconstruir ciertas características manualmente dependiendo del archivo cargado.

El formato GLTF fue el más completo, mientras que STL requirió mayor trabajo manual para su correcta visualización.

### Aprendizajes

Comprensión de la estructura interna de formatos 3D, diferencias entre geometría y material, y funcionamiento básico del pipeline de renderizado en tiempo real.

### Dificultades

Carga de texturas en GLTF y normalización de escala entre formatos, además de la reconstrucción de materiales en OBJ y STL.

### Mejoras futuras

Implementar conteo automático de triángulos en la interfaz y visualización de aristas y vértices en tiempo real.
---


## Referencias

- Documentación Three.js
- Documentación React Three Fiber
- Khronos Group — GLTF Specification
- chat GPT
- https://s3.amazonaws.com/files.free3d.com/models/2/5d98721f26be8b18398b4567/66-teamugobj.rar?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5DEPHINMSI4OS3OO%2F20260215%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260215T142150Z&X-Amz-SignedHeaders=host&X-Amz-Expires=1200&X-Amz-Signature=9b9fdd4b1bee4c080919e5ad7cb0ac82335412d84b0beb05b3588e3052901a80
- https://s3.amazonaws.com/files.free3d.com/models/2/5d98721f26be8b18398b4567/32-teamugstl.rar?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5DEPHINMSI4OS3OO%2F20260215%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260215T142146Z&X-Amz-SignedHeaders=host&X-Amz-Expires=1200&X-Amz-Signature=c30727278280a877c7ee3495f6a107d4cfbd6aa4cbbe425aec07acb5fbba477a
- blob:https://creazilla.com/f62f2e0f-f951-4a06-bca1-413cef87cd5a

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
