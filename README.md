# 📝 Todo App

A modern Full Stack Task Management application built using **React (Vite)** for the frontend and **FastAPI** for the backend. The application allows users to register, log in, create tasks, manage reminders, and track task completion efficiently.

## 🚀 Features

### Authentication

* User Registration
* User Login
* Secure Password Hashing
* JWT Authentication
* Protected Routes

### Task Management

* Create Tasks
* Update Tasks
* Delete Tasks
* Mark Tasks as Complete
* Task Filtering
* Task Search

### Reminders

* Schedule Task Reminders
* Automatic Reminder Processing
* Reminder Status Tracking

### User Experience

* Responsive Design
* Toast Notifications
* Loading States
* Confirmation Dialogs
* Modern UI Components

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* React Router

### Backend

* FastAPI
* SQLAlchemy
* SQLite
* Pydantic
* JWT Authentication

### Deployment

* Frontend: Vercel
* Backend: Render

---

## 📂 Project Structure

```text
todo-app/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── repositories/
│   ├── services/
│   ├── schemas/
│   ├── utils/
│   ├── tests/
│   ├── main.py
│   └── requirements.txt
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/GothamAnupa/todo-app.git
cd todo-app
```

---

## Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Run Backend:

```bash
uvicorn backend.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API Documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Environment Variables

### Frontend (.env)

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

### Production

```env
VITE_API_URL=https://your-render-backend-url.onrender.com/api/v1
```

---

## API Endpoints

### Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
```

### Tasks

```http
GET    /api/v1/tasks
POST   /api/v1/tasks
PUT    /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
```

### Health Check

```http
GET /api/v1/health
```

---

## 🧪 Testing

Run backend tests:

```bash
pytest
```



## 🌟 Future Enhancements

* Email Notifications
* Dark Mode
* Task Categories
* Due Date Calendar View
* Team Collaboration
* Cloud Database Support

---

## 👨‍💻 Author

**Gotham Anupa**

* GitHub: https://github.com/GothamAnupa
* LinkedIn: https://www.linkedin.com/in/gotham-anupa

---

## 📄 License

This project is licensed under the MIT License.
