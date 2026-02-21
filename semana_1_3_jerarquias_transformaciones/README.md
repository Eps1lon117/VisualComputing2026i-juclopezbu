# Taller - Jerarquías y Transformaciones: El Árbol del Movimiento

## [Tu Nombre Completo]
## 2026-02-21

---

## Descripción breve

El objetivo de este taller fue comprender y aplicar estructuras jerárquicas (árboles de transformación) para organizar escenas 3D. Se exploró cómo las transformaciones aplicadas a un nodo "padre" afectan de manera relativa a sus nodos "hijos" y "nietos". 

La actividad se centró en la creación de sistemas donde el movimiento es heredado, permitiendo simular comportamientos complejos (como un sistema solar o un brazo robótico) mediante la manipulación de un solo punto de origen.

---

## Implementaciones

### 1. Three.js con React Three Fiber
Se desarrolló una escena utilizando **Vite** y **React Three Fiber** para gestionar el grafo de escena. 
* **Jerarquía:** Se utilizó la etiqueta `<group>` para agrupar múltiples `<mesh>`.
* **Control:** Se integró la librería **Leva** para proporcionar sliders de control en tiempo real sobre la rotación y posición del nodo padre.
* **Estado de la visualización:** Se logró implementar la jerarquía funcional, aunque se presentó una dificultad estética: los objetos quedaron superpuestos en el origen. Sin embargo, se validó mediante los controles de Leva que la rotación aplicada al grupo afectaba a todos los elementos internos como una sola unidad.

### 2. Unity (LTS)
Se construyó una jerarquía física en el editor de Unity consistente en tres niveles: **Padre → Hijo → Nieto**.
* **Estructura:** Se utilizaron cubos y esferas anidados en la jerarquía del `Inspector`.
* **Scripting:** Un script en C# permitió vincular la interfaz de usuario (UI Sliders) con las propiedades del nodo raíz.
* **Herencia:** Se observó cómo al rotar o escalar el objeto padre, los descendientes mantenían su posición relativa pero sufrían las mismas transformaciones espaciales.

---

## Resultados visuales

### Three.js - Implementación y Controles
![Resultado Threejs 1](./media/three.js_resultado_1.gif)
*Descripción: Interfaz de Leva controlando la rotación del grupo. Se observa la superposición de mallas pero la rotación jerárquica funcional.*

### Unity - Jerarquía en Movimiento
![Resultado Unity 1](./media/unity_resultado_1.gif)
*Descripción: Manipulación del nodo padre mediante sliders y observación de la herencia de transformación en hijo y nieto.*

![Resultado Unity 2](./media/unity_resultado_2.gif)
*Descripción: Vista del Inspector mostrando los valores de posición y rotación actualizándose en tiempo real.*

---

## Código relevante

### Fragmento de Jerarquía en React Three Fiber:
```jsx
// Estructura de grupo (Padre) con hijos anidados
const Scene = () => {
  const { rotation, position } = useControls({
    rotation: [0, 0, 0],
    position: [0, 0, 0]
  });

  return (
    <group rotation={rotation} position={position}>
      <mesh> <boxGeometry /> </mesh> {/* Padre */}
      <mesh position={[0, 0, 0]}> <sphereGeometry /> </mesh> {/* Hijo superpuesto */}
    </group>
  );
}
