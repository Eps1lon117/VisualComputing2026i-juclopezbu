import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, createPortal } from '@react-three/fiber'
import { OrbitControls, Trail, Stars, useFBO, PerspectiveCamera } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────
// CONSTANTES DE COLISIÓN
// ─────────────────────────────────────────────────────────────
const GROUND_Y       = 0.4   // altura mínima del rover sobre el suelo
const ASTRONAUT_Y    = 1.8   // altura mínima del astronauta (orbita en el aire)
const BORDER_X       = 15.5  // límite lateral del mapa
const BORDER_Z_MIN   = -21.5
const BORDER_Z_MAX   = 21.5
const WALL_REPULSION = 0.3   // margen extra antes de los muros

// Datos de los muros sólidos del laberinto para colisión AABB
// Cada entrada: { minX, maxX, minZ, maxZ }
const WALL_BOXES = [
  // Muro central inferior  position=[-4,1,5]  size=[24,2,0.8]
  { minX: -16.4, maxX:  8.4, minZ:  4.6, maxZ:  5.4 },
  // Muro intermedio superior position=[4,1,-5]  size=[24,2,0.8]
  { minX:  -8.4, maxX: 16.4, minZ: -5.4, maxZ: -4.6 },
  // Cráter cilíndrico position=[0,1,-13] radio ~5 en X (tumbado)
  { minX:  -5.2, maxX:  5.2, minZ: -14.3, maxZ: -11.7 },
]

// Radio del rover para colisión (reducido para permitir giro cerca de muros)
const ROVER_RADIUS = 0.65

function resolveWallCollision(pos) {
  const p = pos.clone()

  // Límites del mapa
  p.x = THREE.MathUtils.clamp(p.x, -BORDER_X + WALL_REPULSION,  BORDER_X - WALL_REPULSION)
  p.z = THREE.MathUtils.clamp(p.z,  BORDER_Z_MIN + WALL_REPULSION, BORDER_Z_MAX - WALL_REPULSION)

  // AABB de muros del laberinto
  for (const b of WALL_BOXES) {
    const inX = p.x > b.minX - ROVER_RADIUS && p.x < b.maxX + ROVER_RADIUS
    const inZ = p.z > b.minZ - ROVER_RADIUS && p.z < b.maxZ + ROVER_RADIUS
    if (!inX || !inZ) continue

    // Calcular penetración en cada eje y empujar por el más corto
    const dxMin = Math.abs(p.x - (b.minX - ROVER_RADIUS))
    const dxMax = Math.abs(p.x - (b.maxX + ROVER_RADIUS))
    const dzMin = Math.abs(p.z - (b.minZ - ROVER_RADIUS))
    const dzMax = Math.abs(p.z - (b.maxZ + ROVER_RADIUS))

    const minD = Math.min(dxMin, dxMax, dzMin, dzMax)
    if      (minD === dxMin) p.x = b.minX - ROVER_RADIUS
    else if (minD === dxMax) p.x = b.maxX + ROVER_RADIUS
    else if (minD === dzMin) p.z = b.minZ - ROVER_RADIUS
    else                     p.z = b.maxZ + ROVER_RADIUS
  }

  // Clamp de suelo
  p.y = GROUND_Y

  return p
}

// ─────────────────────────────────────────────────────────────
// 1. CÁMARA EN PRIMERA PERSONA — se monta DENTRO del grupo rover
//    y escribe su posición/rotación world en un ref compartido
// ─────────────────────────────────────────────────────────────
const RoverFPVCamera = ({ fpvMatrixRef }) => {
  const camRef = useRef()

  useFrame(() => {
    if (!camRef.current) return
    camRef.current.updateMatrixWorld()
    // Exportamos la matrix world para usarla en el canvas HUD
    fpvMatrixRef.current = camRef.current.matrixWorld.clone()
  })

  return (
    // Posicionada en el mástil de la cámara del rover (local)
    <PerspectiveCamera
      ref={camRef}
      makeDefault={false}
      fov={75}
      near={0.1}
      far={120}
      position={[0, 1.25, -0.5]}   // altura del mástil, mirando hacia -Z
      rotation={[0, Math.PI, 0]}    // gira 180° para mirar al frente del rover
    />
  )
}

