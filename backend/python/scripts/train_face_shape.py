import os
import cv2
import joblib
import mediapipe as mp
import numpy as np

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.metrics import classification_report

from xgboost import XGBClassifier


# =========================================================
# CONFIG
# =========================================================

DATASET_PATH = "Face_Shape/dataset"

MODEL_SAVE_PATH = "models"

LANDMARK_MODEL_PATH = (
    "Face_Shape/face_landmarker_v2_with_blendshapes.task"
)

IMAGE_EXTENSIONS = (
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
)


# =========================================================
# LABEL MAP
# =========================================================

LABEL_MAP = {
    "Heart": 0,
    "Oblong": 1,
    "Oval": 2,
    "Round": 3,
    "Square": 4
}

REVERSE_LABEL_MAP = {
    v: k for k, v in LABEL_MAP.items()
}


# =========================================================
# IMPORTANT LANDMARKS ONLY
# =========================================================

FACE_SHAPE_LANDMARKS = [

    # forehead
    10, 338, 297, 332, 284,

    # right face
    251, 389, 356, 454, 323,
    361, 288, 397, 365, 379,

    # chin
    378, 400, 377, 152,

    # left face
    148, 176, 149, 150, 136,
    172, 58, 132, 93, 234,
    127, 162, 21, 54, 103,
    67, 109
]


# =========================================================
# MEDIAPIPE
# =========================================================

base_options = python.BaseOptions(
    model_asset_path=LANDMARK_MODEL_PATH
)

options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=True,
    num_faces=1
)

landmarker = vision.FaceLandmarker.create_from_options(
    options
)


# =========================================================
# FACE ALIGNMENT
# =========================================================

def align_face(image, landmarks):

    left_eye = landmarks[33]
    right_eye = landmarks[263]

    left = np.array([
        left_eye.x,
        left_eye.y
    ])

    right = np.array([
        right_eye.x,
        right_eye.y
    ])

    h, w = image.shape[:2]

    left *= np.array([w, h])
    right *= np.array([w, h])

    dx = right[0] - left[0]
    dy = right[1] - left[1]

    angle = np.degrees(
        np.arctan2(dy, dx)
    )

    center = (
        float((left[0] + right[0]) / 2),
        float((left[1] + right[1]) / 2)
    )

    rotation_matrix = cv2.getRotationMatrix2D(
        center,
        angle,
        1.0
    )

    aligned = cv2.warpAffine(
        image,
        rotation_matrix,
        (w, h),
        flags=cv2.INTER_CUBIC
    )

    return aligned


# =========================================================
# RELAXED POSE CHECK
# =========================================================

def is_valid_pose(landmarks):

    nose_x = landmarks[1].x

    left_x = landmarks[234].x
    right_x = landmarks[454].x

    denominator = right_x - left_x

    if denominator == 0:
        return False

    ratio = (
        (nose_x - left_x) / denominator
    )

    return 0.20 <= ratio <= 0.80


# =========================================================
# GEOMETRIC FEATURES
# =========================================================

def extract_geometric_ratios(coords):

    forehead_width = np.linalg.norm(
        coords[0] - coords[4]
    )

    cheekbone_width = np.linalg.norm(
        coords[7] - coords[27]
    )

    jaw_width = np.linalg.norm(
        coords[14] - coords[20]
    )

    face_height = np.linalg.norm(
        coords[0] - coords[18]
    )

    chin_width = np.linalg.norm(
        coords[16] - coords[20]
    )

    ratios = [

        forehead_width / face_height,

        cheekbone_width / face_height,

        jaw_width / face_height,

        chin_width / face_height,

        forehead_width / jaw_width,

        cheekbone_width / jaw_width,

        face_height / cheekbone_width,
    ]

    return ratios


# =========================================================
# NORMALIZATION
# =========================================================

def normalize_landmarks(landmarks):

    coords = []

    for idx in FACE_SHAPE_LANDMARKS:

        lm = landmarks[idx]

        coords.append([
            lm.x,
            lm.y,
            lm.z
        ])

    coords = np.array(coords)

    # Center
    coords = coords - coords.mean(axis=0)

    # Scale normalize
    scale = np.max(
        np.linalg.norm(coords, axis=1)
    )

    if scale == 0:
        return None

    coords = coords / scale

    geometric_features = (
        extract_geometric_ratios(coords)
    )

    flattened = coords.flatten()

    final_features = np.concatenate([
        flattened,
        geometric_features
    ])

    return final_features


# =========================================================
# AUGMENTATION
# =========================================================

def augment_image(image):

    augmented = []

    augmented.append(image)

    augmented.append(
        cv2.flip(image, 1)
    )

    # brightness
    augmented.append(
        cv2.convertScaleAbs(
            image,
            alpha=1.1,
            beta=15
        )
    )

    # darker
    augmented.append(
        cv2.convertScaleAbs(
            image,
            alpha=0.9,
            beta=-15
        )
    )

    # slight blur
    augmented.append(
        cv2.GaussianBlur(
            image,
            (3, 3),
            0
        )
    )

    return augmented


