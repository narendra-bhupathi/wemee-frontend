import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Container
} from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { submitKYC } from '../api/kycApi';
import BottomNav from '../components/BottomNav';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';

const GradientBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  padding: theme.spacing(4),
  paddingBottom: theme.spacing(10), // space for bottom nav
  background: 'linear-gradient(135deg, #1A2CFF 0%, #0070FF 100%)',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  width: '100%',
  maxWidth: 400,
}));

const KYCVerification = () => {
  const navigate = useNavigate();
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate Aadhaar number format
  const isValidAadhaar = /^\d{12}$/.test(aadhaarNumber);
  const isFormValid = isValidAadhaar && aadhaarNumber.length === 12;

  const handleAadhaarChange = (event) => {
    const value = event.target.value;
    // Only allow digits
    const numericValue = value.replace(/\D/g, '');
    // Limit to 12 digits
    const limitedValue = numericValue.slice(0, 12);
    setAadhaarNumber(limitedValue);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!isFormValid) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await submitKYC(aadhaarNumber);
      
      if (response.success) {
        setSuccess('KYC verification successful! You are now a verified customer.');
        // Redirect to profile page after 2 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      }
    } catch (error) {
      setError(error.message || 'KYC verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/profile');
  };

  return (
    <GradientBackground>
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button onClick={() => navigate('/profile')} startIcon={<ArrowBackIosNewRoundedIcon />} sx={{ color: '#fff' }}>Back</Button>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>KYC Verification</Typography>
        </Box>

        <StyledPaper>
          <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
            Verify Your Identity
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
            Please enter your 12-digit Aadhaar number to complete the KYC verification process.
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Aadhaar Number"
              value={aadhaarNumber}
              onChange={handleAadhaarChange}
              placeholder="Enter 12-digit Aadhaar number"
              variant="outlined"
              sx={{ mb: 3 }}
              inputProps={{
                maxLength: 12,
                pattern: '[0-9]*',
                inputMode: 'numeric'
              }}
              error={aadhaarNumber.length > 0 && !isValidAadhaar}
              helperText={
                aadhaarNumber.length > 0 && !isValidAadhaar
                  ? 'Please enter exactly 12 digits'
                  : `${aadhaarNumber.length}/12 digits`
              }
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={!isFormValid || isLoading}
                sx={{
                  py: 1.5,
                  backgroundColor: '#28a745',
                  '&:hover': {
                    backgroundColor: '#218838'
                  },
                  '&:disabled': {
                    backgroundColor: '#6c757d'
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Submit Verification'
                )}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={handleBack}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  borderColor: '#fff',
                  color: '#fff',
                  '&:hover': {
                    borderColor: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Back to Profile
              </Button>
            </Box>
          </form>
        </StyledPaper>

        <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
          Your Aadhaar number will be securely verified and stored in compliance with government regulations.
        </Typography>
      </Container>
      <BottomNav />
    </GradientBackground>
  );
};

export default KYCVerification; 