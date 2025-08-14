import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { clearToken, getUsernameFromToken } from '../utils/auth';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    onLogout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          WeMie
        </Typography>
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={user.username || user.name || ''} arrow>
              <Avatar sx={{ bgcolor: '#fff', color: 'primary.main', fontWeight: 600 }}>
                {((user && (user.username || user.name)) || getUsernameFromToken() || '?')[0].toUpperCase()}
              </Avatar>
            </Tooltip>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {(user && (user.username || user.name)) || getUsernameFromToken() || 'User'}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Button color="inherit" onClick={() => navigate('/login')}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
