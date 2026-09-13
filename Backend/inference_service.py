"""
PyaazSure — Backend Inference Service Contract (FastAPI)
File: Backend/inference_service.py

This module provides the exact contract and endpoint specification for the team's
upcoming trained computer-vision model and sensor ML model.

Run:
    pip install fastapi uvicorn python-multipart
    uvicorn inference_service:app --reload --port 8000
"""

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time

app = FastAPI(
    title="PyaazSure AI Vision & Sensor Inference API",
    description="Endpoint specifications for trained onion quality models.",
    version="2.0.0"
)

# Enable CORS for the PWA frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CalibrationData(BaseModel):
    marker_detected: bool = False
    pixels_per_cm: Optional[float] = None
    diameter_cm: Optional[float] = None
    size_confidence: Optional[float] = None
    note: Optional[str] = None

class DetectionItem(BaseModel):
    onion_ref: str
    bbox: List[float] # [x_pct, y_pct, width_pct, height_pct]
    classification: str # 'healthy' | 'damaged' | 'rotten' | 'sprouted' | 'discolored'
    confidence: float # 0.0 to 1.0 individual model confidence
    evidence: Optional[str] = None

class InferenceResponse(BaseModel):
    sample_valid: bool
    error_code: Optional[str] = None
    message: Optional[str] = None
    onion_count: int
    acceptable_count: int
    defective_count: int
    defective_percentage: float
    grade: Optional[str] = None # 'A' | 'B' | 'C' | 'REJECT'
    calibration: CalibrationData
    detections: List[DetectionItem]
    timestamp: str

# =========================================================================
# INTEGRATION POINT FOR TEAM'S TRAINED COMPUTER-VISION MODEL:
# =========================================================================
# def load_trained_vision_model():
#     # e.g., model = YOLO("best_onion_weights.pt") or torch.load(...)
#     pass

@app.post("/api/v1/detect-onions", response_model=InferenceResponse)
async def detect_onions(
    file: UploadFile = File(...),
    simulate_non_onion: bool = Form(False),
    has_calibration_marker: bool = Form(False)
):
    """
    Inference endpoint for onion sample images.
    
    When team's model is ready:
    1. Read uploaded image bytes.
    2. Pass to trained model: `results = model(image)`
    3. If no onions detected: return sample_valid=False with INSUFFICIENT_EVIDENCE message.
    4. Otherwise return bounding boxes, classifications, and confidence scores.
    """
    contents = await file.read()
    
    # Task 5 check: Non-onion rejection
    if simulate_non_onion or len(contents) == 0:
        return InferenceResponse(
            sample_valid=False,
            error_code="INSUFFICIENT_EVIDENCE",
            message="No suitable onion sample detected. Please capture a clear sample containing onions.",
            onion_count=0,
            acceptable_count=0,
            defective_count=0,
            defective_percentage=0.0,
            grade=None,
            calibration=CalibrationData(
                marker_detected=False,
                note="Size unavailable — calibration marker not detected."
            ),
            detections=[],
            timestamp=str(time.time())
        )

    # Example contract response adhering to the exact PyaazSure standards engine
    return InferenceResponse(
        sample_valid=True,
        onion_count=8,
        acceptable_count=5,
        defective_count=3,
        defective_percentage=37.5,
        grade="REJECT",
        calibration=CalibrationData(
            marker_detected=has_calibration_marker,
            diameter_cm=5.4 if has_calibration_marker else None,
            size_confidence=0.91 if has_calibration_marker else None,
            note=None if has_calibration_marker else "Size unavailable — calibration marker not detected."
        ),
        detections=[
            DetectionItem(onion_ref="O1", bbox=[18, 16, 20, 22], classification="healthy", confidence=0.96),
            DetectionItem(onion_ref="O2", bbox=[42, 14, 21, 23], classification="healthy", confidence=0.93),
            DetectionItem(onion_ref="O3", bbox=[66, 18, 20, 22], classification="healthy", confidence=0.95),
            DetectionItem(onion_ref="O4", bbox=[14, 44, 22, 24], classification="damaged", confidence=0.78, evidence="Dark damaged patch visible on lower surface."),
            DetectionItem(onion_ref="O5", bbox=[39, 42, 22, 24], classification="healthy", confidence=0.91),
            DetectionItem(onion_ref="O6", bbox=[64, 46, 22, 25], classification="rotten", confidence=0.84, evidence="Visible fungal softening and dark decay around neck."),
            DetectionItem(onion_ref="O7", bbox=[24, 70, 20, 22], classification="sprouted", confidence=0.88, evidence="Visible green shoot emergence at apical bud."),
            DetectionItem(onion_ref="O8", bbox=[52, 70, 21, 23], classification="healthy", confidence=0.89)
        ],
        timestamp=str(time.time())
    )

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "PyaazSure Model Bridge", "version": "2.0.0"}
