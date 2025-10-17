from PIL import Image, ImageDraw

def generate_body(face_img: Image.Image, size: str, output_path: str):
    """
    Dummy body generator (draws a rectangle and pastes face).
    Replace with GAN/SD later.
    """
    body = Image.new("RGB", (400, 600), "white")
    draw = ImageDraw.Draw(body)

    if size == "tiny":
        body_shape = (150, 200, 250, 550)
    elif size == "medium":
        body_shape = (130, 180, 270, 570)
    elif size == "large":
        body_shape = (110, 160, 290, 590)
    else:  # x-large
        body_shape = (90, 140, 310, 600)

    draw.rectangle(body_shape, fill="lightblue")

    face_resized = face_img.resize((100, 100))
    body.paste(face_resized, (150, 80))

    body.save(output_path)
