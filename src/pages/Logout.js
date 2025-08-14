import React, { useEffect } from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Logout = () => {
  const { logout } = useAuth();

  useEffect(() => {
    // Perform logout after a short delay to show the message
    const timer = setTimeout(() => {
      logout();
    }, 2000);

    return () => clearTimeout(timer);
  }, [logout]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        textAlign="center"
      >
        <LoadingSpinner message="Logging out..." />
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please wait while we securely log you out.
        </Typography>
        <Alert severity="info" sx={{ width: '100%' }}>
          You will be redirected to the login page shortly.
        </Alert>
      </Box>
    </Container>
  );
};

export default Logout; 