// ─────────────────────────────────────────────────────────────
// 2. ROVER AUTÓNOMO
// ─────────────────────────────────────────────────────────────
const MarsRover = ({ obstaclesRef, goalRef, fpvMatrixRef }) => {
  const roverRef      = useRef()
  const evasionRef    = useRef(1)        // dirección de giro activa: 1=izq, -1=der
  const forceTurnRef  = useRef(0)        // temporizador de giro forzado (seg)
  const stuckTimerRef = useRef(0)        // tiempo acumulado bloqueado
  const lastPosRef    = useRef(new THREE.Vector3())
  const laserFwdMat   = useRef()
  const laserLMat     = useRef()
  const laserRMat     = useRef()

  const [{ speed, rotSpeed, sensorLen }] = useControls(() => ({
    speed:     { value: 3,   min: 1, max: 8, label: 'Velocidad Rover'  },
    rotSpeed:  { value: 2.5, min: 1, max: 6, label: 'Velocidad Giro'   },
    sensorLen: { value: 4,   min: 2, max: 8, label: 'Alcance Sensores' },
  }))

  const raycaster = new THREE.Raycaster()

  useFrame((_, delta) => {
    if (!roverRef.current || !obstaclesRef.current || !goalRef.current) return
    const rover     = roverRef.current
    const obstacles = obstaclesRef.current.children
    const goalPos   = goalRef.current.position
    const roverPos  = rover.position

    // Meta alcanzada
    if (roverPos.distanceTo(goalPos) < 1.5) {
      laserFwdMat.current?.color.set('#00aaff')
      return
    }

    // ── Detección de stuck: si apenas se movió en 0.6 s, forzar giro largo ──
    stuckTimerRef.current += delta
    if (stuckTimerRef.current > 0.6) {
      const moved = roverPos.distanceTo(lastPosRef.current)
      if (moved < 0.08) {
        // Invertir dirección y girar durante 1.2 s sin condiciones
        evasionRef.current  *= -1
        forceTurnRef.current = 1.2
      }
      lastPosRef.current.copy(roverPos)
      stuckTimerRef.current = 0
    }

    // Sensores: 5 rayos — frente, ±45°, ±90° (lateral puro)
    const q = rover.quaternion
    const fDir  = new THREE.Vector3(0, 0, -1).applyQuaternion(q)
    const lDir  = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0),  Math.PI/4).applyQuaternion(q)
    const rDir  = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/4).applyQuaternion(q)
    const l90   = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0),  Math.PI/2).applyQuaternion(q)
    const r90   = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/2).applyQuaternion(q)

    raycaster.set(roverPos, fDir)
    const fHits = raycaster.intersectObjects(obstacles, true)
    const hitF  = fHits.length > 0 && fHits[0].distance < sensorLen

    raycaster.set(roverPos, lDir)
    const lHits = raycaster.intersectObjects(obstacles, true)
    const hitL  = lHits.length > 0 && lHits[0].distance < sensorLen

    raycaster.set(roverPos, rDir)
    const rHits = raycaster.intersectObjects(obstacles, true)
    const hitR  = rHits.length > 0 && rHits[0].distance < sensorLen

    // Rayos laterales puros para detectar muro paralelo (wall-following)
    raycaster.set(roverPos, l90)
    const l90Hits = raycaster.intersectObjects(obstacles, true)
    const wallL   = l90Hits.length > 0 && l90Hits[0].distance < 1.4

    raycaster.set(roverPos, r90)
    const r90Hits = raycaster.intersectObjects(obstacles, true)
    const wallR   = r90Hits.length > 0 && r90Hits[0].distance < 1.4

    // Feedback visual
    laserFwdMat.current?.color.set(hitF ? '#ff2244' : '#00ff88')
    laserLMat.current?.color.set(hitL   ? '#ffaa00' : '#00ffff')
    laserRMat.current?.color.set(hitR   ? '#ffaa00' : '#00ffff')

    // ── Máquina de estados con anti-stuck ────────────────────────
    if (forceTurnRef.current > 0) {
      // Giro forzado: ignorar sensores, rotar en la dirección elegida
      forceTurnRef.current -= delta
      rover.rotation.y += evasionRef.current * rotSpeed * delta
      // Avanzar un poco mientras gira para salir del punto
      rover.translateZ(-speed * 0.4 * delta)

    } else if (hitF) {
      // Obstáculo al frente: elegir lado libre
      let dir = evasionRef.current
      if      (hitR && !hitL) dir =  1
      else if (hitL && !hitR) dir = -1
      else if (hitL && hitR)  dir = (lHits[0]?.distance ?? 0) > (rHits[0]?.distance ?? 0) ? 1 : -1
      evasionRef.current = dir
      rover.rotation.y += dir * rotSpeed * delta

    } else if (wallL && !wallR) {
      // Muro paralelo a la izquierda: hugging → avanzar desviando levemente a la derecha
      rover.rotation.y -= rotSpeed * 0.15 * delta
      rover.translateZ(-speed * delta)

    } else if (wallR && !wallL) {
      // Muro paralelo a la derecha: hugging → avanzar desviando levemente a la izquierda
      rover.rotation.y += rotSpeed * 0.15 * delta
      rover.translateZ(-speed * delta)

    } else {
      // Camino libre: orientarse hacia la meta
      const toGoal = new THREE.Vector3().subVectors(goalPos, roverPos)
      const target = Math.atan2(-toGoal.x, -toGoal.z)
      let diff     = target - rover.rotation.y
      diff         = Math.atan2(Math.sin(diff), Math.cos(diff))
      rover.rotation.y += diff * rotSpeed * 0.6 * delta
      rover.translateZ(-speed * delta)
    }

    // ── COLISIÓN AABB post-movimiento ─────────────────────────
    const corrected = resolveWallCollision(rover.position)
    rover.position.copy(corrected)
  })

  const a45 = Math.PI / 4

  return (
    <group ref={roverRef} position={[0, GROUND_Y, 14]}>

      {/* Cámara FPV montada en el rover */}
      <RoverFPVCamera fpvMatrixRef={fpvMatrixRef} />

      <Trail width={0.6} length={40} color="#ff6600" attenuation={t => t * t}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.4, 2]} />
          <meshStandardMaterial color="#c87941" roughness={0.6} metalness={0.4} />
        </mesh>
      </Trail>

      {/* Cuerpo superior */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.9, 0.3, 1.2]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Panel solar izquierdo */}
      <mesh position={[-1.1, 0.5, 0]} rotation={[0, 0, Math.PI * 0.1]}>
        <boxGeometry args={[0.9, 0.05, 1.2]} />
        <meshStandardMaterial color="#1a3a6e" emissive="#0033aa" emissiveIntensity={0.3} />
      </mesh>

      {/* Panel solar derecho */}
      <mesh position={[1.1, 0.5, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
        <boxGeometry args={[0.9, 0.05, 1.2]} />
        <meshStandardMaterial color="#1a3a6e" emissive="#0033aa" emissiveIntensity={0.3} />
      </mesh>

      {/* Mástil cámara */}
      <mesh position={[0, 0.8, -0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, -0.5]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#222" emissive="#00aaff" emissiveIntensity={0.8} />
      </mesh>

      {/* Ruedas (6) */}
      {[[-0.75,-0.3,0.8],[0.75,-0.3,0.8],
        [-0.75,-0.3,0],  [0.75,-0.3,0],
        [-0.75,-0.3,-0.8],[0.75,-0.3,-0.8]].map(([x,y,z],i) => (
        <mesh key={i} position={[x,y,z]} rotation={[0,0,Math.PI/2]}>
          <cylinderGeometry args={[0.22,0.22,0.15,14]} />
          <meshStandardMaterial color="#333" roughness={0.9} />
        </mesh>
      ))}

      {/* Sensores laser */}
      <mesh position={[0, 0, -sensorLen / 2]}>
        <boxGeometry args={[0.02, 0.02, sensorLen]} />
        <meshBasicMaterial ref={laserFwdMat} color="#00ff88" transparent opacity={0.7} />
      </mesh>
      <group rotation={[0, a45, 0]}>
        <mesh position={[0, 0, -sensorLen / 2]}>
          <boxGeometry args={[0.02, 0.02, sensorLen]} />
          <meshBasicMaterial ref={laserLMat} color="#00ffff" transparent opacity={0.5} />
        </mesh>
      </group>
      <group rotation={[0, -a45, 0]}>
        <mesh position={[0, 0, -sensorLen / 2]}>
          <boxGeometry args={[0.02, 0.02, sensorLen]} />
          <meshBasicMaterial ref={laserRMat} color="#00ffff" transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. ASTRONAUTA — orbita elevado, nunca toca el suelo
// ─────────────────────────────────────────────────────────────
const OrbitingAstronaut = ({ goalRef }) => {
  const astronautRef = useRef()
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta * 0.5
    if (!astronautRef.current || !goalRef.current) return
    const gp = goalRef.current.position

    // Órbita elevada: Y mínimo = ASTRONAUT_Y para nunca rozar el suelo
    const orbitY = Math.max(
      ASTRONAUT_Y,
      gp.y + Math.sin(t.current * 0.7) * 1.8 + 2.5
    )

    astronautRef.current.position.set(
      gp.x + Math.cos(t.current) * 3.5,
      orbitY,
      gp.z + Math.sin(t.current) * 3.5
    )
    astronautRef.current.rotation.y = -t.current
  })

  return (
    <group ref={astronautRef}>
      <mesh castShadow>
        <capsuleGeometry args={[0.22, 0.5, 8, 16]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.3}
          transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.55, -0.18]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={0.4}
          transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.1, 0.25]}>
        <boxGeometry args={[0.3, 0.4, 0.15]} />
        <meshStandardMaterial color="#aaa" metalness={0.7} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// 4. SATÉLITE GIRATORIO
