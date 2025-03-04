import './Controls.css'

export default function Controls() {

    // const websocket = new WebSocket('ws://192.168.4.5:8000/motor');

    const websocket = new WebSocket('ws://192.168.1.179:8000/motor');

    function controlMotorExtend() {
        websocket.send(JSON.stringify({"control": "extend"}))
    }

    function controlMotorRetract() {
        websocket.send(JSON.stringify({"control": "retract"}))
    }

    function controlMotorStop() {
        websocket.send(JSON.stringify({"control": "stop"}))
    }

    return (
        <div className='round-border margin glow flex1'>
            <h1 className='title'>Controls</h1>
            <div>
                <button className='control-button' onMouseDown={controlMotorRetract} onMouseUp={controlMotorStop} onMouseLeave={controlMotorStop}>
                    Retract
                </button>
                <button className='control-button' onMouseDown={controlMotorExtend} onMouseUp={controlMotorStop} onMouseLeave={controlMotorStop}>
                    Extend
                </button>
            </div>
        </div>
    )
}