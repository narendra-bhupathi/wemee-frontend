import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { colors } from '../theme';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';

const GradientBackground = styled(Box)({
  minHeight: '100vh',
  width: '100%',
  background: colors.backgroundGradient,
  padding: '20px',
  paddingBottom: '100px', // Space for bottom navigation
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  boxSizing: 'border-box',
  overflowX: 'hidden'
});

// Responsive content wrapper to center and constrain width
const ContentContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 560,
  margin: '0 auto',
  boxSizing: 'border-box',
  [theme.breakpoints.up('sm')]: {
    maxWidth: 640
  },
  [theme.breakpoints.up('md')]: {
    maxWidth: 720
  }
}));

// Common card styling
const CommonCard = styled(Box)({
  background: colors.cardBg,
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '20px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  width: '100%',
  boxSizing: 'border-box'
});

// Common button styling
const CommonButton = styled(Button)({
  background: colors.primary,
  color: colors.textOnPrimary,
  borderRadius: 12,
  padding: '12px 18px',
  fontWeight: 700,
  fontSize: '0.95rem',
  '&:hover': { background: colors.primaryHover }
});

// Common secondary button styling
const SecondaryButton = styled(Button)({
  background: colors.secondary,
  color: colors.textOnPrimary,
  borderRadius: 12,
  padding: '12px 18px',
  fontWeight: 700,
  fontSize: '0.95rem',
  '&:hover': { background: colors.secondaryHover }
});

// Common title styling
const CommonTitle = styled(Typography)({
  color: '#FFFFFF',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '8px'
});

// Common subtitle styling
const CommonSubtitle = styled(Typography)({
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: 'normal',
  opacity: 0.9
});

const CommonLayout = ({ children, showBottomNav = true, bottomNavValue = null }) => {
  return (
    <GradientBackground>
      <ContentContainer>
        {children}
      </ContentContainer>
      {showBottomNav && <BottomNav value={bottomNavValue} />}
    </GradientBackground>
  );
};

export default CommonLayout;
export { CommonCard, CommonButton, SecondaryButton, CommonTitle, CommonSubtitle };

// Reusable header with a back button and title
export const BackHeader = ({ title, backTo }) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
      return;
    }
    // Prefer browser history when available; fallback to Home as last stop
    try {
      if (window.history.state && window.history.length > 1) {
        navigate(-1);
        return;
      }
    } catch (e) {}
    navigate('/home');
  };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <IconButton onClick={handleBack} color="inherit" size="small" aria-label="Back">
        <ArrowBackIosNewRoundedIcon fontSize="small" />
      </IconButton>
      <CommonTitle sx={{ mb: 0 }}>{title}</CommonTitle>
    </Box>
  );
};