# =========================================================
# FEATURE EXTRACTION
# =========================================================

def extract_features(image_path):

    image = cv2.imread(image_path)

    if image is None:
        return []

    all_features = []

    augmented_images = augment_image(image)

    for aug_image in augmented_images:

        try:

            rgb = cv2.cvtColor(
                aug_image,
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
                continue

            landmarks = detection.face_landmarks[0]

            if not is_valid_pose(landmarks):
                continue

            aligned = align_face(
                aug_image,
                landmarks
            )

            rgb_aligned = cv2.cvtColor(
                aligned,
                cv2.COLOR_BGR2RGB
            )

            mp_aligned = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb_aligned
            )

            aligned_detection = landmarker.detect(
                mp_aligned
            )

            if not aligned_detection.face_landmarks:
                continue

            aligned_landmarks = (
                aligned_detection.face_landmarks[0]
            )

            features = normalize_landmarks(
                aligned_landmarks
            )

            if features is not None:
                all_features.append(features)

        except Exception as e:

            print(
                f"Feature extraction error: {e}"
            )

    return all_features


# =========================================================
# LOAD DATASET
# =========================================================

def load_dataset(folder_path):

    X = []
    y = []

    for label_name in os.listdir(folder_path):

        label_path = os.path.join(
            folder_path,
            label_name
        )

        if not os.path.isdir(label_path):
            continue

        if label_name not in LABEL_MAP:
            continue

        label = LABEL_MAP[label_name]

        print(f"\nProcessing {label_name}")

        for file_name in os.listdir(label_path):

            if not file_name.lower().endswith(
                IMAGE_EXTENSIONS
            ):
                continue

            image_path = os.path.join(
                label_path,
                file_name
            )

            features_list = extract_features(
                image_path
            )

            for features in features_list:

                X.append(features)
                y.append(label)

    return np.array(X), np.array(y)


# =========================================================
# LOAD DATA
# =========================================================

train_folder = os.path.join(
    DATASET_PATH,
    "train"
)

test_folder = os.path.join(
    DATASET_PATH,
    "test"
)

X_train_full, y_train_full = load_dataset(
    train_folder
)

X_test, y_test = load_dataset(
    test_folder
)


# =========================================================
# VALIDATION SPLIT
# =========================================================

X_train, X_val, y_train, y_val = train_test_split(
    X_train_full,
    y_train_full,
    test_size=0.15,
    random_state=42,
    stratify=y_train_full
)


# =========================================================
# STANDARDIZE
# =========================================================

scaler = StandardScaler()

X_train = scaler.fit_transform(X_train)

X_val = scaler.transform(X_val)

X_test = scaler.transform(X_test)


# =========================================================
# PCA
# =========================================================

pca = PCA(
    n_components=0.97,
    random_state=42
)

X_train = pca.fit_transform(X_train)

X_val = pca.transform(X_val)

X_test = pca.transform(X_test)

print("\nReduced Features:", X_train.shape[1])


# =========================================================
# MODEL
# =========================================================

model = XGBClassifier(

    n_estimators=2500,

    max_depth=10,

    learning_rate=0.015,

    subsample=0.85,

    colsample_bytree=0.85,

    min_child_weight=2,

    gamma=0.1,

    objective="multi:softprob",

    num_class=5,

    eval_metric="mlogloss",

    random_state=42,

    tree_method="hist",

    n_jobs=-1
)


# =========================================================
# TRAIN
# =========================================================

print("\nTraining Started...\n")

model.fit(

    X_train,

    y_train,

    eval_set=[
        (X_train, y_train),
        (X_val, y_val)
    ],

    verbose=True
)


# =========================================================
# EVALUATION
# =========================================================

print("\nEvaluating...\n")

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print(f"\nAccuracy: {accuracy:.4f}")

print(
    classification_report(
        y_test,
        predictions,
        target_names=[
            "Heart",
            "Oblong",
            "Oval",
            "Round",
            "Square"
        ]
    )
)


# =========================================================
# SAVE
# =========================================================

os.makedirs(
    MODEL_SAVE_PATH,
    exist_ok=True
)

joblib.dump(
    model,
    os.path.join(
        MODEL_SAVE_PATH,
        "face_shape_xgb.pkl"
    )
)

joblib.dump(
    scaler,
    os.path.join(
        MODEL_SAVE_PATH,
        "scaler.pkl"
    )
)

joblib.dump(
    pca,
    os.path.join(
        MODEL_SAVE_PATH,
        "pca.pkl"
    )
)

print("\nModel Saved Successfully")