# ✨ ANGELIC — AI Fashion Recommendation System

> An AI-powered fashion intelligence platform that analyzes facial structure, skin tone, undertone, and seasonal palette to deliver personalized styling recommendations in real time.

<br/>

---

# 🌐 Live Demo

🔗 Live Website:  
https://angelic-viv.vercel.app/

📦 GitHub Repository:  
https://github.com/Vivek-DK/angelic

---

# 🧠 Project Vision

ANGELIC was built to bridge the gap between:

- Artificial Intelligence
- Fashion Styling
- Personal Appearance Analysis
- Real-Time User Interaction

Instead of generic fashion suggestions, the platform provides:

✔ Personalized color recommendations  
✔ Face-shape based styling guidance  
✔ Seasonal fashion palette detection  
✔ AI-driven fashion assistant  
✔ Real-time analysis experience  

This project combines:
- Computer Vision
- Machine Learning
- Full Stack Engineering
- Cloud Infrastructure
- Real-Time Systems

into a single scalable application.

---

# 🚀 Core Features

## 🎨 Skin Tone Detection

Analyzes:
- skin tone
- undertone
- seasonal palette

using image processing and ML models.

### Detects:
- Warm Undertone
- Cool Undertone
- Neutral Undertone

### Seasonal Analysis:
- Summer
- Winter
- Autumn
- Spring

---

## 👤 Face Shape Analysis

Uses facial landmark detection to identify:

- Oval
- Round
- Square
- Heart
- Diamond
- Oblong

Provides:
- hairstyle guidance
- outfit recommendations
- accessory suggestions

based on face structure.

---

## 🤖 AI Fashion Assistant

Integrated AI chatbot powered by LLM APIs.

### Capabilities:
- outfit recommendations
- color matching advice
- styling suggestions
- seasonal dressing tips
- fashion Q&A

### Restrictions:
The assistant is intentionally restricted to:
- fashion
- styling
- wardrobe
- appearance guidance

to maintain domain specialization.

---

## ☁ AWS S3 Cloud Image Storage

Implemented secure cloud storage using:

- AWS S3
- Signed URLs
- Secure upload pipeline

### Benefits:
✔ Secure uploads  
✔ Faster delivery  
✔ Scalable architecture  
✔ Reduced backend load  

---

## ⚡ Image Optimization Pipeline

Before analysis:

- images are compressed
- resized
- converted to JPEG

using browser-side optimization.

### Impact:
✔ Reduced upload payload size by up to 70%  
✔ Faster uploads  
✔ Better user experience  
✔ Reduced API processing time  

---

## 🔔 Real-Time Notifications

Implemented using:
- Socket.IO
- WebSockets

### Features:
- live notifications
- fashion tips
- AI assistant alerts
- real-time user interaction

without requiring manual refresh.

---

## 📊 Analysis History Dashboard

Users can:
- save analysis
- view previous reports
- fetch personalized recommendations
- revisit color palettes

with cloud-stored image retrieval.

---

# 🏗 System Architecture

```bash
Frontend (React.js)
        │
        ▼
Node.js + Express API
        │
        ├── Authentication
        ├── History Management
        ├── AWS S3 Upload Service
        ├── Socket.IO Notifications
        │
        ▼
FastAPI ML Service
        │
        ├── Skin Tone Detection
        ├── Face Shape Analysis
        ├── Fashion AI Assistant
        │
        ▼
MongoDB Database
```
---

# 🧰 TECH STACK

FRONTEND
• React.js
• Framer Motion
• Tailwind CSS
• Axios
• React Router
• React Toastify

BACKEND
• Node.js
• Express.js
• FastAPI
• Socket.IO
• JWT Authentication
• Joi Validation

AI / ML
• Python
• OpenCV
• Facial Landmark Detection
• Image Processing
• LLM APIs

DATABASE & CLOUD
• MongoDB
• AWS S3
• Signed URL Uploads

DEPLOYMENT
• Vercel
• Render

---

# 🔐 SECURITY & BACKEND ENGINEERING

Implemented production-style backend security practices:

✔ JWT Authentication
✔ Protected Routes
✔ Request Validation
✔ Rate Limiting
✔ Secure AWS S3 Signed URLs
✔ Input Sanitization
✔ Error Handling Middleware
✔ Secure API Architecture

---

# 📁 Folder Structure

```bash
ANGELIC/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── context/
│   └── utils/
│
├── backend/
│   │
│   ├── node/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   └── utils/
│   │
│   └── python/
│       ├── routes/
│       ├── ML/
│       └── services/
│
└── README.md
```

# ⚙ INSTALLATION & SETUP

1️⃣ CLONE REPOSITORY

git clone https://github.com/Vivek-DK/angelic.git

2️⃣ INSTALL FRONTEND

cd frontend

npm install

npm run dev

3️⃣ INSTALL NODE BACKEND

cd backend/node

npm install

npm run dev

4️⃣ INSTALL PYTHON BACKEND

cd backend/python

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload

---

# 🔑 ENVIRONMENT VARIABLES

FRONTEND (.env)

VITE_NODE_API_URL=

VITE_PYTHON_API_URL=

NODE BACKEND (.env)

PORT=

MONGO_URI=

JWT_SECRET=

AWS_ACCESS_KEY_ID=

AWS_SECRET_ACCESS_KEY=

AWS_REGION=

AWS_BUCKET_NAME=

PYTHON BACKEND (.env)

OPENROUTER_API_KEY=

---

# 📈 ENGINEERING HIGHLIGHTS

FULL STACK ENGINEERING

✔ React + Node.js + FastAPI Integration
✔ REST API Architecture
✔ Microservice-Based Backend Design
✔ Secure Authentication System
✔ Cloud-Based Image Storage

PERFORMANCE OPTIMIZATION

✔ Browser-Side Image Compression
✔ Reduced Upload Payload Size
✔ Optimized API Processing Flow
✔ Faster Upload & Analysis Experience

REAL-TIME SYSTEMS

✔ WebSocket Integration
✔ Live Notifications
✔ Interactive UI Updates
✔ Real-Time User Communication

AI INTEGRATION

✔ Fashion-Focused AI Chatbot
✔ Facial Analysis Pipeline
✔ Personalized Recommendation Engine
✔ Skin Tone & Face Shape Detection

---

# 🧪 FUTURE IMPROVEMENTS

• Virtual Outfit Try-On
• AI Hairstyle Preview
• Fashion Recommendation Feed
• Multi-Image Comparison
• Personalized Wardrobe Planner
• Recommendation Analytics
• Mobile Application Support

---

# 👨‍💻 DEVELOPER

Vivek D K

Full Stack Developer focused on:

• Scalable Backend Systems
• AI-Integrated Applications
• Cloud-Based Architectures
• Modern Frontend Engineering
• Real-Time Web Applications

CONNECT

LinkedIn
https://www.linkedin.com/

GitHub
https://github.com/Vivek-DK

--- 

# ⭐ FINAL NOTE

ANGELIC is not just a UI-based fashion website.

It is a complete AI-integrated engineering project combining:

✔ Machine Learning
✔ Cloud Infrastructure
✔ Real-Time Systems
✔ Full Stack Development
✔ Scalable Architecture
✔ AI-Based Recommendation Systems

into a production-style application experience.
