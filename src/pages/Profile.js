import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Stack, Avatar, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getKYCStatus } from '../api/kycApi';
import CommonLayout, { CommonCard, CommonButton, SecondaryButton, CommonTitle, CommonSubtitle, BackHeader } from '../components/CommonLayout';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const username = user?.username || 'User';
  const [kycStatus, setKycStatus] = useState(null);
  const [isLoadingKYC, setIsLoadingKYC] = useState(true);
  const [kycError, setKycError] = useState('');

  // Fetch KYC status on component mount
  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        setIsLoadingKYC(true);
        const response = await getKYCStatus();
        setKycStatus(response.kyc_status);
        setKycError('');
      } catch (error) {
        console.error('Error fetching KYC status:', error);
        setKycError('Failed to load KYC status');
        setKycStatus('pending');
      } finally {
        setIsLoadingKYC(false);
      }
    };

    fetchKYCStatus();
  }, []);

  const handleLogout = () => {
    navigate('/logout');
  };

  const handleKYCVerification = () => {
    navigate('/kyc-verification');
  };

  const handleWallet = () => {
    navigate('/wallet');
  };

  const renderKYCStatus = () => {
    if (isLoadingKYC) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Loading KYC status...</Typography>
        </Box>
      );
    }

    if (kycError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {kycError}
        </Alert>
      );
    }

    if (kycStatus === 'verified') {
      return (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              fontWeight: 'bold',
              color: '#28a745'
            }
          }}
        >
          ✓ Verified Customer
        </Alert>
      );
    }

    return (
      <Button 
        variant="contained" 
        fullWidth 
        onClick={handleKYCVerification}
        sx={{ 
          mb: 2,
          backgroundColor: '#ffd600',
          color: '#333',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#e6c200'
          }
        }}
      >
        Please Verify
      </Button>
    );
  };

  return (
    <CommonLayout bottomNavValue="/profile">
      <BackHeader title="Profile" />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <Avatar sx={{ bgcolor: '#fff', color: 'primary.main', width: 80, height: 80, fontSize: 36, mb: 2 }}>
          {username.charAt(0).toUpperCase()}
        </Avatar>
        <CommonTitle sx={{ mb: 4 }}>
          {username}
        </CommonTitle>

        {/* KYC Status Block */}
        <CommonCard sx={{ width: '100%', maxWidth: 320, mb: 3 }}>
          <CommonSubtitle sx={{ fontWeight: 600, mb: 1, textAlign: 'center', color: '#333' }}>
            KYC Status
          </CommonSubtitle>
          {renderKYCStatus()}
        </CommonCard>

        {/* Additional profile fields/actions */}
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 320 }}>
          <CommonButton sx={{ width: '100%' }} onClick={handleWallet}>
            Wallet
          </CommonButton>
          <SecondaryButton sx={{ width: '100%' }} disabled>
            Edit Profile (coming soon)
          </SecondaryButton>
          <CommonButton sx={{ width: '100%', backgroundColor: '#dc3545' }} onClick={handleLogout}>
            Logout
          </CommonButton>
        </Stack>
      </Box>
    </CommonLayout>
  );
};

export default Profile;
