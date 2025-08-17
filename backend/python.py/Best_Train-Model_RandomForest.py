import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.framework.formats import landmark_pb2
import cv2
import numpy as np
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle
import traceback

try:
    base_options = python.BaseOptions(model_asset_path='face_landmarker_v2_with_blendshapes.task')
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        output_face_blendshapes=True,
        output_facial_transformation_matrixes=True,
        num_faces=1
    )
    detector = vision.FaceLandmarker.create_from_options(options)
except Exception as e:
    print("Failed to load MediaPipe model:", e)
    raise

def distance_3d(p1, p2):
    return np.linalg.norm(np.array(p1) - np.array(p2))

def extract_features(coords):
    try:
        indices = {
            'chin': 152,
            'forehead': 10,
            'left_cheek': 234,
            'right_cheek': 454,
            'left_jaw': 234,
            'right_jaw': 454,
            'left_eye_inner': 133,
            'right_eye_inner': 362,
            'left_eye_outer': 33,
            'right_eye_outer': 263,
            'nose_tip': 1,
            'nose_bottom': 2,
            'mouth_top': 13,
            'mouth_bottom': 14,
            'mouth_left': 78,
            'mouth_right': 308,
            'temple_left': 127,
            'temple_right': 356
        }

        pts = {name: coords[i] for name, i in indices.items()}

        face_height = distance_3d(pts['forehead'], pts['chin'])
        norm = lambda d: d / face_height if face_height > 0 else 0

        features = [
            norm(distance_3d(pts['left_cheek'], pts['right_cheek'])),
            norm(distance_3d(pts['left_eye_inner'], pts['right_eye_inner'])),
            norm(distance_3d(pts['mouth_left'], pts['mouth_right'])),
            norm(distance_3d(pts['mouth_top'], pts['mouth_bottom'])),
            norm(distance_3d(pts['nose_tip'], pts['nose_bottom'])),
            norm(distance_3d(pts['nose_tip'], pts['left_eye_inner'])),
            norm(distance_3d(pts['nose_tip'], pts['right_eye_inner'])),
            norm(distance_3d(pts['temple_left'], pts['temple_right'])),
            norm(distance_3d(pts['chin'], pts['left_jaw'])),
            norm(distance_3d(pts['chin'], pts['right_jaw'])),
            norm(distance_3d(pts['forehead'], pts['left_eye_outer'])),
            norm(distance_3d(pts['forehead'], pts['right_eye_outer']))
        ]

        features.append(features[0] / 1.0)
        features.append(features[1] / features[0] if features[0] != 0 else 0)
        features.append(features[2] / features[0] if features[0] != 0 else 0)
        features.append(features[3] / features[2] if features[2] != 0 else 0)
        features.append(features[4] / features[0] if features[0] != 0 else 0)
        features.append(features[4] / features[1] if features[1] != 0 else 0)

        return np.array(features)

    except Exception as e:
        print("Error extracting features:", e)
        traceback.print_exc()
        return None

def process_data(folder_path):
    faces, labels = [], []
    try:
        for shape in os.listdir(folder_path):
            shape_pth = os.path.join(folder_path, shape)
            if not os.path.isdir(shape_pth):
                continue

            for img_file in os.listdir(shape_pth):
                try:
                    img_path = os.path.join(shape_pth, img_file)
                    img = cv2.imread(img_path)
                    if img is None:
                        print(f"Could not read image: {img_path}")
                        continue

                    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

                    result = detector.detect(mp_img)
                    if not result.face_landmarks:
                        print(f"No face detected in {img_path}")
                        continue

                    coords = np.array([[lmk.x, lmk.y, lmk.z] for lmk in result.face_landmarks[0]])
                    feature = extract_features(coords)
                    if feature is None:
                        continue

                    faces.append(feature)
                    if shape.lower() == 'heart': labels.append(0)
                    elif shape.lower() == 'oval': labels.append(1)
                    elif shape.lower() == 'round': labels.append(2)
                    elif shape.lower() == 'square': labels.append(3)
                    elif shape.lower() == 'diamond': labels.append(4)
                    else:
                        print(f"Unknown shape {shape}, skipping...")

                except Exception as e:
                    print(f"Error processing {img_file} in {shape}: {e}")
                    traceback.print_exc()

    except FileNotFoundError:
        print(f"Folder not found: {folder_path}")
    except Exception as e:
        print(f"Error reading folder {folder_path}: {e}")
        traceback.print_exc()

    return np.array(faces), np.array(labels)

train_path = 'Face_Shape/training'
test_path = 'Face_Shape/testing'

X_train, y_train = process_data(train_path)
X_test, y_test = process_data(test_path)

try:
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=2000,
        max_depth=25,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)

    print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(classification_report(y_test, y_pred, target_names=["Heart", "Oval", "Round", "Square", "Diamond"]))

except Exception as e:
    print("Error during training or evaluation:", e)
    traceback.print_exc()

try:
    with open('face_shape_rf_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    with open('face_shape_scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    print("Model and scaler saved successfully.")
except Exception as e:
    print("Error saving model files:", e)
    traceback.print_exc()
