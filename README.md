# Excel Analytics Platform

A comprehensive MERN stack web application for uploading, analyzing, and visualizing Excel data with advanced analytics capabilities.

## 🚀 Features

- **File Upload & Management**: Drag-and-drop Excel file upload (.xls/.xlsx)
- **Data Visualization**: Interactive 2D charts (Chart.js) and 3D visualizations (Three.js)
- **User Authentication**: Secure JWT-based authentication system
- **Analytics Dashboard**: Real-time user statistics and data insights
- **Admin Panel**: User management and system analytics
- **Responsive Design**: Modern UI with Tailwind CSS
- **Real-time Updates**: Live data processing and visualization

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 with TypeScript
- **Tailwind CSS** 3.4.17 for styling
- **React Router** for navigation
- **Chart.js** for 2D data visualization
- **Three.js** for 3D graphics and visualizations
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **xlsx** (SheetJS) for Excel file processing
- **CORS** for cross-origin requests
- **Helmet** for security headers

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd excel-analytics-platform
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/excel-analytics
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5001
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start MongoDB**
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Or manually
   mongod --dbpath ~/data/db
   ```

6. **Start the Application**
   
   Backend (Terminal 1):
   ```bash
   cd backend
   npm start
   ```
   
   Frontend (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 📁 Project Structure

```
excel-analytics-platform/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication & validation
│   ├── uploads/         # File upload directory
│   └── server.js        # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── public/          # Static assets
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Files
- `POST /api/files/upload` - Upload Excel file
- `GET /api/files` - Get user files
- `DELETE /api/files/:id` - Delete file

### Analytics
- `POST /api/analytics` - Create analytics
- `GET /api/analytics` - Get user analytics
- `PUT /api/analytics/:id` - Update analytics

### Users (Admin only)
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🧪 Usage

1. **Register/Login**: Create an account or sign in
2. **Upload Files**: Drag and drop Excel files (.xls/.xlsx)
3. **Create Analytics**: Generate charts and visualizations from your data
4. **Dashboard**: View your analytics and file statistics
5. **Admin Features**: Manage users and system analytics (admin users)

## 🚀 Deployment

### Backend Deployment
1. Set up environment variables on your hosting platform
2. Configure MongoDB connection string
3. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy to platforms like Netlify, Vercel, or AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](#) - Add your deployment URL here
- [API Documentation](#) - Add your API docs URL here

## 📞 Support

For support, email your-email@example.com or create an issue in this repository.

---

**Built with ❤️ using the MERN Stack**
