import io
import os
import tempfile
import cv2
import torch
import uvicorn
import numpy as np
import open3d as o3d
from PIL import Image
from fastapi import FastAPI, File, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from depth_anything_v2.dpt import DepthAnythingV2

async def lifespan(app: FastAPI):
    # Startup
    DEVICE = 'cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu'
    depth_anything = DepthAnythingV2(
        encoder='vits',
        features=64,
        out_channels=[48, 96, 192, 384],
        max_depth=20,
    )
    depth_anything.load_state_dict(torch.load(
        "checkpoints/depth_anything_v2_metric_hypersim_vits.pth",
        map_location='cpu'
    ))
    depth_anything = depth_anything.to(DEVICE).eval()
    app.state.model = depth_anything
    yield
    # Shutdown

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
async def health_check():
    return {"status": "success"}

@app.post('/depth-anything')
async def predict(image: UploadFile = File(...)):

    raw_image = await image.read()
    color_image = Image.open(io.BytesIO(raw_image)).convert('RGB')
    width, height = color_image.size

    image_array = np.frombuffer(raw_image, np.uint8)
    cv2_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    pred = app.state.model.infer_image(cv2_image, height)

    resized_pred = Image.fromarray(pred).resize((width, height), Image.NEAREST)

    x, y = np.meshgrid(np.arange(width), np.arange(height))
    x = (x - width / 2) / 470.4 # Focal length x
    y = (y - height / 2) / 470.4 # Focal length y
    z = np.array(resized_pred)
    points = np.stack((np.multiply(x, z), np.multiply(y, z), z), axis=-1).reshape(-1, 3)
    colors = np.array(color_image).reshape(-1, 3) / 255.0

    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    pcd.colors = o3d.utility.Vector3dVector(colors)

    temp_file = tempfile.NamedTemporaryFile(suffix='.ply', delete=False)
    temp_file_path = temp_file.name
    temp_file.close()
    o3d.io.write_point_cloud(temp_file_path, pcd)
    with open(temp_file_path, 'rb') as f:
        pcd_bytes = f.read()
    os.unlink(temp_file_path)

    # o3d.io.write_point_cloud("debug.ply", pcd)
    return Response(
        content=pcd_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=point_cloud.ply"}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)