# GetHired 🚀

**GetHired** is an AI-powered recruitment platform designed to connect students with the most relevant internship opportunities. By utilizing a **FastAPI** backend and a **Next.js** frontend, the application provides a high-performance, real-time recommendation system based on a student’s unique skill profile and career goals.

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router, Tailwind CSS, Lucide-React)
- **Backend:** FastAPI (Asynchronous Python framework)
- **Database:** PostgreSQL
- **Machine Learning:** Scikit-learn (TF-IDF Vectorizer & Cosine Similarity)
- **State Management:** React Context API / Hooks

## 📂 Project Structure

GetHired/
├── client/              # Next.js frontend application
│   ├── public/          # Static assets
│   └── src/             # Frontend source code
├── server/              # FastAPI backend application
│   ├── api/             # API endpoints and routes
│   ├── core/            # Security, JWT, and Config
│   ├── models/          # Database schemas
│   └── main.py          # Application entry point
├── ml_engine/           # Machine Learning logic & model files
├── requirements.txt     # Python dependencies
└── package.json         # Frontend dependencies

## ✨ Key Features

- **Personalized Recommendations:** An ML-driven engine that ranks jobs based on text similarity between user resumes and job descriptions.
- **Unified Dashboard:** Aggregated internship listings from multiple sources in a single, responsive view.
- **Async Processing:** FastAPI ensures that heavy ML similarity calculations don't block the user experience.
- **Modern UI/UX:** A clean, dark-themed interface built with Tailwind CSS for rapid job discovery.

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### 2. Backend Setup
Go to the server directory:
`cd server`

Create and activate virtual environment:
`python -m venv venv`
`source venv/bin/activate` (Windows: `.\venv\Scripts\activate`)

Install dependencies:
`pip install -r requirements.txt`

Run the server:
`uvicorn main:app --reload`

### 3. Frontend Setup
Go to the client directory:
`cd client`

Install dependencies:
`npm install`

Run the development server:
`npm run dev`

Navigate to http://localhost:3000 to view the app.

## 🧠 Machine Learning Overview
The recommendation engine works by:
1. Preprocessing: Cleaning student profiles and internship descriptions.
2. Vectorization: Converting text into numerical representations using TF-IDF.
3. Similarity: Computing Cosine Similarity to find the closest match between the user's vector and available job vectors.



## 🤝 Contributing
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---
**Developed by [Kanishq Dhangar](https://github.com/kanishqdhangar) [Khushi Kumari](https://github.com/Khushi-Kumari947)**
