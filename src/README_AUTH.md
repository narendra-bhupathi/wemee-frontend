# Authentication System Documentation

## Overview

This application implements a complete JWT-based authentication system with automatic token refresh and secure logout functionality.

## Features

### Backend Authentication Endpoints

1. **POST /auth/login** - User login with username and OTP
   - Returns: `{ token, refreshToken, user }`
   - Token expires in 2 hours
   - Refresh token expires in 7 days

2. **POST /auth/refresh** - Refresh access token
   - Requires: `{ refreshToken }`
   - Returns: `{ token, refreshToken, user }`

3. **POST /auth/validate** - Validate current token
   - Requires: Authorization header with Bearer token
   - Returns: `{ user }`

4. **POST /auth/logout** - Logout user
   - Requires: Authorization header with Bearer token
   - Clears server-side session (if implemented)

### Frontend Authentication Features

1. **Automatic Token Refresh**
   - Tokens are automatically refreshed 1 minute before expiration
   - Failed refresh attempts redirect to login

2. **Route Protection**
   - Protected routes automatically redirect to login if not authenticated
   - Loading states during authentication checks

3. **Persistent Authentication**
   - Users remain logged in across browser refreshes
   - Automatic validation of stored tokens on app load

4. **Secure Logout**
   - Dedicated logout page with confirmation
   - Clears all tokens and redirects to login

## Components

### AuthContext (`src/contexts/AuthContext.js`)
- Manages authentication state
- Provides login, logout, and refresh functions
- Handles token validation on app initialization

### ProtectedRoute (`src/components/ProtectedRoute.js`)
- Wrapper component for protected routes
- Shows loading spinner during auth checks
- Redirects to login if not authenticated

### LoadingSpinner (`src/components/LoadingSpinner.js`)
- Consistent loading UI across the app
- Customizable message prop

### useTokenRefresh Hook (`src/hooks/useTokenRefresh.js`)
- Automatically schedules token refresh
- Monitors token expiration
- Handles refresh failures gracefully

## Usage

### Protecting Routes
```jsx
<Route path="/protected" element={
  <ProtectedRoute>
    <ProtectedComponent />
  </ProtectedRoute>
} />
```

### Using Authentication in Components
```jsx
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </div>
  );
};
```

### Making Authenticated API Calls
```jsx
import { apiFetch } from '../utils/auth';

const fetchData = async () => {
  const response = await apiFetch('/api/data');
  // Automatically handles token refresh if needed
};
```

## Security Features

1. **Token Expiration**: Access tokens expire in 2 hours
2. **Refresh Tokens**: Long-lived refresh tokens for seamless experience
3. **Automatic Refresh**: Tokens are refreshed before expiration
4. **Secure Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
5. **Logout Cleanup**: All tokens cleared on logout

## Configuration

### Environment Variables
- `JWT_SECRET`: Secret key for JWT signing (backend)

### Token Configuration
- Access Token: 2 hours
- Refresh Token: 7 days
- Refresh Threshold: 1 minute before expiration

## Error Handling

- Network errors during authentication redirect to login
- Invalid tokens trigger automatic refresh
- Failed refresh attempts clear all tokens and redirect to login
- Loading states prevent UI flashing during auth checks

## Future Enhancements

1. **Token Blacklisting**: Implement server-side token invalidation
2. **Remember Me**: Extended refresh token duration
3. **Multi-device Support**: Track active sessions
4. **Security Headers**: Implement CSRF protection
5. **Rate Limiting**: Prevent brute force attacks 