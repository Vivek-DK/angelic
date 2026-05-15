from PIL import Image

def extract_face(image_path: str):
    """
    Dummy face extractor.
    In real version, use dlib/mediapipe.
    """
    try:
        face_img = Image.open(image_path)
        return face_img
    except:
        return None
