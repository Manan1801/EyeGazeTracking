import os
import cv2
import numpy as np
from tensorflow.keras.models import load_model

IMG_SIZE = (64, 64)
MODEL_PATH = 'eye_gaze_model.h5'
TEST_DIR = 'test_cropped_dataset'

# Load model
model = load_model(MODEL_PATH)

# Get label mappings
labels = sorted(os.listdir(TEST_DIR))
label_to_index = {label: i for i, label in enumerate(labels)}
index_to_label = {i: label for label, i in label_to_index.items()}

# Evaluate
correct = 0
total = 0

for label in labels:
    folder = os.path.join(TEST_DIR, label)
    for filename in os.listdir(folder):
        path = os.path.join(folder, filename)
        img = cv2.imread(path)
        if img is None:
            continue
        img_resized = cv2.resize(img, IMG_SIZE)
        img_input = np.expand_dims(img_resized.astype(np.float32) / 255.0, axis=0)
        
        pred = model.predict(img_input)
        pred_idx = np.argmax(pred)
        pred_label = index_to_label[pred_idx]

        print(f"Image: {filename:25s} | True: {label:15s} | Predicted: {pred_label:15s} | Confidence: {pred[0][pred_idx]:.2f}")
        # Check if prediction is correct

        if pred_label == label:
            correct += 1
        total += 1

print(f"\nAccuracy on test images: {correct}/{total} = {correct / total * 100:.2f}%")