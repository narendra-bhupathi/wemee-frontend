import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Paper, Box, Avatar, Stack, CircularProgress, Alert, Chip, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import { getUserIdFromToken, getToken } from '../utils/auth';
import CommonLayout, { CommonCard, CommonTitle, SecondaryButton } from '../components/CommonLayout';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ChatIcon from '@mui/icons-material/Chat';

const GradientBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  paddingBottom: theme.spacing(10),
  background: 'linear-gradient(135deg, #1A2CFF 0%, #0070FF 100%)',
  color: '#fff',
}));

const NotificationCard = styled(Paper)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(2),
  backgroundColor: '#fff',
  color: '#000',
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
}));

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const notificationList = [];

        // Fetch user's bids and their status
        const bidsRes = await fetch('/bids/user', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const bidsData = await bidsRes.json();

        // Fetch user's trips and their bids
        const tripsRes = await fetch('/travels/my', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const tripsData = await tripsRes.json();

        // Process bid notifications
        for (const bid of bidsData.data || []) {
          if (bid.status === 'accepted') {
            notificationList.push({
              id: `bid-accepted-${bid.id}`,
              type: 'bid_accepted',
              title: 'Your bid was accepted!',
              message: `Your bid of ${bid.amount} Connects was accepted for trip ${bid.trip_id}`,
              timestamp: bid.updated_at || bid.created_at,
              action: 'chat',
              actionData: { tripId: bid.trip_id, bidId: bid.id }
            });
          } else if (bid.status === 'rejected') {
            notificationList.push({
              id: `bid-rejected-${bid.id}`,
              type: 'bid_rejected',
              title: 'Your bid was rejected',
              message: `Your bid of ${bid.amount} Connects was rejected. Your connects have been refunded.`,
              timestamp: bid.updated_at || bid.created_at,
              action: 'none'
            });
          } else if (bid.status === 'refunded') {
            notificationList.push({
              id: `bid-refunded-${bid.id}`,
              type: 'bid_refunded',
              title: 'Bid refunded',
              message: `Your bid of ${bid.amount} Connects was refunded as another bid was accepted.`,
              timestamp: bid.updated_at || bid.created_at,
              action: 'none'
            });
          }
        }

        // Process trip notifications (for travellers)
        for (const trip of tripsData) {
          try {
            const tripBidsRes = await fetch(`/bids/${trip.id}`, {
              headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const tripBidsData = await tripBidsRes.json();
            
            const activeBids = tripBidsData.data?.filter(b => b.status === 'active') || [];
            if (activeBids.length > 0) {
              notificationList.push({
                id: `new-bids-${trip.id}`,
                type: 'new_bids',
                title: 'New bids on your trip!',
                message: `${activeBids.length} new bid(s) on your trip ${trip.departure_airport} ➜ ${trip.arrival_airport}`,
                timestamp: new Date().toISOString(),
                action: 'view_bids',
                actionData: { tripId: trip.id }
              });
            }
          } catch (err) {
            console.error('Error fetching trip bids:', err);
          }
        }

        // Sort by timestamp (newest first)
        notificationList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(notificationList);
      } catch (err) {
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleNotificationClick = (notification) => {
    switch (notification.action) {
      case 'chat':
        navigate('/chat', { 
          state: { 
            trip: { id: notification.actionData.tripId }, 
            acceptedBid: { id: notification.actionData.bidId } 
          } 
        });
        break;
      case 'view_bids':
        navigate('/trip-bids', { 
          state: { trip: { id: notification.actionData.tripId } } 
        });
        break;
      default:
        // No action needed
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bid_accepted':
        return <CheckCircleIcon color="success" />;
      case 'bid_rejected':
        return <CancelIcon color="error" />;
      case 'bid_refunded':
        return <AttachMoneyIcon color="warning" />;
      case 'new_bids':
        return <ChatIcon color="primary" />;
      default:
        return <ChatIcon />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'bid_accepted':
        return 'success';
      case 'bid_rejected':
        return 'error';
      case 'bid_refunded':
        return 'warning';
      case 'new_bids':
        return 'primary';
      default:
        return 'default';
    }
  };

  const handleBack = () => {
    // Navigate based on last selected home mode
    const mode = localStorage.getItem('homeMode') || 'travel';
    if (mode === 'travel') navigate('/my-trips'); else navigate('/send-receive-list');
  };

  return (
    <CommonLayout bottomNavValue="/notifications">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconButton onClick={handleBack} color="inherit" size="small" aria-label="Back">
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>
        <CommonTitle sx={{ mb: 0 }}>Notifications</CommonTitle>
      </Box>
        
        {loading ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <CircularProgress color="inherit" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : notifications.length === 0 ? (
          <CommonCard sx={{ p: 3, textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" gutterBottom>No Notifications</Typography>
            <Typography variant="body2" color="text.secondary">
              You'll see notifications here for bid updates and other important events.
            </Typography>
          </CommonCard>
        ) : (
          <Stack spacing={2}>
            {notifications.map((notification) => (
              <CommonCard key={notification.id} onClick={() => handleNotificationClick(notification)} sx={{ cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${getNotificationColor(notification.type)}.main` }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  {notification.action !== 'none' && (
                    <Chip 
                      label={notification.action === 'chat' ? 'Chat' : 'View'} 
                      size="small" 
                      color="primary"
                    />
                  )}
                </Box>
              </CommonCard>
            ))}
          </Stack>
        )}
    </CommonLayout>
  );
};

export default Notifications; 