from fastapi import FastAPI, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
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
from models.body_generator import generate_body

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot_router, prefix="/api")

model_path = "Trained_models/face_shape_rf_model.pkl"
scaler_path = "Trained_models/face_shape_scaler.pkl"

face_shape_labels = ['heart', 'oval', 'round', 'square', 'diamond']

try:
    face_shape_model = joblib.load(model_path)
    face_shape_scaler = joblib.load(scaler_path)
    print("Face shape model and scaler loaded.")
except Exception as e:
    print("Error loading model or scaler:", str(e))
    face_shape_model = None
    face_shape_scaler = None

def extract_landmarks(image_path: str) -> list:
    try:
        base_options = python.BaseOptions(model_asset_path="face_landmarker_v2_with_blendshapes.task")
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
        )
        landmarker = vision.FaceLandmarker.create_from_options(options)

        mp_image = mp.Image.create_from_file(image_path)
        result = landmarker.detect(mp_image)

        if not result.face_landmarks:
            print("No face landmarks detected.")
            return None

        coords = result.face_landmarks[0]
        if len(coords) < 468:
            print("Incomplete landmark data.")
            return None

        idx = {
            'chin': 152,
            'forehead': 10,
            'left_cheek': 234,
            'right_cheek': 454,
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
            'temple_right': 356,
        }

        def dist(a, b):
            return np.linalg.norm(np.array([a.x, a.y, a.z]) - np.array([b.x, b.y, b.z]))

        p = {name: coords[i] for name, i in idx.items()}
        face_height = dist(p['forehead'], p['chin'])
        norm = lambda d: d / face_height if face_height > 0 else 0

        features = [
            norm(dist(p['left_cheek'], p['right_cheek'])),
            norm(dist(p['left_eye_inner'], p['right_eye_inner'])),
            norm(dist(p['mouth_left'], p['mouth_right'])),
            norm(dist(p['mouth_top'], p['mouth_bottom'])),
            norm(dist(p['nose_tip'], p['nose_bottom'])),
            norm(dist(p['nose_tip'], p['left_eye_inner'])),
            norm(dist(p['nose_tip'], p['right_eye_inner'])),
            norm(dist(p['temple_left'], p['temple_right'])),
            norm(dist(p['chin'], p['left_cheek'])),
            norm(dist(p['chin'], p['right_cheek'])),
            norm(dist(p['forehead'], p['left_eye_outer'])),
            norm(dist(p['forehead'], p['right_eye_outer'])),
        ]

        features += [
            features[0],                        # face width
            features[1] / features[0],          # eye spacing / face width
            features[2] / features[0],          # mouth width / face width
            features[3] / features[2],          # mouth height / mouth width
            features[4] / features[0],          # nose length / face width
            features[4] / features[1],          # nose length / eye distance
        ]

        features_np = np.array(features).reshape(1, -1)
        features_scaled = face_shape_scaler.transform(features_np)

        prediction = face_shape_model.predict(features_scaled)[0]
        confidence = face_shape_model.predict_proba(features_scaled).max()

        result_label = face_shape_labels[prediction]
        print(f"Prediction: {result_label}, Confidence: {confidence:.2f}")

        return {
            "face_shape": result_label,
            "confidence": float(round(confidence, 4)),
            "features": features  
        }

    except Exception as e:
        print("Error in extract_landmarks():", str(e))
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

@app.post("/stone")
async def process_image(image_file: UploadFile):
    try:
        contents = await image_file.read()
        if not image_file.filename.lower().endswith((".jpg", ".jpeg", ".png")):
            raise HTTPException(status_code=400, detail="Only JPG/PNG images are supported.")

        temp_path = "temp_image.jpg"
        with open(temp_path, "wb") as f:
            f.write(contents)
            f.flush()
            os.fsync(f.fileno())

        landmark_result = extract_landmarks(temp_path)

        if face_shape_model is not None and face_shape_scaler is not None and landmark_result:
            print("Input features:", landmark_result["features"])
            
            features_scaled = face_shape_scaler.transform([landmark_result["features"]])
            predicted_index = face_shape_model.predict(features_scaled)[0]
            confidence = face_shape_model.predict_proba(features_scaled).max()
            
            face_shape = face_shape_labels[predicted_index]
            
            print(f"Predicted Face Shape: {face_shape} (Confidence: {confidence:.2f})")
        else:
            face_shape = "Undetected"
            print("Face shape could not be determined.")

        full_result = stone.process(temp_path)
        print(full_result)
        faces = full_result.get("faces", [])
        face = faces[0]
        accuracy = float(face.get("accuracy", 0))
        face_id = face.get("face_id", 0)
        if accuracy < 75 and face_id == 1:
            os.remove(temp_path)
            raise HTTPException(status_code=400, detail="Face detected, but confidence too low.")
        elif face_id != 1 and face_id != 'NA':
            os.remove(temp_path)
            raise HTTPException(status_code=400, detail="Multiple faces detected. Please upload an image with a single face.")
        elif face_id == 'NA':
            os.remove(temp_path)
            raise HTTPException(status_code=400, detail="No valid face detected in the image. Please upload an image with a single and a clear face.")

        hex_color = face.get("skin_tone", "#ffffff")
        tone_label = face.get("tone_label", "Unknown")
        face_id = face.get("face_id", "Unknown")
        tone_info = map_tone_label_to_season(tone_label)
        tone_season = tone_info["season"]
        tone_undertone = tone_info["undertone"]
        skin_tone_label = hex_to_skin_tone(hex_color)
        color_sets = map_undertone_season_to_colors(skin_tone_label)

        return JSONResponse(content={
            "skin_tone": hex_color,
            "tone_label": tone_label,
            "hex": hex_color,
            "tone_info": tone_info,
            "tone_season": tone_season,
            "tone_undertone": tone_undertone,
            "confidence": accuracy,
            "face_id": face_id,
            "skin_tone_label": skin_tone_label,
            "face_shape":face_shape,
            "suitable_colors": color_sets["suitable"],
            "avoid_colors": color_sets["avoid"],
        })

    except HTTPException as e:
        raise e
    except Exception as e:
        print("Unexpected error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

