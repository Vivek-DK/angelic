import os
import cv2
import numpy as np
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# =========================================================
# IMPORTANT FACE SHAPE LANDMARKS
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
# BASE DIR
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(

    BASE_DIR,

    "face_landmarker_v2_with_blendshapes.task"
)


# =========================================================
# LOAD LANDMARKER
# =========================================================

print("\nLoading MediaPipe Face Landmarker...")

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

print("MediaPipe Loaded Successfully")


# =========================================================
# NORMALIZATION
# =========================================================

def normalize_landmarks(landmarks):

    try:

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
                "Invalid scale detected"
            )

            return None

        coords = coords / scale

        features = coords.flatten()

        print(
            f"Generated Features: {len(features)}"
        )

        return features.tolist()

    except Exception as e:

        print(
            "Normalization Error:",
            str(e)
        )

        return None


# =========================================================
# LANDMARK EXTRACTION
# =========================================================

def extract_landmarks(image_path):

    try:

        print(
            f"\nReading Image: {image_path}"
        )

        image = cv2.imread(image_path)

        if image is None:

            print(
                "Failed to read image"
            )

            return None

        rgb = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2RGB
        )

        mp_image = mp.Image(

            image_format=
            mp.ImageFormat.SRGB,

            data=rgb
        )

        detection = landmarker.detect(
            mp_image
        )

        if not detection.face_landmarks:

            print(
                "No face detected"
            )

            return None

        print(
            "Face detected successfully"
        )

        landmarks = (
            detection.face_landmarks[0]
        )

        features = normalize_landmarks(
            landmarks
        )

        if features is None:

            print(
                "Feature generation failed"
            )

            return None

        return {
            "features": features
        }

    except Exception as e:

        print(
            "Landmark Extraction Error:",
            str(e)
        )

        return None