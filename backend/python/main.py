from fastapi import FastAPI, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import File
import stone
import os, uuid
import colorsys
import cv2
import numpy as np
import mediapipe as mp
import joblib
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from dotenv import load_dotenv
from chatbot.router import router as chatbot_router
from models.face_utils import extract_face

print("MAIN STARTED")
print("Current Directory:", os.getcwd())

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
     "https://angelic-viv.vercel.app",
     "http://localhost:5173"
    ],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot_router, prefix="/api")
# =========================================================
# FACE SHAPE MODEL LOADING
# =========================================================

# =========================================================
# FACE SHAPE MODEL LOADING
# =========================================================

print("Starting app...")
print("Current directory:", os.getcwd())

face_shape_model_path = "models/face_shape_xgb.pkl"
face_shape_scaler_path = "models/scaler.pkl"
face_shape_pca_path = "models/pca.pkl"

face_shape_labels = [
    "Heart",
    "Oblong",
    "Oval",
    "Round",
    "Square"
]

print("Loading model...")

try:

    face_shape_model = joblib.load(
        face_shape_model_path
    )

    face_shape_scaler = joblib.load(
        face_shape_scaler_path
    )

    face_shape_pca = joblib.load(
        face_shape_pca_path
    )

    print(
        "Face shape model loaded successfully."
    )

except Exception as e:

    print(
        "Error loading face shape model:",
        str(e)
    )

    face_shape_model = None
    face_shape_scaler = None
    face_shape_pca = None


# =========================================================
# IMPORTANT CONTOUR LANDMARKS
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
# MEDIAPIPE INITIALIZATION
# =========================================================

base_options = python.BaseOptions(
    model_asset_path=
    "Face_Shape/face_landmarker_v2_with_blendshapes.task"
)

options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=True,
    num_faces=1,
)

