import * as THREE from 'three'
import { useRef, useState } from 'react'
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
  geometry.rotateX(Math.PI / 2);

  const radius = geometry.boundingSphere.radius;
  camera.position.set(0, 0, radius * 1.5);

  return (
    <points ref={meshRef}>
      <bufferGeometry {...geometry} />
      <pointsMaterial
        vertexColors
        size={0.005} // Size of points in point cloud
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
  const [plyURL, setPlyURL] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const depthAnythingPredict = async () => {
    setIsLoading(true)
    setPlyURL(null)
    try {
      const imageResponse = await fetch('http://localhost:7999/image')
      if (!imageResponse.ok) {
        throw new Error("Error fetching image for predction.")
      }
      const imageBlob = await imageResponse.blob();
      const formData = new FormData();
      formData.append('image', imageBlob);

      const plyResponse = await fetch('http://localhost:8000/depth-anything', {
        method: 'POST',
        body: formData
      })
      if (!plyResponse.ok) {
        throw new Error("Error fetching point cloud after prediction")
      }
      const plyBlob = await plyResponse.blob();
      const plyUrl = window.URL.createObjectURL(plyBlob);
      console.log(plyUrl)
      setPlyURL(plyUrl)
    } catch (err) {
      console.error('Error fetching PLY:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='round-border margin glow relative'>
      <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
        <OrbitControls />
        <Axes />
        {plyURL && <PLYPointCloud url={plyURL}/>}
      </Canvas>
      <button onClick={depthAnythingPredict} disabled={isLoading} className='refresh-button'>
        Refresh
      </button>
      {isLoading && (
        <div className="loading-message">
          <p>Fetching PLY file...</p>
        </div>
      )}
    </div>
  )
}