// ─────────────────────────────────────────────────────────────
const RotatingSatellite = ({ position }) => {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4
      ref.current.rotation.x += delta * 0.1
    }
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <boxGeometry args={[0.6, 0.6, 1.2]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>
      {[-1.1, 1.1].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[1.2, 0.05, 0.7]} />
          <meshStandardMaterial color="#1a2e6e" emissive="#002288" emissiveIntensity={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshStandardMaterial color="#ccc" metalness={1} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={1} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// 5. ESCENARIO MARCIANO
// ─────────────────────────────────────────────────────────────
const MarsEnvironment = React.forwardRef((_, ref) => (
  <group ref={ref}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[35, 45]} />
      <meshStandardMaterial color="#8b3a1a" roughness={0.95} />
    </mesh>

    {[
      { p: [0, 2, -22],  g: [35, 4, 0.8] },
      { p: [0, 2,  22],  g: [35, 4, 0.8] },
      { p: [-17, 2, 0],  g: [0.8, 4, 45] },
      { p: [17, 2,  0],  g: [0.8, 4, 45] },
    ].map(({ p, g }, i) => (
      <mesh key={i} position={p} castShadow receiveShadow>
        <boxGeometry args={g} />
        <meshStandardMaterial color="#7a3318" roughness={0.9} />
      </mesh>
    ))}

    <mesh position={[-4, 1, 5]} castShadow>
      <boxGeometry args={[24, 2, 0.8]} />
      <meshStandardMaterial color="#6b2d14" roughness={0.85} />
    </mesh>
    <mesh position={[4, 1, -5]} castShadow>
      <boxGeometry args={[24, 2, 0.8]} />
      <meshStandardMaterial color="#6b2d14" roughness={0.85} />
    </mesh>

    <mesh position={[0, 1, -13]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[1.5, 1.5, 10, 24]} />
      <meshStandardMaterial color="#5e2510" roughness={0.9} />
    </mesh>

    {[[-6,0.4,10],[6,0.3,8],[-8,0.5,-3],[8,0.4,-10],[-3,0.3,-18],[5,0.6,-18]].map(([x,y,z],i) => (
      <mesh key={i} position={[x,y,z]} castShadow>
        <dodecahedronGeometry args={[0.4+(i%3)*0.2,0]} />
        <meshStandardMaterial color="#7a3a1a" roughness={0.95} />
      </mesh>
    ))}

    <group position={[3, 0, -17]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 1.2, 6]} />
        <meshStandardMaterial color="#c8b87a" metalness={0.5} roughness={0.4} />
      </mesh>
      {[0,1,2,3].map(i => (
        <mesh key={i}
          position={[Math.cos(i*Math.PI/2)*1.2, 0.2, Math.sin(i*Math.PI/2)*1.2]}
          rotation={[0,0,Math.PI*0.15]}>
          <boxGeometry args={[0.08,0.8,0.08]} />
          <meshStandardMaterial color="#aaa" metalness={0.8} />
        </mesh>
      ))}
      <mesh position={[0,1.4,0]}>
        <sphereGeometry args={[0.3,10,10]} />
        <meshStandardMaterial color="#ffcc44" emissive="#ff9900" emissiveIntensity={0.8} />
      </mesh>
    </group>
  </group>
))

