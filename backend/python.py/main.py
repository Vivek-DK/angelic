from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import stone
import os
import colorsys
import cv2
import numpy as np
import mediapipe as mp
import joblib
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from dotenv import load_dotenv
from chatbot.router import router as chatbot_router

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

def map_undertone_season_to_colors(tone_undertone, skin_tone_label):
    suitable = get_suitable_colors().get(skin_tone_label, {}).get(tone_undertone, [])
    avoid = get_avoid_colors().get(skin_tone_label, {}).get(tone_undertone, [])
    return {"suitable": suitable, "avoid": avoid}
def get_suitable_colors():
    return {
    "Fair": {
        "Fair Cool": [
            {"hex": "#FFEBE5", "name": "Porcelain"},
            {"hex": "#FFE5D4", "name": "Ivory"},
            {"hex": "#FFEADB", "name": "Alabaster"},
            {"hex": "#FFF0E0", "name": "Light Peach"},
            {"hex": "#FFF5E8", "name": "Cream"},
            {"hex": "#FBE8E4", "name": "Soft Blush"},
            {"hex": "#FAE1DC", "name": "Petal Pink"},
            {"hex": "#F8E8E0", "name": "Powder Peach"},
            {"hex": "#FDF0EB", "name": "Pearl White"},
            {"hex": "#FFF7F2", "name": "Soft Ivory"},
            {"hex": "#FDE9E1", "name": "Rose Beige"},
            {"hex": "#FBEFE8", "name": "Pastel Peach"},
            {"hex": "#FAEDE4", "name": "Ballet Pink"},
            {"hex": "#FFF3ED", "name": "Milk White"},
            {"hex": "#FFEFEA", "name": "Soft Coral"},
            {"hex": "#F9E7DD", "name": "Blush Nude"},
            {"hex": "#FCEAE3", "name": "Apricot Cream"},
            {"hex": "#FFF8F4", "name": "Feather White"},
            {"hex": "#FFF6F0", "name": "Vanilla Cream"},
            {"hex": "#FBEAE1", "name": "Light Rosé"}
        ],
        "Deep Warm": [
            {"hex": "#FFE0B2", "name": "Peach"},
            {"hex": "#FFD180", "name": "Soft Apricot"},
            {"hex": "#FFF8E1", "name": "Champagne"},
            {"hex": "#FFECB3", "name": "Buttercream"},
            {"hex": "#FFF3E0", "name": "Vanilla"},
            {"hex": "#FFD9A0", "name": "Golden Beige"},
            {"hex": "#FFE5B4", "name": "Melon"},
            {"hex": "#FFEDC2", "name": "Cream Gold"},
            {"hex": "#FFF1D0", "name": "Sand"},
            {"hex": "#FFE3A8", "name": "Honey Beige"},
            {"hex": "#FFDA99", "name": "Apricot Beige"},
            {"hex": "#FFD5A5", "name": "Pale Peach"},
            {"hex": "#FFF0D6", "name": "Linen"},
            {"hex": "#FFE9C0", "name": "Sunlight Beige"},
            {"hex": "#FFE0AA", "name": "Golden Sand"},
            {"hex": "#FFD9B3", "name": "Almond Cream"},
            {"hex": "#FFF7E6", "name": "Pale Gold"},
            {"hex": "#FFEFD1", "name": "Soft Sun"},
            {"hex": "#FFE4AD", "name": "Amber Beige"},
            {"hex": "#FFF3DB", "name": "Buttermilk"}
        ],
        "Cool": [
            {"hex": "#F8BBD0", "name": "Rose Pink"},
            {"hex": "#E1BEE7", "name": "Lavender"},
            {"hex": "#B39DDB", "name": "Lilac"},
            {"hex": "#90CAF9", "name": "Sky Blue"},
            {"hex": "#81D4FA", "name": "Ice Blue"},
            {"hex": "#F48FB1", "name": "Soft Pink"},
            {"hex": "#CE93D8", "name": "Light Purple"},
            {"hex": "#9FA8DA", "name": "Periwinkle"},
            {"hex": "#64B5F6", "name": "Clear Blue"},
            {"hex": "#4FC3F7", "name": "Baby Blue"},
            {"hex": "#BA68C8", "name": "Violet"},
            {"hex": "#7986CB", "name": "Lavender Blue"},
            {"hex": "#9575CD", "name": "Amethyst"},
            {"hex": "#A5D6A7", "name": "Mint Green"},
            {"hex": "#80CBC4", "name": "Aqua Mist"},
            {"hex": "#AED581", "name": "Soft Lime"},
            {"hex": "#FFF3F5", "name": "Powder Rose"},
            {"hex": "#D1C4E9", "name": "Lilac Mist"},
            {"hex": "#C5CAE9", "name": "Blue Mist"},
            {"hex": "#B2DFDB", "name": "Cool Aqua"}
        ],
        "Warm": [
            {"hex": "#FFCC80", "name": "Light Coral"},
            {"hex": "#FFD54F", "name": "Marigold"},
            {"hex": "#FDD835", "name": "Lemon Drop"},
            {"hex": "#FFA726", "name": "Tangerine"},
            {"hex": "#F57C00", "name": "Pumpkin"},
            {"hex": "#FFE082", "name": "Sunflower"},
            {"hex": "#FFCA28", "name": "Golden Yellow"},
            {"hex": "#FFB74D", "name": "Amber"},
            {"hex": "#FB8C00", "name": "Orange"},
            {"hex": "#FF7043", "name": "Coral"},
            {"hex": "#FBC02D", "name": "Mustard"},
            {"hex": "#FFD740", "name": "Bright Gold"},
            {"hex": "#FFAB40", "name": "Mandarin"},
            {"hex": "#FF8A65", "name": "Peach Orange"},
            {"hex": "#EF6C00", "name": "Burnt Orange"},
            {"hex": "#FFF176", "name": "Butter Yellow"},
            {"hex": "#FFECB3", "name": "Light Gold"},
            {"hex": "#FFCCBC", "name": "Peach Cream"},
            {"hex": "#FBE9E7", "name": "Pale Coral"},
            {"hex": "#FFD180", "name": "Soft Orange"}
        ],
        "Cool Neutral": [
            {"hex": "#B0BEC5", "name": "Cool Gray"},
            {"hex": "#78909C", "name": "Slate"},
            {"hex": "#CFD8DC", "name": "Silver Mist"},
            {"hex": "#ECEFF1", "name": "Fog"},
            {"hex": "#A1887F", "name": "Taupe"},
            {"hex": "#90A4AE", "name": "Ash Gray"},
            {"hex": "#BFC8CD", "name": "Mist Gray"},
            {"hex": "#DDE3E6", "name": "Cloud"},
            {"hex": "#E5E9EB", "name": "Soft Silver"},
            {"hex": "#9E9E9E", "name": "Pewter"},
            {"hex": "#8D9CA3", "name": "Blue Gray"},
            {"hex": "#C5CED3", "name": "Steel Mist"},
            {"hex": "#E0E5E7", "name": "Pale Gray"},
            {"hex": "#B3B6B7", "name": "Platinum"},
            {"hex": "#9FA4A7", "name": "Dove Gray"},
            {"hex": "#BDC3C7", "name": "Frost Gray"},
            {"hex": "#D7DBDD", "name": "Cloud Gray"},
            {"hex": "#AAB7B8", "name": "Glacier Gray"},
            {"hex": "#C0C0C0", "name": "Silver"},
            {"hex": "#99A3A4", "name": "Storm Gray"}
        ],
        "Neutral": [
            {"hex": "#D7CCC8", "name": "Warm Beige"},
            {"hex": "#C5A880", "name": "Bronze"},
            {"hex": "#BCAAA4", "name": "Mushroom"},
            {"hex": "#8D6E63", "name": "Earthy Brown"},
            {"hex": "#546E7A", "name": "Steel"},
            {"hex": "#E6D2B5", "name": "Camel"},
            {"hex": "#CBBF9D", "name": "Sandstone"},
            {"hex": "#A1887F", "name": "Mocha"},
            {"hex": "#7B5E57", "name": "Cocoa"},
            {"hex": "#6D4C41", "name": "Coffee"},
            {"hex": "#C49E85", "name": "Tan"},
            {"hex": "#B69B7D", "name": "Khaki"},
            {"hex": "#9E8B70", "name": "Olive Beige"},
            {"hex": "#8B6F4E", "name": "Chestnut"},
            {"hex": "#7C5E42", "name": "Walnut"},
            {"hex": "#BCA58A", "name": "Fawn"},
            {"hex": "#A38D6D", "name": "Hazelnut"},
            {"hex": "#96785B", "name": "Pecan"},
            {"hex": "#836A50", "name": "Umber"},
            {"hex": "#6B4C3B", "name": "Dark Chocolate"}
        ]
    },

    "Light": {
        "Fair Cool": [
            {"hex": "#FFEBE5", "name": "Porcelain"},
            {"hex": "#FFE5D4", "name": "Ivory"},
            {"hex": "#FFEADB", "name": "Alabaster"},
            {"hex": "#FFF0E0", "name": "Light Peach"},
            {"hex": "#FFF5E8", "name": "Cream"},
            {"hex": "#FAE6E1", "name": "Soft Blush"},
            {"hex": "#FBE9E7", "name": "Blush Pink"},
            {"hex": "#FDEEEA", "name": "Peach Whisper"},
            {"hex": "#FFF8F4", "name": "Feather White"},
            {"hex": "#FFF3F0", "name": "Milk Cream"},
            {"hex": "#FAE4E0", "name": "Rose Beige"},
            {"hex": "#FBEDE9", "name": "Pastel Coral"},
            {"hex": "#FFF1EB", "name": "Powder Blush"},
            {"hex": "#FFEFEC", "name": "Baby Pink"},
            {"hex": "#FCEAE6", "name": "Light Rosé"},
            {"hex": "#FFF6F3", "name": "Vanilla Blush"},
            {"hex": "#FDF2ED", "name": "Peach Cream"},
            {"hex": "#FCEFE8", "name": "Apricot Cream"},
            {"hex": "#FFF8F5", "name": "Cotton White"},
            {"hex": "#FFECEA", "name": "Rosé Mist"}
        ],
        "Deep Warm": [
            {"hex": "#FFF59D", "name": "Soft Yellow"},
            {"hex": "#FFECB3", "name": "Cream"},
            {"hex": "#FFF8E1", "name": "Champagne"},
            {"hex": "#FBE9E7", "name": "Light Peach"},
            {"hex": "#FFE082", "name": "Light Gold"},
            {"hex": "#FFD54F", "name": "Golden Glow"},
            {"hex": "#FFE599", "name": "Pale Honey"},
            {"hex": "#FFF2CC", "name": "Lemon Cream"},
            {"hex": "#FFE6B3", "name": "Buttercream"},
            {"hex": "#FFF5D6", "name": "Sunlight"},
            {"hex": "#FFD180", "name": "Amber Glow"},
            {"hex": "#FFE0A3", "name": "Golden Beige"},
            {"hex": "#FFF1C1", "name": "Vanilla Custard"},
            {"hex": "#FFE9AD", "name": "Soft Amber"},
            {"hex": "#FFD699", "name": "Pale Apricot"},
            {"hex": "#FFF6D0", "name": "Buttermilk"},
            {"hex": "#FFE7A8", "name": "Honey Beige"},
            {"hex": "#FFF4CC", "name": "Cream Gold"},
            {"hex": "#FFECA0", "name": "Sunbeam"},
            {"hex": "#FFF9E6", "name": "Ivory Gold"}
        ],
        "Cool": [
            {"hex": "#C5CAE9", "name": "Lavender Mist"},
            {"hex": "#BBDEFB", "name": "Pale Blue"},
            {"hex": "#E3F2FD", "name": "Powder Blue"},
            {"hex": "#F3E5F5", "name": "Soft Lilac"},
            {"hex": "#B2EBF2", "name": "Aqua Mist"},
            {"hex": "#E1BEE7", "name": "Lavender"},
            {"hex": "#F8BBD0", "name": "Rose Pink"},
            {"hex": "#D1C4E9", "name": "Lilac Mist"},
            {"hex": "#B3E5FC", "name": "Sky Blue"},
            {"hex": "#81D4FA", "name": "Ice Blue"},
            {"hex": "#CE93D8", "name": "Light Purple"},
            {"hex": "#9FA8DA", "name": "Periwinkle"},
            {"hex": "#64B5F6", "name": "Clear Blue"},
            {"hex": "#4FC3F7", "name": "Baby Blue"},
            {"hex": "#B2DFDB", "name": "Cool Aqua"},
            {"hex": "#A5D6A7", "name": "Mint Green"},
            {"hex": "#E6EEFA", "name": "Frost Blue"},
            {"hex": "#F0E6F8", "name": "Pale Lavender"},
            {"hex": "#D0EAFB", "name": "Crystal Blue"},
            {"hex": "#CDE7F2", "name": "Glacier Mist"}
        ],
        "Warm": [
            {"hex": "#FFCCBC", "name": "Blush Coral"},
            {"hex": "#FFA726", "name": "Tangerine"},
            {"hex": "#FFD54F", "name": "Marigold"},
            {"hex": "#FDD835", "name": "Lemon Drop"},
            {"hex": "#FF8A65", "name": "Coral"},
            {"hex": "#FFE082", "name": "Sunflower"},
            {"hex": "#FFB74D", "name": "Amber"},
            {"hex": "#FB8C00", "name": "Orange"},
            {"hex": "#FF7043", "name": "Soft Coral"},
            {"hex": "#FFAB40", "name": "Mandarin"},
            {"hex": "#FFCA28", "name": "Golden Yellow"},
            {"hex": "#FFD180", "name": "Peach Orange"},
            {"hex": "#FBC02D", "name": "Mustard"},
            {"hex": "#FFF176", "name": "Butter Yellow"},
            {"hex": "#FFF59D", "name": "Lemon Cream"},
            {"hex": "#FEEBC8", "name": "Peach Cream"},
            {"hex": "#FFE4B5", "name": "Moccasin"},
            {"hex": "#FFDAB9", "name": "Peach Puff"},
            {"hex": "#FFDEAD", "name": "Navajo White"},
            {"hex": "#FFEDB3", "name": "Soft Gold"}
        ],
        "Cool Neutral": [
            {"hex": "#7986CB", "name": "Dusty Blue"},
            {"hex": "#5C6BC0", "name": "Indigo"},
            {"hex": "#90A4AE", "name": "Frost Blue"},
            {"hex": "#B0BEC5", "name": "Slate"},
            {"hex": "#CFD8DC", "name": "Steel Blue"},
            {"hex": "#A7B6C2", "name": "Cloudy Sky"},
            {"hex": "#BFC8CD", "name": "Mist Gray"},
            {"hex": "#D0D8DD", "name": "Pale Slate"},
            {"hex": "#DDE3E6", "name": "Cool Mist"},
            {"hex": "#E3E7EB", "name": "Fog Gray"},
            {"hex": "#8C9EA9", "name": "Storm Blue"},
            {"hex": "#9EAFB9", "name": "Pewter Blue"},
            {"hex": "#BAC3C8", "name": "Ice Gray"},
            {"hex": "#D5DCE0", "name": "Frost Gray"},
            {"hex": "#C1CBD0", "name": "Silver Gray"},
            {"hex": "#A3B1B8", "name": "Blue Ash"},
            {"hex": "#CED6DA", "name": "Overcast"},
            {"hex": "#D9E0E4", "name": "Glacier Gray"},
            {"hex": "#E6EBEE", "name": "Snow Mist"},
            {"hex": "#B7C3C8", "name": "Steel Mist"}
        ],
        "Neutral": [
            {"hex": "#D7CCC8", "name": "Warm Taupe"},
            {"hex": "#A1887F", "name": "Soft Cocoa"},
            {"hex": "#BCAAA4", "name": "Toast"},
            {"hex": "#FFAB91", "name": "Coral"},
            {"hex": "#D1C4E9", "name": "Wisteria"},
            {"hex": "#CBBF9D", "name": "Sandstone"},
            {"hex": "#E6D2B5", "name": "Camel"},
            {"hex": "#BCA58A", "name": "Fawn"},
            {"hex": "#A38D6D", "name": "Hazelnut"},
            {"hex": "#96785B", "name": "Pecan"},
            {"hex": "#836A50", "name": "Umber"},
            {"hex": "#6B4C3B", "name": "Dark Chocolate"},
            {"hex": "#B69B7D", "name": "Khaki"},
            {"hex": "#9E8B70", "name": "Olive Beige"},
            {"hex": "#8B6F4E", "name": "Chestnut"},
            {"hex": "#7C5E42", "name": "Walnut"},
            {"hex": "#C49E85", "name": "Tan"},
            {"hex": "#C5B9A0", "name": "Pale Olive"},
            {"hex": "#AA9B82", "name": "Stone"},
            {"hex": "#8F7B64", "name": "Mocha Mist"}
        ]
    },

    "Medium": {
        "Fair Cool": [
            {"hex": "#FFEBE5", "name": "Porcelain"},
            {"hex": "#FFE5D4", "name": "Ivory"},
            {"hex": "#FFEADB", "name": "Alabaster"},
            {"hex": "#FFF0E0", "name": "Light Peach"},
            {"hex": "#FFF5E8", "name": "Cream"},
            {"hex": "#FCE9E3", "name": "Blush Pink"},
            {"hex": "#FDF6EC", "name": "Soft Almond"},
            {"hex": "#F9E4D2", "name": "Rose Beige"},
            {"hex": "#FAE6D3", "name": "Oyster"},
            {"hex": "#F6E2DA", "name": "Petal"},
            {"hex": "#FFF9F5", "name": "Vanilla Cream"},
            {"hex": "#FCEEE6", "name": "Powder Peach"},
            {"hex": "#F9E7DF", "name": "Milk Tea"},
            {"hex": "#F8EAE5", "name": "Pale Blush"},
            {"hex": "#FFF4ED", "name": "Cloud White"},
            {"hex": "#FDF1E7", "name": "Sand Dune"},
            {"hex": "#FAEFEA", "name": "Shell Pink"},
            {"hex": "#F8E3DA", "name": "Nude Mist"},
            {"hex": "#F7E8DE", "name": "Soft Shell"},
            {"hex": "#F5E9E0", "name": "Rose Mist"}
        ],
        "Deep Warm": [
            {"hex": "#FFF176", "name": "Golden Yellow"},
            {"hex": "#FFD54F", "name": "Marigold"},
            {"hex": "#FFF59D", "name": "Warm Cream"},
            {"hex": "#FFCC80", "name": "Honey Peach"},
            {"hex": "#FFF9C4", "name": "Buttercream"},
            {"hex": "#FFE082", "name": "Light Gold"},
            {"hex": "#FBC02D", "name": "Sunflower"},
            {"hex": "#FDD835", "name": "Lemon Drop"},
            {"hex": "#FFE57F", "name": "Amber Glow"},
            {"hex": "#FFB300", "name": "Golden Honey"},
            {"hex": "#FFCA28", "name": "Saffron"},
            {"hex": "#FFD740", "name": "Mellow Yellow"},
            {"hex": "#F9A825", "name": "Mustard Gold"},
            {"hex": "#FFC107", "name": "Bright Marigold"},
            {"hex": "#FFFDE7", "name": "Pale Lemon"},
            {"hex": "#FFF59F", "name": "Primrose"},
            {"hex": "#FFD600", "name": "Solar Yellow"},
            {"hex": "#FFECB3", "name": "Soft Butter"},
            {"hex": "#FFD54F", "name": "Golden Cream"},
            {"hex": "#FFE4B5", "name": "Navajo Sand"}
        ],
        "Cool": [
            {"hex": "#AED581", "name": "Fresh Green"},
            {"hex": "#C5E1A5", "name": "Celery"},
            {"hex": "#9CCC65", "name": "Spring Leaf"},
            {"hex": "#81C784", "name": "Soft Moss"},
            {"hex": "#66BB6A", "name": "Lush Meadow"},
            {"hex": "#A5D6A7", "name": "Mint Leaf"},
            {"hex": "#8BC34A", "name": "Apple Green"},
            {"hex": "#7CB342", "name": "Fern"},
            {"hex": "#9BD8A2", "name": "Seafoam"},
            {"hex": "#B2DFDB", "name": "Icy Aqua"},
            {"hex": "#80CBC4", "name": "Cool Teal"},
            {"hex": "#4DB6AC", "name": "Ocean Mist"},
            {"hex": "#26A69A", "name": "Tropical Teal"},
            {"hex": "#009688", "name": "Deep Teal"},
            {"hex": "#B3E5FC", "name": "Sky Blue"},
            {"hex": "#81D4FA", "name": "Ice Blue"},
            {"hex": "#4FC3F7", "name": "Crystal Blue"},
            {"hex": "#29B6F6", "name": "Arctic Blue"},
            {"hex": "#03A9F4", "name": "Azure"},
            {"hex": "#0288D1", "name": "Ocean Blue"}
        ],
        "Warm": [
            {"hex": "#F57C00", "name": "Pumpkin"},
            {"hex": "#E65100", "name": "Burnt Orange"},
            {"hex": "#EF6C00", "name": "Ember"},
            {"hex": "#FF7043", "name": "Rustic Coral"},
            {"hex": "#F4511E", "name": "Autumn Leaf"},
            {"hex": "#FB8C00", "name": "Amber"},
            {"hex": "#FF9800", "name": "Tangerine"},
            {"hex": "#FFB74D", "name": "Apricot"},
            {"hex": "#FF8A65", "name": "Coral Sunset"},
            {"hex": "#F06292", "name": "Rose Coral"},
            {"hex": "#E57373", "name": "Blush Red"},
            {"hex": "#F44336", "name": "Tomato"},
            {"hex": "#E53935", "name": "Brick Red"},
            {"hex": "#D84315", "name": "Copper"},
            {"hex": "#BF360C", "name": "Mahogany"},
            {"hex": "#FFCCBC", "name": "Peach Sorbet"},
            {"hex": "#FFAB91", "name": "Papaya"},
            {"hex": "#FBC02D", "name": "Golden Amber"},
            {"hex": "#FF6F00", "name": "Sunset Orange"},
            {"hex": "#E64A19", "name": "Cinnamon"}
        ],
        "Cool Neutral": [
            {"hex": "#607D8B", "name": "Charcoal"},
            {"hex": "#78909C", "name": "Steel"},
            {"hex": "#546E7A", "name": "Shadow Gray"},
            {"hex": "#455A64", "name": "Storm Blue"},
            {"hex": "#37474F", "name": "Deep Graphite"},
            {"hex": "#90A4AE", "name": "Smoke Blue"},
            {"hex": "#B0BEC5", "name": "Cloud Gray"},
            {"hex": "#CFD8DC", "name": "Frost"},
            {"hex": "#ECEFF1", "name": "Ice Gray"},
            {"hex": "#A7B6BD", "name": "Mist"},
            {"hex": "#9FA8DA", "name": "Periwinkle Gray"},
            {"hex": "#7986CB", "name": "Dusty Blue"},
            {"hex": "#5C6BC0", "name": "Indigo Blue"},
            {"hex": "#3F51B5", "name": "Royal Blue"},
            {"hex": "#283593", "name": "Deep Indigo"},
            {"hex": "#B2BABB", "name": "Pewter"},
            {"hex": "#99AEBB", "name": "Blue Fog"},
            {"hex": "#8E9BAF", "name": "Steel Mist"},
            {"hex": "#6C7A89", "name": "Urban Gray"},
            {"hex": "#4B5D67", "name": "Slate Storm"}
        ],
        "Neutral": [
            {"hex": "#263238", "name": "Slate Black"},
            {"hex": "#BCAAA4", "name": "Mushroom"},
            {"hex": "#8D6E63", "name": "Earthy Brown"},
            {"hex": "#A1887F", "name": "Taupe"},
            {"hex": "#C5A880", "name": "Bronze"},
            {"hex": "#D7CCC8", "name": "Sandstone"},
            {"hex": "#A89F91", "name": "Stone"},
            {"hex": "#C0B283", "name": "Khaki"},
            {"hex": "#BDB6B6", "name": "Ash"},
            {"hex": "#E6D3B3", "name": "Latte"},
            {"hex": "#CBB682", "name": "Camel"},
            {"hex": "#A89F91", "name": "Warm Gray"},
            {"hex": "#967259", "name": "Chestnut"},
            {"hex": "#5D4037", "name": "Mocha"},
            {"hex": "#4E342E", "name": "Espresso"},
            {"hex": "#8E735B", "name": "Cappuccino"},
            {"hex": "#9C7B4B", "name": "Walnut"},
            {"hex": "#B08B5B", "name": "Golden Brown"},
            {"hex": "#7B5E57", "name": "Cocoa"},
            {"hex": "#D2B48C", "name": "Tan"}
        ]
    },

    "Olive": {
        "Fair Cool": [
            {"hex": "#FFEBE5", "name": "Porcelain"},
            {"hex": "#FFE5D4", "name": "Ivory"},
            {"hex": "#FFEADB", "name": "Alabaster"},
            {"hex": "#FFF0E0", "name": "Light Peach"},
            {"hex": "#FFF5E8", "name": "Cream"},
            {"hex": "#F8E9E3", "name": "Blush Beige"},
            {"hex": "#F7E7DA", "name": "Soft Sand"},
            {"hex": "#FAE5DC", "name": "Petal Beige"},
            {"hex": "#F4E3D0", "name": "Oyster Cream"},
            {"hex": "#EEDFD4", "name": "Powder Beige"},
            {"hex": "#F6EADF", "name": "Cloud Beige"},
            {"hex": "#EFE3D8", "name": "Rose Mist"},
            {"hex": "#EDE1D0", "name": "Linen"},
            {"hex": "#F8ECE2", "name": "Vanilla Tint"},
            {"hex": "#F4E9DE", "name": "Soft Almond"},
            {"hex": "#FBEFE5", "name": "Pale Shell"},
            {"hex": "#EDE2D3", "name": "Chalk Beige"},
            {"hex": "#F3E4D7", "name": "Light Latte"},
            {"hex": "#EADFD0", "name": "Warm Porcelain"},
            {"hex": "#F2E8DD", "name": "Cream Blush"}
        ],
        "Deep Warm": [
            {"hex": "#F0E68C", "name": "Khaki"},
            {"hex": "#FFD700", "name": "Gold"},
            {"hex": "#FFB347", "name": "Amber"},
            {"hex": "#D2B48C", "name": "Tan"},
            {"hex": "#E6BE8A", "name": "Desert Sand"},
            {"hex": "#CDA434", "name": "Old Gold"},
            {"hex": "#E4B169", "name": "Golden Beige"},
            {"hex": "#FFBF00", "name": "Marigold"},
            {"hex": "#E0C068", "name": "Harvest Gold"},
            {"hex": "#BDA55D", "name": "Wheat"},
            {"hex": "#E1B16A", "name": "Honey Gold"},
            {"hex": "#D1A054", "name": "Goldenrod"},
            {"hex": "#E3B778", "name": "Camel Gold"},
            {"hex": "#B38B4D", "name": "Antique Bronze"},
            {"hex": "#C49E54", "name": "Ochre"},
            {"hex": "#E4C580", "name": "Buttercream Gold"},
            {"hex": "#BFA06A", "name": "Maple Beige"},
            {"hex": "#D4AF37", "name": "Royal Gold"},
            {"hex": "#E2C792", "name": "Beige Gold"},
            {"hex": "#C9A86A", "name": "Golden Sand"}
        ],
        "Cool": [
            {"hex": "#6A5ACD", "name": "Slate Blue"},
            {"hex": "#4682B4", "name": "Steel Blue"},
            {"hex": "#5F9EA0", "name": "Cadet Blue"},
            {"hex": "#708090", "name": "Cool Slate"},
            {"hex": "#7B68EE", "name": "Medium Slate"},
            {"hex": "#4C6793", "name": "Denim Blue"},
            {"hex": "#5D8AA8", "name": "Air Force Blue"},
            {"hex": "#7DA1C4", "name": "Dusty Sky"},
            {"hex": "#8CA6DB", "name": "Periwinkle"},
            {"hex": "#7C90A0", "name": "Fog Blue"},
            {"hex": "#8B9DC3", "name": "Cool Periwinkle"},
            {"hex": "#6E7F80", "name": "Smoke Blue"},
            {"hex": "#4B6E82", "name": "Deep Lake"},
            {"hex": "#577284", "name": "Icy Steel"},
            {"hex": "#9DB9D5", "name": "Pale Sky"},
            {"hex": "#607B8B", "name": "Glacier Blue"},
            {"hex": "#7F9EB2", "name": "Frosted Blue"},
            {"hex": "#6B7E94", "name": "Winter Slate"},
            {"hex": "#5A6F8C", "name": "Indigo Gray"},
            {"hex": "#547C8C", "name": "Teal Slate"}
        ],
        "Warm": [
            {"hex": "#FF8C00", "name": "Dark Orange"},
            {"hex": "#CD853F", "name": "Peru"},
            {"hex": "#A0522D", "name": "Sienna"},
            {"hex": "#D2691E", "name": "Chocolate"},
            {"hex": "#B87333", "name": "Copper"},
            {"hex": "#CC7722", "name": "Ochre Orange"},
            {"hex": "#E97451", "name": "Burnt Sienna"},
            {"hex": "#FF7518", "name": "Pumpkin Spice"},
            {"hex": "#D99058", "name": "Golden Apricot"},
            {"hex": "#C35831", "name": "Rust Orange"},
            {"hex": "#B86B4B", "name": "Clay"},
            {"hex": "#E08119", "name": "Amber Glow"},
            {"hex": "#A65E2E", "name": "Terracotta"},
            {"hex": "#DE7C51", "name": "Cinnamon"},
            {"hex": "#CC5500", "name": "Tawny"},
            {"hex": "#AD6F3B", "name": "Maple Brown"},
            {"hex": "#C46210", "name": "Burnt Amber"},
            {"hex": "#E49B0F", "name": "Golden Ochre"},
            {"hex": "#E2725B", "name": "Coral Clay"},
            {"hex": "#B05E26", "name": "Earth Copper"}
        ],
        "Cool Neutral": [
            {"hex": "#556B2F", "name": "Dark Olive Green"},
            {"hex": "#2F4F4F", "name": "Dark Slate Gray"},
            {"hex": "#4B5320", "name": "Army Green"},
            {"hex": "#3C4F76", "name": "Deep Indigo Blue"},
            {"hex": "#6B8E23", "name": "Olive Drab"},
            {"hex": "#4A646C", "name": "Slate Teal"},
            {"hex": "#3B4D61", "name": "Midnight Teal"},
            {"hex": "#445C3C", "name": "Moss Gray"},
            {"hex": "#4F585E", "name": "Graphite Olive"},
            {"hex": "#36454F", "name": "Charcoal Olive"},
            {"hex": "#5C715E", "name": "Pine Gray"},
            {"hex": "#6B6E6A", "name": "Stone Olive"},
            {"hex": "#2E3B3D", "name": "Shadow Olive"},
            {"hex": "#4E5D5B", "name": "Steel Moss"},
            {"hex": "#3B4C4A", "name": "Deep Forest Gray"},
            {"hex": "#596C68", "name": "Fog Olive"},
            {"hex": "#3F4841", "name": "Olive Charcoal"},
            {"hex": "#5B6F5B", "name": "Forest Slate"},
            {"hex": "#475E56", "name": "Sage Gray"},
            {"hex": "#3D4B41", "name": "Evergreen Gray"}
        ],
        "Neutral": [
            {"hex": "#C2B280", "name": "Sand"},
            {"hex": "#BDB76B", "name": "Dark Khaki"},
            {"hex": "#F4A460", "name": "Sandy Brown"},
            {"hex": "#C3B091", "name": "Khaki Gray"},
            {"hex": "#D3B683", "name": "Camel"},
            {"hex": "#BFAF80", "name": "Wheat Beige"},
            {"hex": "#C5A86D", "name": "Golden Sand"},
            {"hex": "#D2BA8A", "name": "Beige Almond"},
            {"hex": "#B6A077", "name": "Earth Beige"},
            {"hex": "#C4B59A", "name": "Pebble"},
            {"hex": "#BBAA8C", "name": "Driftwood"},
            {"hex": "#CAB792", "name": "Vanilla Bean"},
            {"hex": "#AFA17C", "name": "Olive Beige"},
            {"hex": "#D4C19C", "name": "Butter Beige"},
            {"hex": "#B7A67A", "name": "Tumbleweed"},
            {"hex": "#A1926A", "name": "Khaki Moss"},
            {"hex": "#CBB58A", "name": "Beige Ochre"},
            {"hex": "#B9A56E", "name": "Dusty Camel"},
            {"hex": "#AA9B75", "name": "Sahara"},
            {"hex": "#BCA772", "name": "Fawn"}
        ]
    },

    "Brown": {
        "Fair Cool": [
            {"hex": "#FFEBE5", "name": "Porcelain"},
            {"hex": "#FFE5D4", "name": "Ivory"},
            {"hex": "#FFEADB", "name": "Alabaster"},
            {"hex": "#FFF0E0", "name": "Light Peach"},
            {"hex": "#FFF5E8", "name": "Cream"},
            {"hex": "#F5E1DA", "name": "Soft Rose Beige"},
            {"hex": "#EED6D3", "name": "Blush Beige"},
            {"hex": "#F6E6E0", "name": "Vanilla Cream"},
            {"hex": "#E8D7C9", "name": "Almond Milk"},
            {"hex": "#F9E9E0", "name": "Peach Veil"},
            {"hex": "#EADFD5", "name": "Linen Mist"},
            {"hex": "#F2E4DC", "name": "Shell Pink"},
            {"hex": "#F7EBE4", "name": "Powder Cream"},
            {"hex": "#ECDDD4", "name": "Sandstone Pink"},
            {"hex": "#F3E3D9", "name": "Light Oat"},
            {"hex": "#E9D9CC", "name": "Muted Cream"},
            {"hex": "#F1E3D5", "name": "Warm Ivory"},
            {"hex": "#F8EEE8", "name": "Frosted Beige"},
            {"hex": "#EAD8C8", "name": "Rose Cream"},
            {"hex": "#F6EAE1", "name": "Soft Porcelain"}
        ],
        "Deep Warm": [
            {"hex": "#DAA520", "name": "Goldenrod"},
            {"hex": "#FFD700", "name": "Gold"},
            {"hex": "#E6BE8A", "name": "Desert Sand"},
            {"hex": "#F4A460", "name": "Sandy Brown"},
            {"hex": "#DEB887", "name": "Burlywood"},
            {"hex": "#C68642", "name": "Caramel"},
            {"hex": "#D4A017", "name": "Mustard Gold"},
            {"hex": "#B87333", "name": "Copper"},
            {"hex": "#E1A95F", "name": "Butternut"},
            {"hex": "#B65D1F", "name": "Rust"},
            {"hex": "#C58917", "name": "Amber Gold"},
            {"hex": "#BC8F4A", "name": "Bronze Beige"},
            {"hex": "#E39B44", "name": "Honey Bronze"},
            {"hex": "#C4915D", "name": "Toffee"},
            {"hex": "#BB8141", "name": "Burnished Gold"},
            {"hex": "#E5B96E", "name": "Wheat Gold"},
            {"hex": "#B2752A", "name": "Maple Gold"},
            {"hex": "#E2A76F", "name": "Caramel Beige"},
            {"hex": "#C08228", "name": "Golden Bronze"},
            {"hex": "#B66E41", "name": "Warm Tan"}
        ],
        "Cool": [
            {"hex": "#9370DB", "name": "Medium Purple"},
            {"hex": "#6495ED", "name": "Cornflower Blue"},
            {"hex": "#7B68EE", "name": "Medium Slate Blue"},
            {"hex": "#4169E1", "name": "Royal Blue"},
            {"hex": "#6A5ACD", "name": "Slate Blue"},
            {"hex": "#5F9EA0", "name": "Cadet Blue"},
            {"hex": "#4682B4", "name": "Steel Blue"},
            {"hex": "#4B9CD3", "name": "Sky Denim"},
            {"hex": "#3F5F8C", "name": "Midnight Blue"},
            {"hex": "#7A89C2", "name": "Lavender Blue"},
            {"hex": "#566B84", "name": "Storm Blue"},
            {"hex": "#8C92AC", "name": "Periwinkle Gray"},
            {"hex": "#5C6E91", "name": "Indigo Mist"},
            {"hex": "#4A708B", "name": "Ocean Slate"},
            {"hex": "#7B84A0", "name": "Frost Blue"},
            {"hex": "#68829E", "name": "Dusty Azure"},
            {"hex": "#52688F", "name": "Icy Navy"},
            {"hex": "#7F8BA3", "name": "Glacier Blue"},
            {"hex": "#4C5D73", "name": "Charcoal Blue"},
            {"hex": "#6F7D94", "name": "Twilight Blue"}
        ],
        "Warm": [
            {"hex": "#8B4513", "name": "Saddle Brown"},
            {"hex": "#A0522D", "name": "Sienna"},
            {"hex": "#D2691E", "name": "Chocolate"},
            {"hex": "#B22222", "name": "Firebrick"},
            {"hex": "#CD853F", "name": "Peru"},
            {"hex": "#A0522D", "name": "Rusty Sienna"},
            {"hex": "#C04000", "name": "Mahogany"},
            {"hex": "#B94E48", "name": "Chestnut"},
            {"hex": "#A52A2A", "name": "Brown"},
            {"hex": "#8B2500", "name": "Burnt Umber"},
            {"hex": "#B86B4B", "name": "Clay Brown"},
            {"hex": "#8A3324", "name": "Brick Brown"},
            {"hex": "#D26900", "name": "Copper Brown"},
            {"hex": "#A97142", "name": "Coffee"},
            {"hex": "#9C661F", "name": "Golden Brown"},
            {"hex": "#7B3F00", "name": "Walnut"},
            {"hex": "#8E593C", "name": "Cedar Brown"},
            {"hex": "#A9744F", "name": "Pecan"},
            {"hex": "#9B5D3C", "name": "Maple Brown"},
            {"hex": "#7F5217", "name": "Dark Caramel"}
        ],
        "Cool Neutral": [
            {"hex": "#483D8B", "name": "Dark Slate Blue"},
            {"hex": "#2F4F4F", "name": "Dark Slate Gray"},
            {"hex": "#4B0082", "name": "Indigo"},
            {"hex": "#5F9EA0", "name": "Cadet Blue"},
            {"hex": "#708090", "name": "Slate Gray"},
            {"hex": "#556B2F", "name": "Olive Green"},
            {"hex": "#4E5754", "name": "Charcoal Olive"},
            {"hex": "#6B8E23", "name": "Moss Green"},
            {"hex": "#4A646C", "name": "Slate Teal"},
            {"hex": "#3C4F76", "name": "Deep Indigo"},
            {"hex": "#6B6E6B", "name": "Ash Olive"},
            {"hex": "#5D6D7E", "name": "Steel Blue Gray"},
            {"hex": "#4F5B66", "name": "Pewter Blue"},
            {"hex": "#37474F", "name": "Graphite"},
            {"hex": "#4C516D", "name": "Blue Charcoal"},
            {"hex": "#56666B", "name": "Fog Slate"},
            {"hex": "#515E63", "name": "Deep Sage"},
            {"hex": "#3E4C59", "name": "Charcoal Navy"},
            {"hex": "#4D5656", "name": "Gunmetal"},
            {"hex": "#5B6B76", "name": "Cool Graphite"}
        ],
        "Neutral": [
            {"hex": "#BC8F8F", "name": "Rosy Brown"},
            {"hex": "#C3B091", "name": "Khaki Gray"},
            {"hex": "#C2B280", "name": "Sand"},
            {"hex": "#DEB887", "name": "Burlywood"},
            {"hex": "#D2B48C", "name": "Tan"},
            {"hex": "#BDB76B", "name": "Dark Khaki"},
            {"hex": "#C3A36E", "name": "Camel Beige"},
            {"hex": "#CBB67C", "name": "Golden Beige"},
            {"hex": "#BBA67D", "name": "Mink"},
            {"hex": "#A79877", "name": "Stone Beige"},
            {"hex": "#B6A27D", "name": "Dusty Tan"},
            {"hex": "#C2AD92", "name": "Oat Beige"},
            {"hex": "#B5A27B", "name": "Khaki Taupe"},
            {"hex": "#D1B88A", "name": "Buff"},
            {"hex": "#C1AA80", "name": "Honey Beige"},
            {"hex": "#B19F76", "name": "Sand Dune"},
            {"hex": "#A89472", "name": "Sahara"},
            {"hex": "#BDA66E", "name": "Warm Khaki"},
            {"hex": "#C4AE78", "name": "Fawn Beige"},
            {"hex": "#B39B6D", "name": "Golden Taupe"}
        ]
    },

    "Dark": {
        "Fair Cool": [
            {"hex": "#FFEBE5", "name": "Porcelain"},
            {"hex": "#FFE5D4", "name": "Ivory"},
            {"hex": "#FFEADB", "name": "Alabaster"},
            {"hex": "#FFF0E0", "name": "Light Peach"},
            {"hex": "#FFF5E8", "name": "Cream"},
            {"hex": "#F8E8E0", "name": "Blush Beige"},
            {"hex": "#F3E6DC", "name": "Soft Linen"},
            {"hex": "#F7E9E4", "name": "Rose Beige"},
            {"hex": "#EDE0D1", "name": "Pale Almond"},
            {"hex": "#FAE6E0", "name": "Peach Beige"},
            {"hex": "#EADDD3", "name": "Muted Sand"},
            {"hex": "#F1E5D8", "name": "Warm Cream"},
            {"hex": "#F7EBE4", "name": "Powder Cream"},
            {"hex": "#E9DED3", "name": "Soft Taupe"},
            {"hex": "#F3E5D4", "name": "Pale Gold Beige"},
            {"hex": "#EFE0D0", "name": "Shell Cream"},
            {"hex": "#F5EAE2", "name": "Almond Cream"},
            {"hex": "#EAD7C8", "name": "Light Rose Cream"},
            {"hex": "#F8EEE8", "name": "Frosted Beige"},
            {"hex": "#EAD8C8", "name": "Rose Cream"}
        ],
        "Deep Warm": [
            {"hex": "#FFD700", "name": "Gold"},
            {"hex": "#FFA500", "name": "Orange"},
            {"hex": "#FF8C00", "name": "Dark Orange"},
            {"hex": "#DAA520", "name": "Goldenrod"},
            {"hex": "#B8860B", "name": "Dark Goldenrod"},
            {"hex": "#FFB14E", "name": "Amber"},
            {"hex": "#E97451", "name": "Burnt Sienna"},
            {"hex": "#FF7F50", "name": "Coral"},
            {"hex": "#FF6F20", "name": "Persimmon"},
            {"hex": "#E68A00", "name": "Tiger Orange"},
            {"hex": "#C65D00", "name": "Cinnamon"},
            {"hex": "#FF9933", "name": "Pumpkin"},
            {"hex": "#D27D2D", "name": "Golden Brown"},
            {"hex": "#FFAE42", "name": "Sunset Gold"},
            {"hex": "#E36F1E", "name": "Carrot Orange"},
            {"hex": "#B75E09", "name": "Bronze Orange"},
            {"hex": "#F4A460", "name": "Sandy Brown"},
            {"hex": "#D2691E", "name": "Chocolate Orange"},
            {"hex": "#FF8243", "name": "Mango Orange"},
            {"hex": "#B5651D", "name": "Copper"}
        ],
        "Cool": [
            {"hex": "#483D8B", "name": "Dark Slate Blue"},
            {"hex": "#4169E1", "name": "Royal Blue"},
            {"hex": "#191970", "name": "Midnight Blue"},
            {"hex": "#000080", "name": "Navy"},
            {"hex": "#4682B4", "name": "Steel Blue"},
            {"hex": "#2C3E50", "name": "Charcoal Navy"},
            {"hex": "#6A5ACD", "name": "Slate Blue"},
            {"hex": "#4B0082", "name": "Indigo"},
            {"hex": "#5F9EA0", "name": "Cadet Blue"},
            {"hex": "#2E4A7D", "name": "Ocean Navy"},
            {"hex": "#3B5998", "name": "Deep Azure"},
            {"hex": "#355E8C", "name": "Cobalt"},
            {"hex": "#4C516D", "name": "Blue Charcoal"},
            {"hex": "#7B68EE", "name": "Medium Slate Blue"},
            {"hex": "#1E3F66", "name": "Deep Sea Blue"},
            {"hex": "#536878", "name": "Gunmetal Blue"},
            {"hex": "#4E5B73", "name": "Ash Blue"},
            {"hex": "#34495E", "name": "Storm Navy"},
            {"hex": "#5A6A85", "name": "Frost Blue"},
            {"hex": "#283655", "name": "Midnight Indigo"}
        ],
        "Warm": [
            {"hex": "#8B0000", "name": "Dark Red"},
            {"hex": "#B22222", "name": "Firebrick"},
            {"hex": "#A0522D", "name": "Sienna"},
            {"hex": "#800000", "name": "Maroon"},
            {"hex": "#CD5C5C", "name": "Indian Red"},
            {"hex": "#A52A2A", "name": "Brown"},
            {"hex": "#8B4513", "name": "Saddle Brown"},
            {"hex": "#D2691E", "name": "Chocolate"},
            {"hex": "#B03060", "name": "Rich Maroon"},
            {"hex": "#C04000", "name": "Mahogany"},
            {"hex": "#9B111E", "name": "Ruby Red"},
            {"hex": "#8A3324", "name": "Brick Brown"},
            {"hex": "#B94E48", "name": "Chestnut"},
            {"hex": "#800020", "name": "Burgundy"},
            {"hex": "#A52A2A", "name": "Rusty Brown"},
            {"hex": "#B22222", "name": "Deep Crimson"},
            {"hex": "#7B3F00", "name": "Walnut Brown"},
            {"hex": "#993333", "name": "Deep Rosewood"},
            {"hex": "#C1440E", "name": "Burnt Copper"},
            {"hex": "#8B2500", "name": "Burnt Umber"}
        ],
        "Cool Neutral": [
            {"hex": "#2F4F4F", "name": "Dark Slate Gray"},
            {"hex": "#4B0082", "name": "Indigo"},
            {"hex": "#483D8B", "name": "Dark Slate Blue"},
            {"hex": "#708090", "name": "Slate Gray"},
            {"hex": "#5F9EA0", "name": "Cadet Blue"},
            {"hex": "#556B2F", "name": "Olive Green"},
            {"hex": "#4E5754", "name": "Charcoal Olive"},
            {"hex": "#6B8E23", "name": "Moss Green"},
            {"hex": "#4A646C", "name": "Slate Teal"},
            {"hex": "#3C4F76", "name": "Deep Indigo"},
            {"hex": "#6B6E6B", "name": "Ash Olive"},
            {"hex": "#5D6D7E", "name": "Steel Blue Gray"},
            {"hex": "#4F5B66", "name": "Pewter Blue"},
            {"hex": "#37474F", "name": "Graphite"},
            {"hex": "#4C516D", "name": "Blue Charcoal"},
            {"hex": "#56666B", "name": "Fog Slate"},
            {"hex": "#515E63", "name": "Deep Sage"},
            {"hex": "#3E4C59", "name": "Charcoal Navy"},
            {"hex": "#4D5656", "name": "Gunmetal"},
            {"hex": "#5B6B76", "name": "Cool Graphite"}
        ],
        "Neutral": [
            {"hex": "#8B4513", "name": "Saddle Brown"},
            {"hex": "#A0522D", "name": "Sienna"},
            {"hex": "#CD853F", "name": "Peru"},
            {"hex": "#D2B48C", "name": "Tan"},
            {"hex": "#C2B280", "name": "Sand"},
            {"hex": "#BDB76B", "name": "Dark Khaki"},
            {"hex": "#C3A36E", "name": "Camel Beige"},
            {"hex": "#CBB67C", "name": "Golden Beige"},
            {"hex": "#BBA67D", "name": "Mink"},
            {"hex": "#A79877", "name": "Stone Beige"},
            {"hex": "#B6A27D", "name": "Dusty Tan"},
            {"hex": "#C2AD92", "name": "Oat Beige"},
            {"hex": "#B5A27B", "name": "Khaki Taupe"},
            {"hex": "#D1B88A", "name": "Buff"},
            {"hex": "#C1AA80", "name": "Honey Beige"},
            {"hex": "#B19F76", "name": "Sand Dune"},
            {"hex": "#A89472", "name": "Sahara"},
            {"hex": "#BDA66E", "name": "Warm Khaki"},
            {"hex": "#C4AE78", "name": "Fawn Beige"},
            {"hex": "#B39B6D", "name": "Golden Taupe"}
        ]
    }

}

