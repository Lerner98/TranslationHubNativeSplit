# main.py
# Backend WebSocket server for the TranslationHub app's ASL translation.
# It uses FastAPI to handle WebSocket connections at the "/ws" endpoint.
# The server processes video frames, decoding base64 images sent from the client.
# MediaPipe extracts hand landmarks, which are used for ASL gesture recognition.
# Gestures are classified using a TensorFlow model or a rule-based fallback.
# Supported gestures include "I Love You," "Hello," "Thank You," "Yes," and "No."
# The server sends back the recognized gesture and confidence to the client.
# A health check endpoint ("/health") confirms the server’s status.

import base64
import cv2
import numpy as np
from fastapi import FastAPI, WebSocket
from mediapipe import solutions
import asyncio
import json
from typing import List, Dict
import pickle
import tensorflow as tf
from sklearn.ensemble import RandomForestClassifier
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Initialize MediaPipe Hands
mp_hands = solutions.hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Define labels
LABELS = ["I Love You", "Hello", "Thank You", "Yes", "No"]

# Load machine learning model (scikit-learn or TensorFlow)
class ModelWrapper:
    def __init__(self, model_type: str, model_path: str):
        self.model_type = model_type
        if model_type == "sklearn":
            with open(model_path, "rb") as f:
                self.model = pickle.load(f)
        elif model_type == "tensorflow":
            self.model = tf.keras.models.load_model(model_path)
        else:
            raise ValueError("Unsupported model type")

    def predict(self, features: np.ndarray) -> tuple[int, float]:
        if self.model_type == "sklearn":
            pred = self.model.predict(features)[0]
            prob = self.model.predict_proba(features)[0].max()
            return pred, prob
        elif self.model_type == "tensorflow":
            features = features.reshape(1, -1)
            prob = self.model.predict(features, verbose=0)[0]
            pred = np.argmax(prob)
            return prob[pred], pred

# Construct the path to the model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'asl_model_tf')  # Adjust if the model is an HDF5 file (e.g., 'asl_model_tf.h5')

# Load model (default to TensorFlow, fallback to rule-based if model not found)
try:
    model = ModelWrapper(model_type="tensorflow", model_path=MODEL_PATH)
    logger.info(f"Loaded TensorFlow model from {MODEL_PATH}")
except FileNotFoundError:
    model = None
    logger.warning("No ML model found at models/asl_model_tf. Using rule-based classification.")
except Exception as e:
    model = None
    logger.error(f"Failed to load model: {str(e)}. Using rule-based classification.")

def is_finger_extended(tip: Dict, base: Dict, threshold: float = 0.1) -> bool:
    """Check if a finger is extended by comparing tip and base y-coordinates."""
    return tip["y"] < base["y"] - threshold

def get_rule_based_gesture(landmarks: List[Dict]) -> str:
    """Classify ASL gesture based on hand landmarks (rule-based)."""
    if not landmarks:
        return "None"
    
    wrist = landmarks[0]
    thumb_tip = landmarks[4]
    index_tip = landmarks[8]
    middle_tip = landmarks[12]
    ring_tip = landmarks[16]
    pinky_tip = landmarks[20]
    index_base = landmarks[5]
    middle_base = landmarks[9]
    ring_base = landmarks[13]
    pinky_base = landmarks[17]

    index_extended = is_finger_extended(index_tip, index_base)
    middle_extended = is_finger_extended(middle_tip, middle_base)
    ring_extended = is_finger_extended(ring_tip, ring_base)
    pinky_extended = is_finger_extended(pinky_tip, pinky_base)
    thumb_near_middle = abs(thumb_tip["x"] - middle_base["x"]) < 0.1 and abs(thumb_tip["y"] - middle_base["y"]) < 0.1
    palm_outward = wrist["x"] > index_base["x"]
    palm_down = wrist["y"] < index_base["y"]

    fingers_close = (abs(index_tip["x"] - middle_tip["x"]) < 0.05 and
                    abs(middle_tip["x"] - ring_tip["x"]) < 0.05 and
                    abs(ring_tip["x"] - pinky_tip["x"]) < 0.05)
    
    if index_extended and pinky_extended and not middle_extended and not ring_extended and thumb_near_middle:
        return "I Love You"
    if index_extended and middle_extended and ring_extended and pinky_extended and fingers_close and palm_outward:
        return "Hello"
    if index_extended and middle_extended and ring_extended and pinky_extended and fingers_close and not palm_outward:
        return "Thank You"
    if not index_extended and not middle_extended and not ring_extended and not pinky_extended and thumb_tip["y"] < wrist["y"]:
        return "Yes"
    if index_extended and middle_extended and not ring_extended and not pinky_extended and palm_down:
        return "No"
    
    return "None"

def process_frame(img: np.ndarray) -> tuple[np.ndarray, List[Dict]]:
    """Extract hand landmarks from an image using MediaPipe."""
    logger.debug("Processing frame")
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = mp_hands.process(img_rgb)
    landmarks = []
    features = None
    
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            landmarks = [
                {"x": lm.x, "y": lm.y, "z": lm.z}
                for lm in hand_landmarks.landmark
            ]
            features = np.array([[lm["x"], lm["y"], lm["z"]] for lm in landmarks]).flatten()
    
    logger.debug(f"Extracted {len(landmarks)} landmarks")
    return features, landmarks

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("WebSocket client connected")
    await websocket.accept()
    try:
        while True:
            # Receive base64-encoded frame
            data = await websocket.receive_text()
            logger.debug(f"Received message: {data}")
            frame_data = json.loads(data)
            img_str = frame_data["frame"]
            
            # Decode base64 to image
            logger.debug("Decoding base64 image")
            img_bytes = base64.b64decode(img_str.split(",")[1])
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            # Process frame
            features, landmarks = process_frame(img)
            
            # Prepare response
            response = {"landmarks": landmarks, "gesture": "None", "confidence": 0.0}
            if landmarks:
                if model:
                    # Use machine learning model if available
                    logger.debug("Using ML model for prediction")
                    confidence, prediction = model.predict([features])
                    response["gesture"] = LABELS[prediction]
                    response["confidence"] = float(confidence)
                    logger.info(f"Predicted gesture: {response['gesture']} with confidence: {response['confidence']}")
                else:
                    # Fallback to rule-based classification
                    logger.debug("Using rule-based classification")
                    response["gesture"] = get_rule_based_gesture(landmarks)
                    response["confidence"] = 1.0  # Rule-based has no probabilistic confidence
                    logger.info(f"Rule-based gesture: {response['gesture']}")
            
            # Send response
            logger.debug(f"Sending response: {response}")
            await websocket.send_json(response)
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        logger.info("WebSocket client disconnected")
        await websocket.close()

@app.get("/health")
async def health_check():
    logger.info("Health check requested")
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)