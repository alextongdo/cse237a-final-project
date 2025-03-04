import uvicorn
import subprocess
from fastapi import FastAPI, WebSocket

async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

@app.get('/')
async def health_check():
    return {"status": "success"}

"""
Expects websocket motor control events that looks like:
{ "control": "extend" } // or retract or stop
"""
@app.websocket('/motor')
async def motor_control_websocket(websocket: WebSocket):
    await websocket.accept()
    motor_process = None
    while True:
        event = await websocket.receive_json()
        control = event.get("control")

        if control == "extend":
            if motor_process:
                motor_process.terminate()
            motor_process = subprocess.Popen(["./extend"])
            await websocket.send_json({"status": "success"})
        elif control == "retract":
            if motor_process:
                motor_process.terminate()
            motor_process = subprocess.Popen(["./retract"])
            await websocket.send_json({"status": "success"})
        elif control == "stop":
            if motor_process:
                motor_process.terminate()
            subprocess.run(["./extend"])
            await websocket.send_json({"status": "success"})
        
        await websocket.send_json({"status": "failure"})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)