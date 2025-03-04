import { useState } from 'react'
import './App.css'
import VideoStream from './components/VideoStream'
import PLYViewer from './components/PLYViewer'
import Controls from './components/Controls'

function App() {
  return (
    <div className='row'>
      <div className='column'>
        <VideoStream />
        <Controls />
      </div>
      <PLYViewer />
    </div>
  )
}

export default App
