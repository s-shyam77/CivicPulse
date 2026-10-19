# CivicPulse 🌍

**Making civic issue reporting simpler, smarter, and more accessible.**

CivicPulse is a web application designed to help people report civic issues and organize information about local problems through a digital platform. The project aims to make civic issue reporting easier and support better visibility of reported problems.

## ✨ Features

- 📝 **Issue Reporting** — Submit civic issues through the web interface.
- 📋 **Issue Listing** — View reported issues in one place.
- 📷 **Photo Support** — Support for attaching photos to issue reports.
- 🔌 **REST API** — Backend endpoints for handling issue data.
- 🗄️ **SQLite Database** — Local database storage for project data.
- 🖥️ **Responsive Web Interface** — A React-based frontend.

*Note: Features may depend on the current implementation and configuration.*

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- SQLite
- REST API

## 📁 Project Structure

```text
CivicPulse/
├── backend/
│   ├── server.js
│   └── ...
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/s-shyam77/CivicPulse.git
cd CivicPulse
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Configure the environment variables required by the backend in a local `.env` file. Never commit credentials or secrets to GitHub.

Start the backend using the start command configured in `backend/package.json`. If the project uses `server.js` directly, you can run:

```bash
node server.js
```

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## 🔗 Repository

[View CivicPulse on GitHub](https://github.com/s-shyam77/CivicPulse)

## 🎯 Project Goal

CivicPulse explores how web technologies can be used to make civic issue reporting more accessible and organized. It is a learning and development project focused on frontend development, backend APIs, and database integration.

## 👨‍💻 Developer

**Shyam Lal Mali**

GitHub: [@s-shyam77](https://github.com/s-shyam77)

---

⭐ If you find this project interesting, consider starring the repository!
