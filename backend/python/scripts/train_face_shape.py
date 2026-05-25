import os
import cv2
import joblib
import traceback
import numpy as np
import mediapipe as mp

from sklearn.model_selection import (
    train_test_split
)

from sklearn.preprocessing import (
    StandardScaler,
    LabelEncoder
)

from sklearn.decomposition import PCA

from sklearn.ensemble import (
    RandomForestClassifier
)

from sklearn.metrics import (
    classification_report,
    accuracy_score
)

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

print("\nTRAINING SCRIPT STARTED\n")

# =========================================================
# BASE DIR
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

# =========================================================
# DATASET PATH
# =========================================================

DATASET_PATH = os.path.join(

    BASE_DIR,

    "Face_Shape",

    "dataset",

    "train"
)

print("Dataset Path:")
print(DATASET_PATH)

print(
    "\nDataset Exists:",
    os.path.exists(DATASET_PATH)
)

# =========================================================
# MEDIAPIPE MODEL
# =========================================================

MODEL_PATH = os.path.join(

    BASE_DIR,

    "Face_Shape",

    "face_landmarker_v2_with_blendshapes.task"
)

print("\nLoading MediaPipe Model...")

base_options = python.BaseOptions(
    model_asset_path=MODEL_PATH
)

options = vision.FaceLandmarkerOptions(

    base_options=base_options,

    output_face_blendshapes=False,

    output_facial_transformation_matrixes=True,

    num_faces=1
)

landmarker = (
    vision.FaceLandmarker
    .create_from_options(options)
)

print("MediaPipe Loaded Successfully.\n")

# =========================================================
# IMPORTANT FACE LANDMARKS
# =========================================================

FACE_SHAPE_LANDMARKS = [

    10, 338, 297, 332, 284,
    251, 389, 356, 454, 323,
    361, 288, 397, 365, 379,
    378, 400, 377, 152,
    148, 176, 149, 150, 136,
    172, 58, 132, 93, 234,
    127, 162, 21, 54, 103,
    67, 109
]

# =========================================================
# FEATURE EXTRACTION
# =========================================================

def extract_landmarks(image_path):

    try:

        image = cv2.imread(image_path)

        if image is None:

            print(
                f"Failed to read image: {image_path}"
            )

            return None

        rgb = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2RGB
        )

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb
        )

        detection = landmarker.detect(
            mp_image
        )

        if not detection.face_landmarks:

            print(
                f"No face detected: {image_path}"
            )

            return None

        landmarks = (
            detection.face_landmarks[0]
        )

        selected_points = []

        for idx in FACE_SHAPE_LANDMARKS:

            lm = landmarks[idx]

            selected_points.append([

                lm.x,
                lm.y,
                lm.z
            ])

        coords = np.array(
            selected_points
        )

        center = np.mean(
            coords,
            axis=0
        )

        coords = coords - center

        scale = np.linalg.norm(
            coords[18] - coords[0]
        )

        if scale == 0:

            print(
                f"Invalid scale: {image_path}"
            )

            return None

        coords = coords / scale

        return coords.flatten()

    except Exception as e:

        print(
            f"\nFeature Extraction Error: {image_path}"
        )

        print(str(e))

        traceback.print_exc()

        return None

# =========================================================
# LOAD DATASET
# =========================================================

X = []
y = []

processed = 0
skipped = 0

classes = os.listdir(DATASET_PATH)

print("\nClasses Found:")
print(classes)

for class_name in classes:

    class_path = os.path.join(
        DATASET_PATH,
        class_name
    )

    if not os.path.isdir(class_path):
        continue

    print(f"\nProcessing Class: {class_name}")

    for img_name in os.listdir(class_path):

        img_path = os.path.join(
            class_path,
            img_name
        )

        print(f"Image: {img_name}")

        result = extract_landmarks(
            img_path
        )

        if result is None:

            skipped += 1

            print(
                f"Skipped Count: {skipped}"
            )

            continue

        X.append(result)

        y.append(class_name)

        processed += 1

        print(
            f"Processed Count: {processed}"
        )

# =========================================================
# DATA CHECK
# =========================================================

if len(X) == 0:

    raise Exception(
        "\nNo training samples extracted."
    )

X = np.array(X)
y = np.array(y)

print("\nTotal Samples:", len(X))

print(
    "Feature Size:",
    X.shape[1]
)

# =========================================================
# LABEL ENCODER
# =========================================================

label_encoder = LabelEncoder()

y_encoded = (
    label_encoder.fit_transform(y)
)

# =========================================================
# TRAIN TEST SPLIT
# =========================================================

X_train, X_test, y_train, y_test = (

    train_test_split(

        X,

        y_encoded,

        test_size=0.2,

        random_state=42,

        stratify=y_encoded
    )
)

# =========================================================
# SCALER
# =========================================================

scaler = StandardScaler()

X_train_scaled = (
    scaler.fit_transform(X_train)
)

X_test_scaled = (
    scaler.transform(X_test)
)

# =========================================================
# PCA
# =========================================================

pca = PCA(
    n_components=0.97
)

X_train_pca = (
    pca.fit_transform(
        X_train_scaled
    )
)

X_test_pca = (
    pca.transform(
        X_test_scaled
    )
)

print(
    "\nReduced Features:",
    X_train_pca.shape[1]
)

# =========================================================
# RANDOM FOREST
# =========================================================

print("\nTraining Model...\n")

model = RandomForestClassifier(

    n_estimators=150,

    max_depth=20,

    random_state=42,

    class_weight="balanced"
)

model.fit(
    X_train_pca,
    y_train
)

print("Training Completed.\n")

# =========================================================
# EVALUATION
# =========================================================

y_pred = model.predict(
    X_test_pca
)

accuracy = accuracy_score(
    y_test,
    y_pred
)

print(
    f"\nAccuracy: {accuracy * 100:.2f}%"
)

print("\nClassification Report:\n")

print(

    classification_report(

        y_test,

        y_pred,

        target_names=
        label_encoder.classes_
    )
)

# =========================================================
# SAVE MODELS
# =========================================================

MODELS_DIR = os.path.join(
    BASE_DIR,
    "Face_Shape",
    "models"
)

os.makedirs(
    MODELS_DIR,
    exist_ok=True
)

joblib.dump(

    model,

    os.path.join(
        MODELS_DIR,
        "face_shape_model.pkl"
    )
)

joblib.dump(

    scaler,

    os.path.join(
        MODELS_DIR,
        "scaler.pkl"
    )
)

joblib.dump(

    pca,

    os.path.join(
        MODELS_DIR,
        "pca.pkl"
    )
)

joblib.dump(

    label_encoder,

    os.path.join(
        MODELS_DIR,
        "label_encoder.pkl"
    )
)

print("\nModels Saved Successfully.")