def get_avoid_colors():
    return {
        "Fair": {
            "Cool": [
                {"hex": "#F57C00", "name": "Strong Orange"},
                {"hex": "#FBC02D", "name": "Golden Yellow"},
                {"hex": "#FF5252", "name": "Hot Pink"},
                {"hex": "#FF8F00", "name": "Bold Tangerine"}
            ],
            "Fair Cool": [
                {"hex": "#F50057", "name": "Electric Rose"},
                {"hex": "#D500F9", "name": "Bright Violet"},
                {"hex": "#FF4081", "name": "Neon Pink"},
                {"hex": "#C51162", "name": "Vivid Magenta"}
            ],
            "Deep Warm": [
                {"hex": "#FFD600", "name": "Neon Yellow"},
                {"hex": "#FF6F00", "name": "Vivid Orange"},
                {"hex": "#C62828", "name": "Strong Red"},
                {"hex": "#F9A825", "name": "Bold Mustard"}
            ],
            "Warm": [
                {"hex": "#D84315", "name": "Rust Orange"},
                {"hex": "#6A1B9A", "name": "Deep Purple"},
                {"hex": "#FF6F00", "name": "Neon Orange"},
                {"hex": "#C2185B", "name": "Fuchsia"}
            ],
            "Cool Neutral": [
                {"hex": "#D50000", "name": "Neon Red"},
                {"hex": "#FF1744", "name": "Electric Pink"},
                {"hex": "#880E4F", "name": "Dark Berry"},
                {"hex": "#FFAB00", "name": "Bright Mustard"}
            ],
            "Neutral": [
                {"hex": "#E53935", "name": "Harsh Red"},
                {"hex": "#F50057", "name": "Neon Magenta"},
                {"hex": "#FFAB00", "name": "Loud Gold"},
                {"hex": "#E65100", "name": "Dark Tangerine"}
            ]
        },
        "Light": {
            "Cool": [
                {"hex": "#FF4081", "name": "Neon Pink"},
                {"hex": "#F50057", "name": "Electric Rose"},
                {"hex": "#FF6F00", "name": "Sharp Orange"},
                {"hex": "#C51162", "name": "Crimson Pink"}
            ],
            "Fair Cool": [
                {"hex": "#F8BBD0", "name": "Pale Pink"},
                {"hex": "#BBDEFB", "name": "Soft Sky Blue"},
                {"hex": "#E1BEE7", "name": "Lilac Glow"},
                {"hex": "#B2EBF2", "name": "Mint Tint"}
            ],
            "Deep Warm": [
                {"hex": "#F57C00", "name": "Strong Orange"},
                {"hex": "#C62828", "name": "Bold Red"},
                {"hex": "#F9A825", "name": "Mustard"},
                {"hex": "#F44336", "name": "Fiery Coral"}
            ],
            "Warm": [
                {"hex": "#FF5722", "name": "Hot Rust"},
                {"hex": "#D84315", "name": "Deep Orange"},
                {"hex": "#6A1B9A", "name": "Eggplant"},
                {"hex": "#C62828", "name": "Harsh Red"}
            ],
            "Cool Neutral": [
                {"hex": "#FF5252", "name": "Neon Red"},
                {"hex": "#D500F9", "name": "Violet Shock"},
                {"hex": "#FFAB00", "name": "Golden Pop"},
                {"hex": "#E65100", "name": "Dark Tangerine"}
            ],
            "Neutral": [
                {"hex": "#FF4081", "name": "Bright Pink"},
                {"hex": "#E91E63", "name": "Vivid Rose"},
                {"hex": "#FFA000", "name": "Bold Amber"},
                {"hex": "#C62828", "name": "Strong Crimson"}
            ]
        },
        "Medium": {
            "Cool": [
                {"hex": "#FF4081", "name": "Fuchsia"},
                {"hex": "#EC407A", "name": "Hot Pink"},
                {"hex": "#FF8F00", "name": "Burning Orange"},
                {"hex": "#D32F2F", "name": "Dark Crimson"}
            ],
            "Fair Cool": [
                {"hex": "#FCE4EC", "name": "Blush Pink"},
                {"hex": "#E3F2FD", "name": "Ice Blue"},
                {"hex": "#EDE7F6", "name": "Lavender Mist"},
                {"hex": "#E0F7FA", "name": "Aqua Whisper"}
            ],
            "Deep Warm": [
                {"hex": "#F57C00", "name": "Loud Orange"},
                {"hex": "#FF5252", "name": "Strong Coral"},
                {"hex": "#F44336", "name": "Fiery Red"},
                {"hex": "#FFC107", "name": "Bright Amber"}
            ],
            "Warm": [
                {"hex": "#4A148C", "name": "Dark Violet"},
                {"hex": "#FF3D00", "name": "Flame"},
                {"hex": "#AD1457", "name": "Harsh Berry"},
                {"hex": "#E53935", "name": "Brick Red"}
            ],
            "Cool Neutral": [
                {"hex": "#FF1744", "name": "Neon Red"},
                {"hex": "#FF6F00", "name": "Bold Tangerine"},
                {"hex": "#880E4F", "name": "Magenta"},
                {"hex": "#F50057", "name": "Rose Glow"}
            ],
            "Neutral": [
                {"hex": "#D50000", "name": "Loud Red"},
                {"hex": "#FF5252", "name": "Hot Coral"},
                {"hex": "#B71C1C", "name": "Deep Blood"},
                {"hex": "#F57F17", "name": "Harsh Yellow"}
            ]
        },
        "Olive": {
            "Cool": [
                {"hex": "#F50057", "name": "Flamingo"},
                {"hex": "#C2185B", "name": "Raspberry"},
                {"hex": "#FF7043", "name": "Bold Coral"},
                {"hex": "#EF6C00", "name": "Dark Orange"}
            ],
            "Fair Cool": [
                {"hex": "#FCE4EC", "name": "Soft Blush"},
                {"hex": "#E1BEE7", "name": "Lavender"},
                {"hex": "#B3E5FC", "name": "Baby Blue"},
                {"hex": "#DCEDC8", "name": "Mint Cream"}
            ],
            "Deep Warm": [
                {"hex": "#F44336", "name": "Scarlet"},
                {"hex": "#E91E63", "name": "Bright Pink"},
                {"hex": "#FFAB00", "name": "Vivid Yellow"},
                {"hex": "#F06292", "name": "Hot Rose"}
            ],
            "Warm": [
                {"hex": "#D50000", "name": "Loud Red"},
                {"hex": "#C51162", "name": "Vivid Magenta"},
                {"hex": "#B71C1C", "name": "Deep Blood"},
                {"hex": "#FF5252", "name": "Hot Coral"}
            ],
            "Cool Neutral": [
                {"hex": "#FF1744", "name": "Neon Berry"},
                {"hex": "#F44336", "name": "Crimson"},
                {"hex": "#F9A825", "name": "Harsh Yellow"},
                {"hex": "#FF3D00", "name": "Intense Orange"}
            ],
            "Neutral": [
                {"hex": "#FF6F00", "name": "Strong Orange"},
                {"hex": "#D500F9", "name": "Electric Purple"},
                {"hex": "#C62828", "name": "Bold Red"},
                {"hex": "#FFC400", "name": "Neon Gold"}
            ]
        },
        "Brown": {
            "Cool": [
                {"hex": "#EC407A", "name": "Hot Pink"},
                {"hex": "#E91E63", "name": "Vivid Rose"},
                {"hex": "#F06292", "name": "Rose Punch"},
                {"hex": "#FBC02D", "name": "Bold Gold"}
            ],
            "Fair Cool": [
                {"hex": "#F3E5F5", "name": "Lavender Mist"},
                {"hex": "#E1F5FE", "name": "Pale Blue"},
                {"hex": "#F8BBD0", "name": "Light Pink"},
                {"hex": "#DCEDC8", "name": "Pastel Mint"}
            ],
            "Deep Warm": [
                {"hex": "#E53935", "name": "Sharp Red"},
                {"hex": "#FF1744", "name": "Neon Red"},
                {"hex": "#FF6F00", "name": "Neon Orange"},
                {"hex": "#F9A825", "name": "Bright Yellow"}
            ],
            "Warm": [
                {"hex": "#FF4081", "name": "Electric Pink"},
                {"hex": "#F44336", "name": "Hot Lava"},
                {"hex": "#D84315", "name": "Sharp Rust"},
                {"hex": "#FF6F00", "name": "Loud Orange"}
            ],
            "Cool Neutral": [
                {"hex": "#FF5252", "name": "Bright Red"},
                {"hex": "#E040FB", "name": "Shock Violet"},
                {"hex": "#D32F2F", "name": "Crimson"},
                {"hex": "#FFA000", "name": "Bright Amber"}
            ],
            "Neutral": [
                {"hex": "#FF4081", "name": "Bright Pink"},
                {"hex": "#F50057", "name": "Neon Magenta"},
                {"hex": "#E65100", "name": "Dark Orange"},
                {"hex": "#D500F9", "name": "Vivid Purple"}
            ]
        },
        "Dark": {
            "Cool": [
                {"hex": "#FFD600", "name": "Loud Yellow"},
                {"hex": "#FFA000", "name": "Bright Amber"},
                {"hex": "#FFEB3B", "name": "Sunbeam"},
                {"hex": "#F44336", "name": "Bright Red"}
            ],
            "Fair Cool": [
                {"hex": "#F8BBD0", "name": "Light Rose"},
                {"hex": "#E1BEE7", "name": "Lilac"},
                {"hex": "#B3E5FC", "name": "Soft Sky"},
                {"hex": "#DCEDC8", "name": "Pastel Mint"}
            ],
            "Deep Warm": [
                {"hex": "#FDD835", "name": "Pale Yellow"},
                {"hex": "#FFC107", "name": "Harsh Gold"},
                {"hex": "#FF5722", "name": "Burnt Orange"},
                {"hex": "#FF7043", "name": "Sharp Peach"}
            ],
            "Warm": [
                {"hex": "#EF5350", "name": "Intense Coral"},
                {"hex": "#FF4081", "name": "Fuchsia"},
                {"hex": "#EC407A", "name": "Neon Pink"},
                {"hex": "#E65100", "name": "Sharp Orange"}
            ],
            "Cool Neutral": [
                {"hex": "#D500F9", "name": "Electric Purple"},
                {"hex": "#FF3D00", "name": "Flare"},
                {"hex": "#FF5252", "name": "Neon Coral"},
                {"hex": "#D32F2F", "name": "Deep Crimson"}
            ],
            "Neutral": [
                {"hex": "#F50057", "name": "Hot Magenta"},
                {"hex": "#FF1744", "name": "Neon Berry"},
                {"hex": "#FFC400", "name": "Harsh Yellow"},
                {"hex": "#E53935", "name": "Bright Crimson"}
            ]
        }
    }


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
        if not faces:
            os.remove(temp_path)
            raise HTTPException(status_code=400, detail="No face detected in the image.")

        face = faces[0]
        accuracy = float(face.get("accuracy", 0))
        if accuracy < 75:
            os.remove(temp_path)
            raise HTTPException(status_code=400, detail="Face detected, but confidence too low.")

        hex_color = face.get("skin_tone", "#ffffff")
        tone_label = face.get("tone_label", "Unknown")
        face_id = face.get("face_id", "Unknown")
        tone_info = map_tone_label_to_season(tone_label)
        tone_season = tone_info["season"]
        tone_undertone = tone_info["undertone"]
        skin_tone_label = hex_to_skin_tone(hex_color)
        color_sets = map_undertone_season_to_colors(tone_undertone, skin_tone_label)

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

