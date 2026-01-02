# KraftLog 💪

A comprehensive fitness tracking application built with React Native and Expo, designed to help users create workout routines, log their training sessions, and track their fitness progress over time.

## Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Secure token storage
- Admin and regular user roles
- Role-based permissions

### 🏋️ Exercise Management
- Comprehensive exercise library with 250+ exercises
- Search exercises by name
- Filter by muscle groups (Chest, Back, Shoulders, Arms, Legs, Core, etc.)
- View exercise demonstrations via embedded YouTube videos
- Exercise details including sets, reps, and technique recommendations
- **Admin only**: Create new exercises
- **Admin only**: Import exercises from PDF files
- **Admin only**: Edit and delete exercises

### 📅 Routine Management
- Create custom workout routines
- Define routine duration (start/end dates)
- Add multiple workouts to each routine
- Set active routine for current training cycle
- View history of past routines
- Edit and delete routines

### 💪 Workout Planning
- Create workouts within routines
- Add exercises to workouts
- Define recommended weight, sets, and reps for each exercise
- Specify training techniques (SST, Gironda, GVT, etc.)
- Set rest intervals between exercises
- Organize workouts by day/order

### 📊 Workout Logging
- Log daily workout sessions
- Track actual weight and reps performed
- Record individual sets with rest times
- Add notes for each exercise
- Mark exercises and workouts as complete
- Track workout duration
- View workout history

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
- **Backend Repository**: [KraftLogApi](~/workspace/KraftLogApi)
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (Docker)
- **Authentication**: JWT tokens with Spring Security
- **Features**:
  - User management
  - Exercise library with muscle group mapping
  - Routine and workout management
  - Workout logging and progress tracking
  - PDF import for bulk exercise creation

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

   Follow these steps:
   
   a. Navigate to the backend directory:
   ```bash
   cd ~/workspace/KraftLogApi
   ```
   
   b. Start PostgreSQL with Docker:
   ```bash
   docker-compose up -d
   ```
   
   c. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   
   d. Verify it's running on `http://localhost:8080`

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
│   │   ├── routines.tsx   # Routine management (coming soon)
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
│   ├── exerciseService.ts # Exercise management API
│   ├── routineService.ts  # Routine & workout API
│   └── logService.ts      # Workout logging API
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
- `npm run lint` - Run Biome linter
- `npm run lint:fix` - Auto-fix safe linting issues
- `npm run lint:unsafe` - Auto-fix all linting issues (including unsafe)
- `npm run format` - Format code with Biome
- `npm run setup-hooks` - Install git pre-commit hooks
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and code formatting. 

- **Pre-commit hook**: Automatically lints and fixes code before each commit
- **Setup**: Run `npm run setup-hooks` or happens automatically on `npm install`
- **Documentation**: See [docs/LINTING.md](docs/LINTING.md) for detailed setup and usage
- **Current status**: 0 errors, 37 warnings (non-blocking)

For more information, see:
- [Linting Guide](docs/LINTING.md) - Setup, commands, and best practices
- [Biome Setup Summary](docs/BIOME_SETUP_SUMMARY.md) - What was configured and why

## Key Features Guide

### For Regular Users
1. **Browse Exercises**: View all exercises with videos and details
2. **Search & Filter**: Find exercises by name or muscle group
3. **Watch Videos**: Click exercises to view YouTube demonstrations
4. **Create Routines**: Plan your workout routines
5. **Build Workouts**: Add exercises to workouts with target sets/reps
6. **Log Sessions**: Track your actual performance in the gym
7. **View History**: Review past workouts and progress

### For Admin Users
All regular user features plus:
1. **Create Exercises**: Add new exercises to the library
2. **Import Exercises**: Upload PDF files with exercise lists
3. **Edit Exercises**: Modify exercise details, videos, and muscles
4. **Delete Exercises**: Remove exercises from the library
5. **Manage Videos**: Add/update YouTube video links

## API Endpoints

The app connects to these backend endpoints:

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration

### Exercises & Muscles
- `GET /exercises` - Fetch all exercises
- `GET /exercises/:id` - Get exercise by ID
- `GET /muscles` - Fetch muscle groups
- `POST /admin/exercises` - Create new exercise (admin)
- `POST /admin/exercises/import-pdf` - Import exercises from PDF (admin)
- `PUT /exercises/:id` - Update exercise
- `DELETE /exercises/:id` - Delete exercise

### Routines & Workouts
- `GET /routines` - Get all routines
- `GET /routines/:id` - Get routine by ID
- `GET /routines/user/:userId` - Get user's routines
- `POST /routines` - Create new routine
- `PUT /routines/:id` - Update routine
- `DELETE /routines/:id` - Delete routine
- `POST /workouts` - Create workout
- `PUT /workouts/:id` - Update workout
- `DELETE /workouts/:id` - Delete workout

### Workout Logging
- `POST /log-routines` - Start routine session
- `GET /log-routines/:id` - Get logged routine
- `PUT /log-routines/:id` - Update logged routine
- `POST /log-workouts` - Start workout session
- `PUT /log-workouts/:id` - Complete workout
- `POST /log-exercises` - Log exercise
- `PUT /log-exercises/:id` - Update logged exercise
- `POST /log-sets` - Log individual set
- `PUT /log-sets/:id` - Update logged set

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
