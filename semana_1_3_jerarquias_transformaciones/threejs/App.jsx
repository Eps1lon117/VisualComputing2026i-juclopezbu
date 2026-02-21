import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { Suspense, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";

/* ---------------- PLANET ---------------- */
function Planet({ path, size = 1 }) {
  const { scene } = useGLTF(path);

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const sizeVec = new THREE.Vector3();
    box.getSize(sizeVec);

    const maxAxis = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
    const scaleFactor = size / maxAxis;
    scene.scale.setScalar(scaleFactor);

    // Centrar pivote
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center.multiplyScalar(scaleFactor));
  }, [scene, size]);

  return <primitive object={scene} />;
}

/* ---------------- ORBITA VISUAL ---------------- */
function Orbit({ radius }) {
  const geometry = useMemo(() => {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * radius,
          0,
          Math.sin(theta) * radius
        )
      );
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  return (
    <lineLoop geometry={geometry} position={[0, 0.01, 0]}>
      <lineBasicMaterial
        color="white"
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </lineLoop>
  );
}

/* ---------------- SISTEMA JERÁRQUICO ---------------- */
function HierarchySystem() {
  // Tamaños de los planetas
  const planet2Size = 1.5; // Centro
  const planet1Size = 1;   // Hijo
  const planetSize = 0.7;  // Nieto

  // Radios de separación (ajustados para evitar solapamiento)
  const orbitRadiusChild = 4;      // Órbita de Planet_1 respecto a Planet_2
  const orbitRadiusGrandchild = 2.5; // Órbita de Planet respecto a Planet_1

  // Controladores para el nodo padre (Planet_2)
  const { rotY, posX, posZ } = useControls("Padre (Planet_2)", {
    rotY: { value: 0, min: 0, max: Math.PI * 2, step: 0.01, label: "Rotación Y" },
    posX: { value: 0, min: -10, max: 10, step: 0.1, label: "Posición X" },
    posZ: { value: 0, min: -10, max: 10, step: 0.1, label: "Posición Z" },
  });

  // Controlador para el hijo (Planet_1)
  const { rotYChild } = useControls("Hijo (Planet_1)", {
    rotYChild: { value: 0, min: 0, max: Math.PI * 2, step: 0.01, label: "Rotación Y" },
  });

  // Controlador para el nieto (Planet)
  const { rotYGrandchild } = useControls("Nieto (Planet)", {
    rotYGrandchild: { value: 0, min: 0, max: Math.PI * 2, step: 0.01, label: "Rotación Y" },
  });

  return (
    // Nodo padre: Planet_2
    <group position={[posX, 0, posZ]} rotation={[0, rotY, 0]}>
      <Planet path="/models/Planet_2.glb" size={planet2Size} />
      {/* Órbita visual para Planet_1 */}
      <Orbit radius={orbitRadiusChild} />

      {/* Nodo hijo: Planet_1 */}
      <group rotation={[0, rotYChild, 0]}>
        <group position={[orbitRadiusChild, 0, 0]}>
          <Planet path="/models/Planet_1.glb" size={planet1Size} />
          {/* Órbita visual para Planet */}
          <Orbit radius={orbitRadiusGrandchild} />

          {/* Nodo nieto: Planet */}
          <group rotation={[0, rotYGrandchild, 0]}>
            <group position={[orbitRadiusGrandchild, 0, 0]}>
              <Planet path="/models/Planet.glb" size={planetSize} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ---------------- APP ---------------- */
export default function App() {
  return (
    <>
      <Leva collapsed={false} />
      <Canvas camera={{ position: [0, 6, 18], near: 0.01, far: 10000 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} />
        <Suspense fallback={null}>
          <HierarchySystem />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </>
  );
}