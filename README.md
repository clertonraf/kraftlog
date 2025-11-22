# KraftLog 💪

A modern fitness tracking application built with React Native and Expo, designed to help users log their workouts, track exercises, and monitor their fitness progress.

## Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Secure token storage with AsyncStorage
- Admin and regular user roles

### 🏋️ Exercise Management
- Browse comprehensive exercise library
- Search exercises by name
- Filter by muscle groups (Chest, Back, Shoulders, Arms, Legs, Core, etc.)
- View exercise demonstrations via embedded YouTube videos
- **Admin only**: Import exercises from PDF files
- **Admin only**: Edit and delete exercises

### 📱 Cross-Platform Support
- iOS native app
- Android native app
- Progressive Web App (PWA)

### 🎨 Modern UI/UX
- Clean, intuitive interface
- Safe area handling for notched devices (Dynamic Island, notches)
- Smooth animations and haptic feedback
- Responsive design for all screen sizes

## Tech Stack

### Frontend
- **Framework**: React Native with Expo (~54.0)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Styling**: React Native StyleSheet
- **HTTP Client**: Axios
- **Video Player**: react-native-youtube-iframe

### Backend
- **Backend Repository**: [KraftLogApi](https://github.com/your-repo/KraftLogApi)
- **API**: Spring Boot REST API
- **Database**: PostgreSQL (Docker)
- **Authentication**: JWT tokens

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator
- Docker (for backend database)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/kraftlog.git
   cd kraftlog
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure backend URL**

   Update the API base URL in `services/api.ts` if needed:
   ```typescript
   baseURL: 'http://localhost:8080/api'
   ```

4. **Start the backend**

   Follow instructions in the [KraftLogApi](https://github.com/your-repo/KraftLogApi) repository to:
   - Start PostgreSQL with Docker
   - Run the Spring Boot application
   - Ensure it's running on `http://localhost:8080`

## Running the App

### Development Mode

```bash
npx expo start
```

Then choose your platform:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for Web browser

### Platform-Specific Commands

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
kraftlog/
├── app/                    # File-based routing (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── explore.tsx    # Exercise library
│   │   ├── index.tsx      # Home/Dashboard
│   │   └── _layout.tsx    # Tab layout
│   ├── login.tsx          # Login screen
│   ├── register.tsx       # Registration screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   └── EditExerciseModal.tsx
├── contexts/              # React Context providers
│   └── AuthContext.tsx    # Authentication state
├── services/              # API services
│   ├── api.ts            # Axios configuration
│   ├── authService.ts    # Authentication API
│   └── exerciseService.ts # Exercise management API
├── constants/             # App constants and theme
├── assets/               # Images, fonts, icons
└── package.json          # Dependencies

```

## Default Users

The backend comes with default users:

**Admin User**:
- Email: `admin@kraftlog.com`
- Password: `admin123`
- Permissions: Full access (import, edit, delete exercises)

**Regular User** (create via registration):
- Permissions: View-only access to exercises

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## Key Features Guide

### For Regular Users
1. **Browse Exercises**: View all exercises with videos
2. **Search**: Find exercises by name
3. **Filter**: Sort by muscle groups
4. **Watch Videos**: Click video icon to view demonstrations

### For Admin Users
All regular user features plus:
1. **Import Exercises**: Upload PDF files with exercise lists
2. **Edit Exercises**: Click any exercise card to edit details
3. **Delete Exercises**: Remove exercises from the library
4. **Manage Videos**: Add/update YouTube video links

## API Endpoints

The app connects to these backend endpoints:

- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /exercises` - Fetch all exercises
- `GET /muscles` - Fetch muscle groups
- `POST /admin/exercises/import-pdf` - Import exercises (admin)
- `PUT /admin/exercises/:id` - Update exercise (admin)
- `DELETE /admin/exercises/:id` - Delete exercise (admin)

## Troubleshooting

### Clear Cached Data (Web)

If you experience issues with cached user data:

```javascript
// Open browser console and run:
localStorage.clear()
// Then reload the page
```

### Backend Connection Issues

Ensure:
1. Backend is running on `http://localhost:8080`
2. PostgreSQL Docker container is running
3. CORS is properly configured in backend

### iOS Build Issues

```bash
cd ios
pod install
cd ..
npm run ios
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ using Expo and React Native
