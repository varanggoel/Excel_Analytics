# Excel Analytics Platform

A full-stack web application for uploading, processing, and visualizing Excel data with user authentication and admin controls.

## Features

* Upload and manage `.xls` / `.xlsx` files
* Interactive 2D and 3D visualizations
* Secure authentication using JWT
* User dashboard with analytics and file insights
* Admin panel for user and system management
* Real-time data updates
* Fully responsive interface built with Tailwind CSS

## Technology Stack

### Frontend
* React with TypeScript
* Tailwind CSS
* Chart.js, Three.js
* Axios

### Backend
* Node.js with Express
* MongoDB with Mongoose
* JWT for authentication
* Multer for file uploads
* SheetJS (`xlsx`) for Excel processing

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd excel-analytics-platform
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Create an `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb://localhost:27017/excel-analytics
JWT_SECRET=your_jwt_secret
PORT=5001
FRONTEND_URL=http://localhost:3000
```

### 4. Start MongoDB

```bash
mongod --dbpath ~/data/db
```

### 5. Start the backend and frontend servers

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd frontend
npm start
```

**Access the application at:**
- Frontend – `http://localhost:3000`
- Backend – `http://localhost:5001`

## API Endpoints

### Authentication
* `POST /api/auth/register` – Register a new user
* `POST /api/auth/login` – User login

### File Management
* `POST /api/files/upload` – Upload an Excel file
* `GET /api/files` – Retrieve user files
* `DELETE /api/files/:id` – Delete a file

### Analytics
* `POST /api/analytics` – Create analytics
* `GET /api/analytics` – View analytics
* `PUT /api/analytics/:id` – Update analytics

### Admin
* `GET /api/users` – List all users
* `PUT /api/users/:id` – Update user information
* `DELETE /api/users/:id` – Remove a user

## Deployment

### Backend
* Set environment variables on your hosting platform
* Connect to a remote MongoDB instance
* Deploy to Heroku, Railway, or DigitalOcean

### Frontend
* Build the frontend:

```bash
npm run build
```

* Deploy to Vercel, Netlify, or AWS S3

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