// ─────────────────────────────────────────────────────────────
// 6. BEACON META
// ─────────────────────────────────────────────────────────────
const GoalBeacon = React.forwardRef((_, ref) => {
  const innerRef = useRef()
  useFrame(({ clock }) => {
    if (innerRef.current)
      innerRef.current.position.y = 0.6 + Math.sin(clock.elapsedTime * 2) * 0.15
  })
  return (
    <group ref={ref} position={[0, 0, -18]}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#999" metalness={0.8} />
      </mesh>
      <mesh ref={innerRef} position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ff8800" emissiveIntensity={0.9}
          roughness={0.1} metalness={0.3} />
      </mesh>
      <pointLight position={[0, 1, 0]} color="#ff8800" intensity={3} distance={6} />
    </group>
  )
})

// ─────────────────────────────────────────────────────────────
// 7. CANVAS HUD — miniatura con vista en primera persona
// ─────────────────────────────────────────────────────────────
const FPVScene = ({ fpvMatrixRef, obstaclesRef, goalRef }) => {
  // Escena espejo: mismo entorno, misma meta, mismos obstáculos
  // La cámara se posiciona usando la matrix world exportada del rover
  const camRef = useRef()

  useFrame(() => {
    if (!camRef.current || !fpvMatrixRef.current) return
    const m = fpvMatrixRef.current
    camRef.current.position.setFromMatrixPosition(m)
    camRef.current.quaternion.setFromRotationMatrix(m)
  })

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={75} near={0.1} far={120} />
      <Stars radius={120} depth={60} count={3000} factor={5} saturation={0} fade speed={0.5} />
      <directionalLight position={[20,15,10]} intensity={1.2} color="#ffcc88" />
      <ambientLight intensity={0.25} color="#330011" />
      <hemisphereLight skyColor="#1a0a2e" groundColor="#4a1a0a" intensity={0.4} />
      <MarsEnvironmentMirror />
      <GoalBeaconMirror />
    </>
  )
}

