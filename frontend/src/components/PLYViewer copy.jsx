import * as THREE from 'three'
import React, { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import './PLYViewer.css'

function PLYPointCloud({ url }) {
  const meshRef = useRef()
  const geometry = useLoader(PLYLoader, url)
  const { camera } = useThree()

  geometry.computeBoundingSphere();
  const center = geometry.boundingSphere.center;
  geometry.translate(-center.x, -center.y, -center.z)
  geometry.rotateX(Math.PI/2);

  const radius = geometry.boundingSphere.radius;
  camera.position.set(0, 0, radius*1.5);

  return (
    <points ref={meshRef}>
      <bufferGeometry {...geometry} />
      <pointsMaterial
        vertexColors
        size={0.02} // Size of points in point cloud
        sizeAttenuation
      />
    </points>
  )
}

function Axes() {
  const axesRef = useRef()
  return (
    <primitive object={new THREE.AxesHelper(1)} ref={axesRef} />
  )
}

export default function PLYViewer() {
  return (
    <div className='round-border margin glow relative'>
      <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
        <OrbitControls />
        <Axes />
        <PLYPointCloud url="current.ply" />
      </Canvas>
      <button onClick={console.log("refresh")} className='refresh-button'>
        Refresh
      </button>
    </div>
  )
}
