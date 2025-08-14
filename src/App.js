import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Logout from './pages/Logout';
import TravelForm from './pages/TravelForm';
import UserList from './components/UserList';
import Signup from './pages/Signup';
import TravellersList from './pages/TravellersList';
import SendReceiveForm from './pages/SendReceiveForm';
import SendReceiveList from './pages/SendReceiveList';
import SendReceiveDetail from './pages/SendReceiveDetail';
import ProductTypeManager from './pages/ProductTypeManager';
import Profile from './pages/Profile';
import MyTrips from './pages/MyTrips';  
import Wallet from './pages/Wallet';
import AddConnects from './pages/AddConnects';
import TripBids from './pages/TripBids';
import Chat from './pages/Chat';
import ChatList from './pages/ChatList';
import Notifications from './pages/Notifications';
import KYCVerification from './pages/KYCVerification';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTokenRefresh } from './hooks/useTokenRefresh';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  
  // Enable automatic token refresh
  useTokenRefresh();

  if (loading) {
    return <LoadingSpinner message="Initializing..." />;
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/travel-form" element={
        <ProtectedRoute>
          <TravelForm />
        </ProtectedRoute>
      } />
      <Route path="/users" element={<UserList />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/travellers" element={<TravellersList />} />
      <Route path="/send-receive-form" element={
        <ProtectedRoute>
          <SendReceiveForm />
        </ProtectedRoute>
      } />
      <Route path="/send-receive-list" element={
        <ProtectedRoute>
          <SendReceiveList />
        </ProtectedRoute>
      } />
      <Route path="/product-types" element={<ProductTypeManager />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/my-trips" element={<MyTrips />} />
      <Route path="/send-receive-detail" element={
        <ProtectedRoute>
          <SendReceiveDetail />
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/wallet/add" element={<AddConnects />} />
      <Route path="/trip-bids" element={<TripBids />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chats" element={<ChatList />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/kyc-verification" element={
        <ProtectedRoute>
          <KYCVerification />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