// Versiones ligeras del entorno para el HUD (sin refs, sin colisión)
const MarsEnvironmentMirror = () => (
  <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,0]}>
      <planeGeometry args={[35,45]} />
      <meshStandardMaterial color="#8b3a1a" roughness={0.95} />
    </mesh>
    {[{p:[0,2,-22],g:[35,4,0.8]},{p:[0,2,22],g:[35,4,0.8]},
      {p:[-17,2,0],g:[0.8,4,45]},{p:[17,2,0],g:[0.8,4,45]}].map(({p,g},i)=>(
      <mesh key={i} position={p}><boxGeometry args={g} />
        <meshStandardMaterial color="#7a3318" roughness={0.9} /></mesh>
    ))}
    <mesh position={[-4,1,5]}><boxGeometry args={[24,2,0.8]} />
      <meshStandardMaterial color="#6b2d14" roughness={0.85} /></mesh>
    <mesh position={[4,1,-5]}><boxGeometry args={[24,2,0.8]} />
      <meshStandardMaterial color="#6b2d14" roughness={0.85} /></mesh>
    <mesh position={[0,1,-13]} rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[1.5,1.5,10,24]} />
      <meshStandardMaterial color="#5e2510" roughness={0.9} /></mesh>
  </group>
)

const GoalBeaconMirror = () => {
  const innerRef = useRef()
  useFrame(({clock}) => {
    if (innerRef.current)
      innerRef.current.position.y = 0.6 + Math.sin(clock.elapsedTime*2)*0.15
  })
  return (
    <group position={[0,0,-18]}>
      <mesh position={[0,1,0]}>
        <cylinderGeometry args={[0.05,0.05,2,8]} />
        <meshStandardMaterial color="#999" metalness={0.8} />
      </mesh>
      <mesh ref={innerRef} position={[0,0.6,0]}>
        <sphereGeometry args={[0.5,24,24]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ff8800" emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0,1,0]} color="#ff8800" intensity={3} distance={6} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// 8. COMPONENTE RAÍZ
// ─────────────────────────────────────────────────────────────
export default function App() {
  const obstaclesRef = useRef()
  const goalRef      = useRef()
  // Ref compartido que transporta la matrix world de la FPV cam
  const fpvMatrixRef = useRef(null)

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#0a0005', position:'relative' }}>

      {/* ── Canvas principal (vista orbital) ── */}
      <Canvas camera={{ position:[0,28,30], fov:50 }} shadows
        style={{ width:'100%', height:'100%' }}>
        <Stars radius={120} depth={60} count={5000} factor={5} saturation={0} fade speed={0.5} />
        <directionalLight position={[20,15,10]} intensity={1.2} color="#ffcc88"
          castShadow shadow-mapSize={[2048,2048]} />
        <ambientLight intensity={0.25} color="#330011" />
        <hemisphereLight skyColor="#1a0a2e" groundColor="#4a1a0a" intensity={0.4} />

        <GoalBeacon ref={goalRef} />
        <MarsEnvironment ref={obstaclesRef} />
        <MarsRover obstaclesRef={obstaclesRef} goalRef={goalRef} fpvMatrixRef={fpvMatrixRef} />
        <OrbitingAstronaut goalRef={goalRef} />
        <RotatingSatellite position={[-8,12,-10]} />
        <RotatingSatellite position={[9,15,-5]} />
        <OrbitControls maxPolarAngle={Math.PI/2.1} />
      </Canvas>

      {/* ── HUD: vista en primera persona (canvas superpuesto) ── */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 280,
        height: 180,
        borderRadius: 8,
        overflow: 'hidden',
        border: '2px solid #00aaff55',
        boxShadow: '0 0 18px #00aaff44',
      }}>
        {/* Etiqueta */}
        <div style={{
          position:'absolute', top:6, left:8, zIndex:10,
          color:'#00aaff', fontFamily:'monospace', fontSize:11,
          letterSpacing:1, textShadow:'0 0 6px #00aaff',
          pointerEvents:'none',
        }}>
          ◉ ROVER CAM — FPV
        </div>

        <Canvas
          camera={{ position:[0,1,0], fov:75 }}
          style={{ width:'100%', height:'100%', background:'#0a0005' }}
          gl={{ antialias:false }}           // más liviano para HUD
        >
          <FPVScene fpvMatrixRef={fpvMatrixRef} />
        </Canvas>
      </div>

    </div>
  )
}
