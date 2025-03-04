import './VideoStream.css'

CAMERA_URL = import.meta.env.VITE_CAMERA_PI_URL

export default function VideoStream() {
    const camera_url = `http://${CAMERA_URL}/video`
    return (
        <div className='round-border margin glow'>
            <h1 className='title'>Live Cam</h1>
            <img src={camera_url} alt="Raspberry Pi video unavailable." width="768px" height="518px" className="black-bg margin round-border"></img>
        </div>
    )
}