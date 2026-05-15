# 🌟 ANGELIC – AI-Powered Skin Tone & Face Shape Analysis

> **ANGELIC** is a full-stack AI-driven styling assistant that analyzes facial features and skin tone from user images to deliver personalized fashion, color, and grooming recommendations. The system combines computer vision, machine learning, and modern web technologies to provide accurate, explainable, and user-centric styling insights.

**Purpose**
Help users understand *what suits them*—based on measurable facial attributes, skin tone classification, and seasonal color theory—instead of generic fashion advice.

**Key Highlights**

* Face shape detection using facial landmarks
* Skin tone classification using color-space analysis
* Personalized color recommendations (suitable & avoid)
* AI-powered chatbot for styling guidance
* Secure authentication and scalable backend

---

## 🧰 Tech Stack

### 🎨 Frontend
- ⚛️ **React.js** – Component-based UI
- ⚡ **Vite** – Fast development and build tooling
- 🎞️ **Framer Motion** – Smooth UI animations
- 🎨 **CSS / Modern UI Practices**

### 🖥️ Backend
- 🟢 **Node.js** – REST API & authentication layer
- 🚀 **Express.js** – Backend routing and middleware
- 🐍 **Python (FastAPI)** – ML inference & chatbot services
- 🔐 **JWT Authentication** – Secure user sessions

### 🧠 Machine Learning & Computer Vision
- 👁️ **Facial Landmark Detection** – Face shape analysis
- 🎨 **Skin Tone Classification** – RGB → HLS color-space mapping
- 🌈 **Seasonal Color Theory Mapping** – Suitable & avoid palettes
- 📦 **skin-tone-classifier** – Skin color extraction
- 🌲 **Random Forest** – Trained classification model

### 🗄️ Database & Storage
- 🍃 **MongoDB** – User data & analysis history
- ☁️ **Cloudinary** – Image storage & optimization

### 🤖 AI & Integrations
- 💬 **OpenRouter API** – AI-powered styling chatbot
- 🧠 **Gemma Model** – Conversational fashion guidance

### ⚙️ DevOps & Tools
- 🌐 **Vercel** – Frontend deployment
- 🛠️ **Render** – Backend & ML service hosting
- 🔁 **Git & GitHub** – Version control
- 🧪 **Postman** – API testing
- 🔐 **dotenv** – Environment variable management

## 📑 Table of Contents

* [Installation & Setup](#-installation--setup)
* [Usage](#-usage)
* [Features](#-features)
* [Project Structure](#-project-structure)
* [Tests](#-tests)
* [Contributing Guidelines](#-contributing-guidelines)
* [Credits / Authors](#-credits--authors)
* [License](#-license)

---

## 🛠️ Installation & Setup

### Prerequisites

* Node.js (v18+ recommended)
* Python 3.9
* MongoDb
* Git

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Vivek-DK/angelic.git
cd angelic
```

### 2️⃣ Backend – Node.js API Setup

```bash
cd backend/node
npm install
```

Create a `.env` file:


```env
# Server
PORT=5000

# Database
MONGO_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=your_jwt_secret_key

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# External APIs
RAPIDAPI_KEY=your_rapidapi_key

# Email Service
MAIL_USER=your_email_address
MAIL_PASS=your_email_app_password

```

Start the server:

```bash
npm run dev
```

### 3️⃣ Backend – Python ML Service Setup

```bash
cd backend/python
python -m venv venv
source venv/bin/activate   # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
```
Create a `.env` file:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Run the FastAPI server:

```bash
uvicorn main:app --reload
```

### 4️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## ▶️ Usage

### Application Flow

1. User uploads an image
2. Backend validates image and detects face
3. Facial landmarks are extracted
4. Skin tone is classified using RGB → HLS mapping
5. Face shape and tone are mapped to style rules
6. Personalized recommendations are returned

### 📸 Demo Images
---
## Landing Page
![image alt](https://github.com/Vivek-DK/angelic/blob/246eccc52bb25c29fd90b16ca8eb530bd44ffde5/screenshots/home_page.png)

--- 

## Image Upload & Analysis
![image alt](https://github.com/Vivek-DK/angelic/blob/246eccc52bb25c29fd90b16ca8eb530bd44ffde5/screenshots/Analysis_page.png)

--- 

## Results & Recommendations
![image alt](https://github.com/Vivek-DK/angelic/blob/246eccc52bb25c29fd90b16ca8eb530bd44ffde5/screenshots/result.jpeg)

--- 

## Chatbot Interaction
![image alt](https://github.com/Vivek-DK/angelic/blob/246eccc52bb25c29fd90b16ca8eb530bd44ffde5/screenshots/chat_bot.png)

---

## ✨ Features

### 🎯 Face Shape Analysis

* Uses facial landmarks and geometric ratios
* Supports common shapes: Oval, Round, Square, Heart, Diamond

### 🎨 Skin Tone Detection

* Extracts dominant skin color from facial regions
* Converts RGB → HLS color space
* Classifies tone: Fair, Light, Medium, Olive, Brown, Dark

### 🎭 Seasonal Color Mapping

* Maps skin tone + undertone to seasonal palettes
* Returns **suitable** and **avoid** color suggestions

### 🤖 AI Styling Chatbot

* Built with FastAPI
* Powered by OpenRouter (Gemma model)
* Answers fashion, grooming, and styling queries

### 🔐 Secure Backend

* JWT-based authentication
* Modular Node.js API design

---

## 🗂️ Project Structure

```
backend/
├── node/
│   ├── log/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── db.js
│   ├── package.json
│   └── .env
│
├── python/
│   ├── chatbot/
│   ├── Face_Shape/
│   ├── models/
│   ├── static/
│   ├── Trained_models/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
frontend/
├── src/
├── public/
└── package.json
```

---

## 🧪 Tests

Currently, testing is performed manually during development.

Planned improvements:

* Unit tests for skin tone classification logic
* API endpoint tests using PyTest and Supertest

---

## 🤝 Contributing Guidelines

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`feature/your-feature`)
3. Commit changes with clear messages
4. Open a pull request with a detailed description

For major changes, please open an issue first to discuss.

---

## 👥 Credits / Authors

* **Vivek DK** – Full Stack Developer & MERN Stack
* Open-source libraries and research papers used for facial analysis

---

## 📜 License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this software with proper attribution.
