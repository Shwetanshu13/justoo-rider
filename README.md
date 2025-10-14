# Justoo Rider App

A React Native delivery partner app built with Expo.

## Features

- **Authentication**: Email/password login with JWT token management
- **Auto-login**: Persistent login state with secure token storage
- **Protected Routes**: Automatic navigation based on authentication status
- **Modern UI**: Clean and intuitive user interface

## Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure API**:

   - Update `src/config/api.js` with your backend URL
   - Default: `http://localhost:3000/api`

3. **Start Development Server**:
   ```bash
   npm start
   ```

## API Integration

The app integrates with the following backend endpoints:

- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile (protected)

## Project Structure

```
src/
├── config/          # Configuration files
├── contexts/        # React contexts (Auth)
├── navigation/      # Navigation setup
├── screens/         # App screens
│   ├── auth/        # Authentication screens
│   └── HomeScreen.js
└── services/        # API services
```

## Authentication Flow

1. **App Start**: Check for stored token and validate
2. **Login**: Enter credentials → API call → Store token → Navigate to main app
3. **Auto-login**: Valid token found → Skip login → Go to main app
4. **Logout**: Clear token → Return to login screen

## Next Steps

- Add delivery management screens
- Implement real-time order updates
- Add location tracking
- Push notifications
- Offline support
