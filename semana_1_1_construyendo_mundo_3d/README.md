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
!pip install trimesh vedo matplotlib
!pip -q install trimesh pythreejs ipywidgets==7.7.1
!pip install trimesh pyglet
import trimesh
import numpy as np
from pythreejs import *
from IPython.display import display
import vedo

loaded = trimesh.load("model.obj", force="scene")

meshes = []
total_vertices = 0
total_faces = 0
total_edges = 0

for geom in loaded.geometry.values():
    if isinstance(geom, trimesh.Trimesh):
        meshes.append(geom)
        total_vertices += len(geom.vertices)
        total_faces += len(geom.faces)
        total_edges += len(geom.edges_unique)

print(f"Total Vertices: {total_vertices}")
print(f"Total Faces: {total_faces}")
print(f"Total Edges: {total_edges}")
```

### Ejemplo de código Unity (C#):

```csharp
using UnityEngine;

public class MeshAnalyzer : MonoBehaviour
{
    void Start()
    {
        // Buscar MeshFilter primero
        MeshFilter mf = GetComponentInChildren<MeshFilter>();

        Mesh mesh = null;

        if (mf != null)
        {
            mesh = mf.sharedMesh;
        }
        else
        {
            // Buscar SkinnedMeshRenderer si no hay MeshFilter
            SkinnedMeshRenderer smr = GetComponentInChildren<SkinnedMeshRenderer>();

            if (smr != null)
            {
                mesh = smr.sharedMesh;
            }
        }

        if (mesh == null)
        {
            Debug.LogError("No mesh found at all");
            return;
        }

        Debug.Log("===== MESH INFO =====");
        Debug.Log("Vertices: " + mesh.vertexCount);
        Debug.Log("Triangles: " + mesh.triangles.Length / 3);
        Debug.Log("SubMeshes: " + mesh.subMeshCount);
    }
}

```


---

## Prompts utilizados

Lista los prompts utilizados con herramientas de IA generativa durante el desarrollo del taller (si aplica).

### Ejemplos:

```
"Crea un script que ayude con el conteo de aristas, caras, nodos y mallas en C#"

"Configura un entorno para la visualización de un objeto 3d usando python y colab"

"Crea un script que ayude con el conteo de aristas, caras, nodos en python"
```


---

## Aprendizajes y dificultades

Para le ralización de este taller el uso de la herramienta de unity fue lo más comodo, ya que solo fue necesario crear un script para el conteo y la herramienta hizo lo demás en cuanto a visualización; mientras que la herramienta de python fue un poco más compleja de usar ya que requirió de usar otras herramientas para la visualización que presentaron errores y que si no se saben manejar de forma correctas puede presentar una dificultad en tareas o proyectos más complejos.

### Aprendizajes

Aprendí a usar un poco mejor la herramienta, y a visualizar y comprender como se construyen los objetos tri-dimensionales, además de que no todas las herramientas tienen la misma facilidad para usarlas.

### Dificultades

El uso de la herramienta de python para visualizar y contar los atributos del objeto, ya que requería de librerias externas además de una pequeña configuración de un entorno grafico externo para poder visualizar de forma correcta el objeto y sus atributos.

### Mejoras futuras

El uso constante de la herramienta Unity además de aprender a manejar mejor algunas segundas opciones en caso de que no se cuente con el hardware necesario para correr esta herramienta.

---


## Referencias

- pokeball by Jose Ramos: [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/aBDajZAsuFE)
- Tutorial de unity: [https://docs.pmnd.rs/react-three-fiber/](https://youtu.be/zFe77GJs4EQ?si=--z111qBWezaUoji)

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