landmarker = (
    vision.FaceLandmarker.create_from_options(
        options
    )
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

    matrix = cv2.getRotationMatrix2D(
        center,
        angle,
        1.0
    )

    aligned = cv2.warpAffine(
        image,
        matrix,
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
        (nose_x - left_x)
        / denominator
    )

    return 0.20 <= ratio <= 0.80


# =========================================================
# GEOMETRIC RATIOS
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

    coords = coords - coords.mean(axis=0)

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
# EXTRACT FEATURES
# =========================================================

def extract_landmarks(image_path: str):

    try:

        image = cv2.imread(image_path)

        if image is None:
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

            print("No face detected.")

            return None

        landmarks = detection.face_landmarks[0]

        if not is_valid_pose(landmarks):

            print("Extreme side pose.")

            return None

        aligned = align_face(
            image,
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

            print("Alignment failed.")

            return None

        aligned_landmarks = (
            aligned_detection.face_landmarks[0]
        )

        features = normalize_landmarks(
            aligned_landmarks
        )

        if features is None:

            return None

        return {
            "features": features
        }

    except Exception as e:

        print(
            "Feature extraction error:",
            str(e)
        )

        return None

def hex_to_skin_tone(hex_color: str) -> str:
    hex_color = hex_color.lstrip("#")
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    r, g, b = [x / 255.0 for x in (r, g, b)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = l * 100  # Lightness in %
    h = h * 360  # Hue in degrees

    if l > 75:
        return "Fair"
    elif 60 < l <= 75:
        return "Light"
    elif 45 < l <= 60:
        return "Medium"
    elif 35 < l <= 45:
        return "Olive"
    elif 25 < l <= 35:
        return "Brown"
    else:
        return "Dark"

def map_tone_label_to_season(tone_label):
    mapping = {
        "BF": {"season": "Spring", "undertone": "Warm"},
        "BC": {"season": "Summer", "undertone": "Cool"},
        "BW": {"season": "Autumn", "undertone": "Warm"},
        "BG": {"season": "Winter", "undertone": "Cool"},
        "BE": {"season": "Autumn", "undertone": "Warm"},
        "BI": {"season": "Spring", "undertone": "Neutral"},
        "BD": {"season": "Winter", "undertone": "Cool"},
        "BH": {"season": "Spring", "undertone": "Deep Warm"},
        "CF": {"season": "Summer", "undertone": "Fair Cool"},
        "CG": {"season": "Winter", "undertone": "Cool Neutral"},
        "BK": {"season": "Autumn", "undertone": "Deep Warm"} ,
    }

    if tone_label not in mapping:
        print(f"Unknown tone_label '{tone_label}' encountered. Defaulting.")
        return {"season": "Unknown", "undertone": "Unknown"}

    return mapping[tone_label]

def map_undertone_season_to_colors(skin_tone_label):
    suitable = get_suitable_colors().get(skin_tone_label)
    avoid = get_avoid_colors().get(skin_tone_label)
    return {"suitable": suitable, "avoid": avoid}
def get_suitable_colors():
    return {
        "Fair": [
            {"hex": "#000080", "name": "Navy Blue"},
            {"hex": "#4169E1", "name": "Royal Blue"},
            {"hex": "#50C878", "name": "Emerald Green"},
            {"hex": "#556B2F", "name": "Olive Green"},
            {"hex": "#E0115F", "name": "Ruby Red"},
            {"hex": "#580F41", "name": "Deep Purple"},
            {"hex": "#FFB6C1", "name": "Soft Pink"},
            {"hex": "#C8A2C8", "name": "Lilac"},
            {"hex": "#89CFF0", "name": "Baby Blue"},
            {"hex": "#8B4513", "name": "Warm Brown"},
            {"hex": "#3C1414", "name": "Chocolate"},
            {"hex": "#36454F", "name": "Charcoal Gray"},
            {"hex": "#D2B48C", "name": "Tan"},
            {"hex": "#C2B280", "name": "Sand"},
        ],
        "Light": [ 
            {"hex": "#50C878", "name": "Emerald Green"},
            {"hex": "#0F52BA", "name": "Sapphire Blue"},
            {"hex": "#000080", "name": "Navy Blue"},
            {"hex": "#E0115F", "name": "Ruby Red"},
            {"hex": "#580F41", "name": "Deep Purple"},
            {"hex": "#C8A2C8", "name": "Lilac"},
            {"hex": "#FFB6C1", "name": "Soft Pink"},
            {"hex": "#89CFF0", "name": "Baby Blue"},
            {"hex": "#FFDAB9", "name": "Pale Peach"},
            {"hex": "#000000", "name": "Black"},
            {"hex": "#FFFFFF", "name": "White"},
            {"hex": "#36454F", "name": "Charcoal"},
            {"hex": "#808080", "name": "Grey"},
            {"hex": "#808000", "name": "Olive"},
            {"hex": "#D2B48C", "name": "Tan"},
        ],

        "Medium": [
            {"hex": "#50C878", "name": "Emerald Green"},
            {"hex": "#0F52BA", "name": "Sapphire Blue"},
            {"hex": "#E0115F", "name": "Ruby Red"},
            {"hex": "#3B2F2F", "name": "Dark Brown"},
            {"hex": "#000000", "name": "Black"},
            {"hex": "#6B8E23", "name": "Olive Green"},
            {"hex": "#E2725B", "name": "Terracotta"},
            {"hex": "#654321", "name": "Rich Brown"},
            {"hex": "#FF7F50", "name": "Coral"},
            {"hex": "#FF8C00", "name": "Warm Orange"},
            {"hex": "#4682B4", "name": "Warm Blue"},
            {"hex": "#D8BFD8", "name": "Muted Lavender"},
            {"hex": "#FADADD", "name": "Soft Pink"},
            {"hex": "#B0E0E6", "name": "Soft Blue"},
            {"hex": "#F4A460", "name": "Sandy Beige"},
            {"hex": "#C3B091", "name": "Warm Taupe"},
        ],

        "Olive": [
            {"hex": "#8B4513", "name": "Warm Brown"},
            {"hex": "#C3B091", "name": "Khaki"},
            {"hex": "#F5F5DC", "name": "Beige"},
            {"hex": "#E2725B", "name": "Terracotta"},
            {"hex": "#50C878", "name": "Emerald"},
            {"hex": "#E0115F", "name": "Ruby"},
            {"hex": "#0F52BA", "name": "Sapphire"},
            {"hex": "#006400", "name": "Deep Green"},
            {"hex": "#FF0000", "name": "True Red"},
            {"hex": "#E35335", "name": "Poppy Red"},
            {"hex": "#FF00FF", "name": "Magenta"},
            {"hex": "#950714", "name": "Cranberry"},
            {"hex": "#FFFDD0", "name": "Cream"},
            {"hex": "#FFFFF0", "name": "Ivory"},
            {"hex": "#FAF9F6", "name": "Soft White"},
            {"hex": "#FF69B4", "name": "Blue-based Pink"},
            {"hex": "#800080", "name": "Purple"},
            {"hex": "#E6E6FA", "name": "Soft Lavender"},
            {"hex": "#808000", "name": "Olive Green"},
            {"hex": "#8A9A5B", "name": "Moss Green"},
        ],

        "Brown": [
            {"hex": "#FF2400", "name": "Fiery Red"},
            {"hex": "#8A0253", "name": "Bold Berry"},
            {"hex": "#FF1493", "name": "Vivid Pink"},
            {"hex": "#808000", "name": "Olive Green"},
            {"hex": "#8A9A5B", "name": "Moss Green"},
            {"hex": "#228B22", "name": "Forest Green"},
            {"hex": "#00008B", "name": "Deep Blue"},
            {"hex": "#4169E1", "name": "Royal Blue"},
            {"hex": "#0047AB", "name": "Cobalt Blue"},
            {"hex": "#580F41", "name": "Deep Plum"},
            {"hex": "#800080", "name": "Rich Purple"},
            {"hex": "#CC5500", "name": "Burnt Orange"},
            {"hex": "#C19A6B", "name": "Camel"},
            {"hex": "#B7410E", "name": "Rust"}, 
            {"hex": "#F5F5DC", "name": "Beige"},
            {"hex": "#000000", "name": "Black"},
            {"hex": "#FFFFFF", "name": "White"},
            {"hex": "#8B4513", "name": "Brown"},
            {"hex": "#C68E17", "name": "Caramel"},
        ],

        "Dark": [
            {"hex": "#FF2400", "name": "Fiery Red"},
            {"hex": "#8A0253", "name": "Bold Berry"},
            {"hex": "#FF1493", "name": "Vivid Pink"},
            {"hex": "#808000", "name": "Olive Green"},
            {"hex": "#8A9A5B", "name": "Moss Green"},
            {"hex": "#228B22", "name": "Forest Green"},
            {"hex": "#00008B", "name": "Deep Blue"},
            {"hex": "#4169E1", "name": "Royal Blue"},
            {"hex": "#0047AB", "name": "Cobalt Blue"},
            {"hex": "#580F41", "name": "Deep Plum"},
            {"hex": "#800080", "name": "Rich Purple"},
            {"hex": "#CC5500", "name": "Burnt Orange"},
            {"hex": "#C19A6B", "name": "Camel"},
            {"hex": "#B7410E", "name": "Rust"},
            {"hex": "#381819", "name": "Espresso"},
            {"hex": "#3C1414", "name": "Rich Chocolate"},
            {"hex": "#F5F5DC", "name": "Beige"},
            {"hex": "#C68E17", "name": "Caramel"},
            {"hex": "#000000", "name": "Black"},
            {"hex": "#FFFFFF", "name": "White"},
            {"hex": "#808080", "name": "Gray"},
        ]

}

def get_avoid_colors():
    return {
        "Fair": [
            {"hex": "#F5F5DC", "name": "Beige"},
            {"hex": "#E6E6FA", "name": "Light Pastels"},
            {"hex": "#FF6347", "name": "Tomato Red"},
            {"hex": "#FFD700", "name": "Strong Yellow"},
            {"hex": "#FF4500", "name": "Bright Orange"},
            {"hex": "#FF00FF", "name": "Fluorescent Pink"},
            {"hex": "#39FF14", "name": "Neon Green"},
            {"hex": "#FFFF33", "name": "Neon Yellow"}
        ],
        "Light": [
            {"hex": "#FF007F", "name": "Bright Fluorescents"},
            {"hex": "#F5F5DC", "name": "Beige"},
            {"hex": "#FFFDD0", "name": "Cream"},
            {"hex": "#FFFF00", "name": "Strong Yellow"},
            {"hex": "#FF4500", "name": "Strong Orange"}
        ],
        "Medium": [
            {"hex": "#39FF14", "name": "Neon Green"},
            {"hex": "#FF073A", "name": "Neon Red"},
            {"hex": "#FFFF33", "name": "Neon Yellow"},
            {"hex": "#E6E6FA", "name": "Pale Lavender"},
            {"hex": "#E0FFFF", "name": "Pale Cyan"},
            {"hex": "#F8F8FF", "name": "Ghost White"},
            {"hex": "#FFDB58", "name": "Mustard Yellow"},
        ],
        "Olive": [
            {"hex": "#F5F5DC", "name": "Beige"},
            {"hex": "#483C32", "name": "Taupe"},
            {"hex": "#DCAE96", "name": "Dusty Rose"},
            {"hex": "#AFEEEE", "name": "Pale Cyan"},
            {"hex": "#E0FFFF", "name": "Icy Blue"},
            {"hex": "#F8F8FF", "name": "Ghost White"},
            {"hex": "#FFD700", "name": "Golden Yellow"},
            {"hex": "#FFDB58", "name": "Mustard"},
            {"hex": "#FF4500", "name": "Rust Orange"},
            {"hex": "#FF8C00", "name": "Bright Orange"},
            {"hex": "#39FF14", "name": "Neon Green"},
            {"hex": "#FFFF00", "name": "Neon Yellow"},
            {"hex": "#8B4513", "name": "Warm Brown"},
            {"hex": "#A0522D", "name": "Sienna"},
        ],
        "Brown": [
            {"hex": "#39FF14", "name": "Neon Green"},
            {"hex": "#FF073A", "name": "Neon Red"},
            {"hex": "#00FFFF", "name": "Electric Cyan"},
            {"hex": "#E6E6FA", "name": "Lavender"},
            {"hex": "#F8F8FF", "name": "Ghost White"},
            {"hex": "#FADADD", "name": "Pale Pink"},
            {"hex": "#3B2F2F", "name": "Muddy Brown"},
            {"hex": "#1C1C1C", "name": "Flat Black"},
            {"hex": "#FFFFE0", "name": "Light Yellow"},
        ],
        "Dark": [
            {"hex": "#FFFFE0", "name": "Pale Yellow"},
            {"hex": "#FFB6C1", "name": "Light Pink"},
            {"hex": "#AFEEEE", "name": "Ice Blue"},
            {"hex": "#E6E6FA", "name": "Pale Lilac"},
            {"hex": "#D2B48C", "name": "Tan"},
            {"hex": "#C3B091", "name": "Brown Beige"},
            {"hex": "#BC8F8F", "name": "Rosy Brown"},
            {"hex": "#3D2B1F", "name": "Dark Coffee Brown"},
            {"hex": "#4B3621", "name": "Chestnut Brown"},
            {"hex": "#39FF14", "name": "Neon Green"},
            {"hex": "#FF073A", "name": "Neon Red"},
            {"hex": "#00FFFF", "name": "Electric Cyan"},
            {"hex": "#C0C0C0", "name": "Silver"},
            {"hex": "#E0FFFF", "name": "Icy Blue"},
            {"hex": "#DCDCDC", "name": "Gainsboro"},
        ]
    }

@app.get("/stone")
async def skintone_info():
    return {"message": "Get skin tone information"}
# =========================================================
# API ENDPOINT
# =========================================================

@app.post("/stone")
async def process_image(
    image_file: UploadFile = File(...)
):

    try:

        contents = await image_file.read()

        if not image_file.filename.lower().endswith(
            (".jpg", ".jpeg", ".png")
        ):

            raise HTTPException(
                status_code=400,
                detail="Only JPG/PNG images are supported."
            )

        temp_path = "temp_image.jpg"

        with open(temp_path, "wb") as f:

            f.write(contents)

            f.flush()

            os.fsync(f.fileno())


        # =====================================================
        # FACE SHAPE PREDICTION
        # =====================================================

        landmark_result = extract_landmarks(
            temp_path
        )

        if (
            face_shape_model is not None
            and face_shape_scaler is not None
            and face_shape_pca is not None
            and landmark_result
        ):

            raw_features = landmark_result[
                "features"
            ]

            features_scaled = (
                face_shape_scaler.transform(
                    [raw_features]
                )
            )

            features_pca = (
                face_shape_pca.transform(
                    features_scaled
                )
            )

            probabilities = (
                face_shape_model.predict_proba(
                    features_pca
                )[0]
            )

            sorted_indices = np.argsort(
                probabilities
            )[::-1]

            top1_idx = sorted_indices[0]
            top2_idx = sorted_indices[1]

            top1_conf = float(
                probabilities[top1_idx]
            )

            top2_conf = float(
                probabilities[top2_idx]
            )

            primary_shape = (
                face_shape_labels[top1_idx]
            )

            secondary_shape = (
                face_shape_labels[top2_idx]
            )

            # Confidence calibration
            if top1_conf < 0.45:

                face_shape = (
                    f"Mixed "
                    f"({primary_shape}/"
                    f"{secondary_shape})"
                )

            else:

                face_shape = primary_shape

            confidence = round(
                top1_conf,
                4
            )

            print(
                f"Primary Shape: "
                f"{primary_shape}"
            )

            print(
                f"Secondary Shape: "
                f"{secondary_shape}"
            )

            print(
                f"Confidence: "
                f"{confidence}"
            )

        else:

            face_shape = "Undetected"

            primary_shape = "Unknown"

            secondary_shape = "Unknown"

            confidence = 0.0

            print(
                "Face shape prediction failed."
            )


        # =====================================================
        # SKIN TONE LOGIC (UNCHANGED)
        # =====================================================

        full_result = stone.process(
            temp_path
        )

        print(full_result)

        faces = full_result.get(
            "faces",
            []
        )

        face = faces[0]

        accuracy = float(
            face.get("accuracy", 0)
        )

        face_id = face.get(
            "face_id",
            0
        )

        if accuracy < 75 and face_id == 1:

            os.remove(temp_path)

            raise HTTPException(
                status_code=400,
                detail=(
                    "Face detected, "
                    "but confidence too low."
                )
            )

        elif face_id != 1 and face_id != 'NA':

            os.remove(temp_path)

            raise HTTPException(
                status_code=400,
                detail=(
                    "Multiple faces detected. "
                    "Please upload an image "
                    "with a single face."
                )
            )

        elif face_id == 'NA':

            os.remove(temp_path)

            raise HTTPException(
                status_code=400,
                detail=(
                    "No valid face detected "
                    "in the image. "
                    "Please upload an image "
                    "with a single and clear face."
                )
            )

        hex_color = face.get(
            "skin_tone",
            "#ffffff"
        )

        tone_label = face.get(
            "tone_label",
            "Unknown"
        )

        face_id = face.get(
            "face_id",
            "Unknown"
        )

        tone_info = map_tone_label_to_season(
            tone_label
        )

        tone_season = tone_info["season"]

        tone_undertone = tone_info["undertone"]

        skin_tone_label = hex_to_skin_tone(
            hex_color
        )

        color_sets = (
            map_undertone_season_to_colors(
                skin_tone_label
            )
        )

        return JSONResponse(
            content={

                "skin_tone": hex_color,

                "tone_label": tone_label,

                "hex": hex_color,

                "tone_info": tone_info,

                "tone_season": tone_season,

                "tone_undertone": tone_undertone,

                "confidence": accuracy,

                "face_id": face_id,

                "skin_tone_label": skin_tone_label,

                "face_shape": face_shape,

                "primary_face_shape":
                    primary_shape,

                "secondary_face_shape":
                    secondary_shape,

                "face_shape_confidence": round(
                    confidence,
                    4
                ),

                "suitable_colors":
                    color_sets["suitable"],

                "avoid_colors":
                    color_sets["avoid"],
            }
        )

    except HTTPException as e:

        raise e

    except Exception as e:

        print(
            "Unexpected error:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Internal server error."
        )

    finally:

        if os.path.exists(temp_path):

            os.remove(temp_path)