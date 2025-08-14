import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LuggageRoundedIcon from '@mui/icons-material/LuggageRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Consistent bottom navigation bar used across all pages.
 * Props:
 *  value: current route path (string) - optional, defaults to current location
 */
const BottomNav = ({ value }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentValue = value ?? location.pathname;
  const theme = useTheme();

  const handleChange = (_, newValue) => {
    navigate(newValue);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 8,
        left: 8,
        right: 8,
        borderRadius: '40px',
        overflow: 'hidden',
        bgcolor: '#fff',
        zIndex: 1000
      }}
    >
      <BottomNavigation 
        showLabels 
        value={currentValue} 
        onChange={handleChange} 
        sx={{ 
          bgcolor: '#fff',
          '& .MuiBottomNavigationAction-root': {
            color: '#666666',
            fontSize: '12px',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
        }}
      >
        <BottomNavigationAction label="Home" value="/home" icon={<HomeRoundedIcon />} />
        <BottomNavigationAction label="Trips" value="/my-trips" icon={<LuggageRoundedIcon />} />
        <BottomNavigationAction label="Senders" value="/send-receive-list" icon={<LocalShippingRoundedIcon />} />
        <BottomNavigationAction label="Notifications" value="/notifications" icon={<NotificationsRoundedIcon />} />
        <BottomNavigationAction label="Profile" value="/profile" icon={<PersonRoundedIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
