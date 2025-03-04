import './VideoStream.css'

export default function VideoStream() {
    return (
        <div className='round-border margin glow'>
            <h1 className='title'>Live Cam</h1>
            <img src="http://localhost:7999/video" alt="Raspberry Pi video unavailable." width="768px" height="518px" className="black-bg margin round-border"></img>
        </div>
    )
}