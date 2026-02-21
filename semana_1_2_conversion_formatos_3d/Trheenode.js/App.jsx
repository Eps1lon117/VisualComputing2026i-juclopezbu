import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader"
import { useLoader } from "@react-three/fiber"
import { Suspense, useState, useEffect } from "react"
import * as THREE from "three"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"


/* ---------- NORMALIZADOR UNIVERSAL ---------- */
function normalizeModel(object) {

  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3()).length()
  const center = box.getCenter(new THREE.Vector3())

  // mover al origen
  object.position.x -= center.x
  object.position.y -= center.y
  object.position.z -= center.z

  // escalar automáticamente
  const scale = 2 / size
  object.scale.setScalar(scale)

  return object
}



/* ---------- MODELOS ---------- */
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



/* ---------- APP ---------- */
export default function App() {

  const [format, setFormat] = useState("gltf")

  return (
    <>
      <div style={{
        position: "absolute",
        zIndex: 10,
        padding: 10,
        color: "white"
      }}>
        <button onClick={() => setFormat("gltf")}>GLTF</button>
        <button onClick={() => setFormat("obj")}>OBJ</button>
        <button onClick={() => setFormat("stl")}>STL</button>
        <p>Formato actual: {format.toUpperCase()}</p>
      </div>

      <Canvas
        camera={{ position: [3, 2, 3], fov: 50 }}
        gl={{ antialias: true }}
      >

        {/* luz global */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />

        {/* iluminación realista */}
        <Environment preset="studio" />

        <Suspense fallback={null}>
          <Model format={format} />
        </Suspense>

        <OrbitControls makeDefault />

      </Canvas>
    </>
  )
}
