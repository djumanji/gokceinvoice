# React Native Expense App

A React Native mobile application for tracking expenses, built with Expo and integrated with the existing web application backend.

## Features

- **Authentication**: Login and registration with JWT token support
- **Expense Management**: Create, view, edit, and delete expenses
- **Receipt Upload**: Capture or select photos from camera/gallery
- **Search & Filter**: Search expenses by description/vendor and filter by category
- **Statistics**: View total expenses, tax deductible amounts, and monthly totals
- **Offline Support**: Uses React Query for efficient data caching

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Native Paper** for UI components
- **React Query** (TanStack Query) for data fetching
- **Expo Image Picker** for receipt uploads
- **AsyncStorage** for secure token storage

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for Android development)

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure API endpoint:
   Create a `.env` file in the `mobile` directory:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:5000
   ```
   For production, update this to your backend URL.

### Running the App

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Web (for testing)
```bash
npm run web
```

## Project Structure

```
mobile/
├── src/
│   ├── components/        # Reusable components (ExpenseForm)
│   ├── constants/        # Constants (categories, config)
│   ├── contexts/         # React contexts (AuthContext)
│   ├── hooks/           # Custom hooks (useExpenses)
│   ├── screens/          # Screen components
│   ├── services/         # API client and query client
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── App.tsx              # Main app component
└── package.json
```

## API Configuration

The app connects to the same backend as the web application. The backend supports both:
- **Session-based authentication** (web app)
- **JWT token authentication** (mobile app)

The mobile app uses JWT tokens stored securely in AsyncStorage.

## Backend Changes

The backend has been updated to support JWT tokens:
- `server/services/jwt-service.ts` - JWT token generation and verification
- `server/middleware/auth.middleware.ts` - Updated to support both session and JWT auth
- `server/auth-routes.ts` - Login/register endpoints now return JWT tokens
- CSRF validation bypasses for JWT-authenticated requests

## Environment Variables

Create a `.env` file in the `mobile` directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

For production, use your deployed backend URL.

## Development

### Running on Physical Device

1. Install Expo Go app on your device (iOS App Store or Google Play)
2. Start the development server:
   ```bash
   npm start
   ```
3. Scan the QR code with Expo Go (iOS) or the Expo app (Android)

### Building for Production

#### iOS
```bash
eas build --platform ios
```

#### Android
```bash
eas build --platform android
```

Note: You'll need to set up EAS (Expo Application Services) for production builds.

## Features Implementation

### Expense Form
- All fields from web app replicated
- Category selector with icons
- Date picker
- Payment method selector
- Receipt upload (camera/gallery)
- Tax deductible checkbox

### Expense List
- FlatList with pull-to-refresh
- Search by description/vendor
- Category filter
- Stats cards showing totals
- Navigation to detail/edit screens

### Expense Detail
- View full expense details
- Edit expense (reuses form component)
- Delete with confirmation
- Full-screen receipt viewing

## Authentication Flow

1. User logs in via `LoginScreen`
2. Backend returns JWT token in response
3. Token stored in AsyncStorage
4. All API requests include token in `Authorization: Bearer <token>` header
5. Backend validates token and extracts userId

## Notes

- The app shares the same backend and database as the web app
- All expense data structures match the existing database schema
- Receipt uploads use the same S3 bucket and `/api/upload` endpoint
- Authentication supports both session (web) and token (mobile) methods

