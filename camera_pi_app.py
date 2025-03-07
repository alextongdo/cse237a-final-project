import io
from picamera2 import Picamera2
import uvicorn
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

async def lifespan(app: FastAPI):
    camera = Picamera2()
    config = camera.create_still_configuration(main={"size": (920, 518)})
    camera.configure(config)
    camera.start()
    app.state.camera = camera
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def generate_video_frames():
    stream = io.BytesIO()
    while True:
        app.state.camera.capture_file(stream, format='jpeg')
        stream.seek(0)
        yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + stream.read() + b'\r\n'
        stream.seek(0)
        stream.truncate()

@app.get('/video')
async def camera_video():
    return StreamingResponse(
        generate_video_frames(),
        media_type='multipart/x-mixed-replace; boundary=frame'
    )

@app.get('/image')
async def camera_image():
    stream = io.BytesIO()
    app.state.camera.capture_file(stream, format='jpeg')
    stream.seek(0)
    return StreamingResponse(stream, media_type='image/jpeg')

@app.get('/')
async def health_check():
    return {"status": "success"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)