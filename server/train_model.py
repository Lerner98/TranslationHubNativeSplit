import cv2
import mediapipe as mp
import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import tensorflow as tf
from tensorflow.keras import layers, models

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Define labels
LABELS = ["I Love You", "Hello", "Thank You", "Yes", "No"]

def collect_data_for_sign(sign: str, num_samples: int = 100):
    """Collect landmark data for a single sign using webcam."""
    cap = cv2.VideoCapture(0)
    print(f"Collecting data for '{sign}'. Press 'q' to stop early.")
    features = []
    count = 0
    
    while count < num_samples:
        ret, frame = cap.read()
        if not ret:
            continue
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = mp_hands.process(frame_rgb)
        
        if results.multi_hand_landmarks:
            landmarks = results.multi_hand_landmarks[0].landmark
            feature = np.array([[lm.x, lm.y, lm.z] for lm in landmarks]).flatten()
            features.append(feature)
            count += 1
            cv2.putText(frame, f"Collecting {sign}: {count}/{num_samples}", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        cv2.imshow("Data Collection", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    return features

def save_data_to_csv(X: np.ndarray, y: np.ndarray, filename: str = "asl_data.csv"):
    """Save features and labels to a CSV file."""
    columns = [f"landmark_{i}_{dim}" for i in range(21) for dim in ["x", "y", "z"]]
    df = pd.DataFrame(X, columns=columns)
    df["label"] = y
    df.to_csv(filename, index=False)
    print(f"Data saved to {filename}")

def create_tensorflow_model(input_shape: tuple, num_classes: int):
    """Create a simple TensorFlow neural network model."""
    model = models.Sequential([
        layers.Input(shape=input_shape),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation="softmax")
    ])
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model

def train_model():
    """Collect data, save to CSV, and train both scikit-learn and TensorFlow models."""
    X, y = [], []
    
    # Collect data for each sign
    for i, sign in enumerate(LABELS):
        print(f"Starting data collection for '{sign}'...")
        features = collect_data_for_sign(sign, num_samples=100)
        X.extend(features)
        y.extend([i] * len(features))
    
    X = np.array(X)
    y = np.array(y)
    
    # Save data to CSV for TensorFlow
    save_data_to_csv(X, y)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train scikit-learn model
    sklearn_model = RandomForestClassifier(n_estimators=100, random_state=42)
    sklearn_model.fit(X_train, y_train)
    sklearn_accuracy = accuracy_score(y_test, sklearn_model.predict(X_test))
    print(f"Scikit-learn model accuracy: {sklearn_accuracy:.2f}")
    
    # Save scikit-learn model
    with open("asl_model.pkl", "wb") as f:
        pickle.dump(sklearn_model, f)
    print("Scikit-learn model saved as 'asl_model.pkl'")
    
    # Train TensorFlow model (placeholder)
    tf_model = create_tensorflow_model(input_shape=(X.shape[1],), num_classes=len(LABELS))
    tf_model.fit(X_train, y_train, epochs=10, batch_size=32, validation_split=0.2, verbose=1)
    tf_loss, tf_accuracy = tf_model.evaluate(X_test, y_test, verbose=0)
    print(f"TensorFlow model accuracy: {tf_accuracy:.2f}")
    
    # Save TensorFlow model
    tf_model.save("asl_model_tf")
    print("TensorFlow model saved as 'asl_model_tf'")

if __name__ == "__main__":
    train_model()