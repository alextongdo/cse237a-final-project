import * as THREE from 'three'
import { useRef, useState } from 'react'
import { OrbitControls } from '@react-three/drei'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import './PLYViewer.css'

const DEPTH_ANYTHING_URL = import.meta.env.VITE_DEPTH_ANTYHING_URL
const CAMERA_URL = import.meta.env.VITE_CAMERA_PI_URL

// This file creates a component that makes a request to
// the camera on the vine robot for image. This image is
// sent to the Depth Anything V2 model and converted to a 
// point cloud (PLY). This PLY is then rendered in the
// component using Three.js

function PLYPointCloud({ url }) {
  const meshRef = useRef()
  const geometry = useLoader(PLYLoader, url)
  const { camera } = useThree()

  geometry.computeBoundingSphere();
  const center = geometry.boundingSphere.center;
  // Center the 3D model
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

// Show axes on the 3D model
function Axes() {
  const axesRef = useRef()
  return (
    <primitive object={new THREE.AxesHelper(1)} ref={axesRef} />
  )
}

export default function PLYViewer() {
  const [plyURL, setPlyURL] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Hits the APIs for getting an image and converting it to a PLY
  const depthAnythingPredict = async () => {
    setIsLoading(true)
    setPlyURL(null)
    try {
      const imageResponse = await fetch(`http://${CAMERA_URL}/image`)
      if (!imageResponse.ok) {
        throw new Error("Error fetching image for predction.")
      }
      const imageBlob = await imageResponse.blob();
      const formData = new FormData();
      formData.append('image', imageBlob);

      const predictStartTime = Date.now();
      const plyResponse = await fetch(`http://${DEPTH_ANYTHING_URL}/depth-anything`, {
        method: 'POST',
        body: formData
      })
      if (!plyResponse.ok) {
        throw new Error("Error fetching point cloud after prediction")
      }
      const predictEndTime = Date.now()
      console.log(`Prediction took: ${predictEndTime-predictStartTime} ms`)
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
