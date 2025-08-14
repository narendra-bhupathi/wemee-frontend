import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Paper, Box, Avatar, Stack, CircularProgress, Alert, Chip } from '@mui/material';
import { styled } from '@mui/system';
import { getUserIdFromToken, getToken, getUsernameFromToken } from '../utils/auth';
import CommonLayout, { CommonCard, CommonTitle, BackHeader } from '../components/CommonLayout';

const GradientBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  paddingBottom: theme.spacing(10),
  background: 'linear-gradient(135deg, #1A2CFF 0%, #0070FF 100%)',
  color: '#fff',
}));

const ChatCard = styled(Paper)(({ theme }) => ({
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

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        // Fetch trips where user is traveller and has accepted bids
        const tripsRes = await fetch('/travels/my', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const tripsData = await tripsRes.json();
        
        // Fetch packages where user is sender and has accepted bids
        let username = getUsernameFromToken();
    
        
        // If username is null, try to get it from user profile
        if (!username) {
          try {
            const userRes = await fetch('/users/profile', {
              headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              username = userData.username;
  
            }
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        }
        
        if (!username) {
          console.error('Could not get username, skipping packages fetch');
          setChats([]); // Set chats to empty if username is not found
          setLoading(false);
          return;
        }
        
        const packagesRes = await fetch(`/send-receive/by-username?username=${encodeURIComponent(username)}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        
        const chatList = [];

        // Add trips with accepted bids
        for (const trip of tripsData) {
          try {
            const bidRes = await fetch(`/bids/${trip.id}`, {
              headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const bidData = await bidRes.json();
            const acceptedBid = bidData.data?.find(b => b.status === 'accepted');
            
            if (acceptedBid) {
              chatList.push({
                id: `trip-${trip.id}`,
                type: 'traveller',
                title: `${trip.departure_airport} ➜ ${trip.arrival_airport}`,
                subtitle: `Accepted bid: ${acceptedBid.amount} Connects`,
                otherUser: acceptedBid.username,
                trip: trip,
                acceptedBid: acceptedBid,
                lastMessage: null // TODO: Add last message
              });
            }
          } catch (err) {
            console.error('Error fetching trip bids:', err);
          }
        }

        // Add packages with accepted bids (if packages fetch was successful)
        if (packagesRes.ok) {
          const packagesData = await packagesRes.json();


          for (const pkg of packagesData) {
            
            if (pkg.bid_id && pkg.bid_status === 'accepted') {
              
              try {
                const tripRes = await fetch(`/travels/${pkg.trip_id}`, {
                  headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                
                if (tripRes.ok) {
                  const tripData = await tripRes.json();
                  
                  chatList.push({
                    id: `package-${pkg.id}`,
                    type: 'sender',
                    title: pkg.product_name || 'Package',
                    subtitle: `Package to ${pkg.delivery_location || 'Unknown location'}`,
                    otherUser: tripData.username || 'Unknown traveler',
                    trip: { id: pkg.trip_id },
                    acceptedBid: {
                      id: pkg.bid_id,
                      amount: pkg.bid_amount,
                      status: pkg.bid_status,
                      trip_id: pkg.trip_id
                    },
                    lastMessage: null // TODO: Add last message
                  });
                } else {
                  console.error('Failed to fetch trip data for trip ID:', pkg.trip_id);
                  // Add chat entry with limited info if trip data can't be fetched
                  chatList.push({
                    id: `package-${pkg.id}`,
                    type: 'sender',
                    title: pkg.product_name || 'Package',
                    subtitle: `Package to ${pkg.delivery_location || 'Unknown location'}`,
                    otherUser: 'Traveler',
                    trip: { id: pkg.trip_id },
                    acceptedBid: {
                      id: pkg.bid_id,
                      amount: pkg.bid_amount,
                      status: pkg.bid_status,
                      trip_id: pkg.trip_id
                    },
                    lastMessage: null
                  });
                }
              } catch (err) {
                console.error('Error fetching trip data:', err);
                // Add chat entry with limited info if there's an error
                chatList.push({
                  id: `package-${pkg.id}`,
                  type: 'sender',
                  title: pkg.product_name || 'Package',
                  subtitle: `Package to ${pkg.delivery_location || 'Unknown location'}`,
                  otherUser: 'Traveler',
                  trip: { id: pkg.trip_id },
                  acceptedBid: {
                    id: pkg.bid_id,
                    amount: pkg.bid_amount,
                    status: pkg.bid_status,
                    trip_id: pkg.trip_id
                  },
                  lastMessage: null
                });
              }
            }
          }
        }

        setChats(chatList);
      } catch (err) {
        setError('Failed to load chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const handleChatClick = (chat) => {
    navigate('/chat', { 
      state: { 
        trip: chat.trip, 
        acceptedBid: chat.acceptedBid 
      } 
    });
  };

  return (
    <CommonLayout bottomNavValue="/chats">
      <BackHeader title="My Chats" />
        
        {loading ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <CircularProgress color="inherit" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : chats.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" gutterBottom>No Active Chats</Typography>
            <Typography variant="body2" color="text.secondary">
              You'll see your chats here once you have accepted bids or your bids are accepted.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {chats.map((chat) => (
              <CommonCard key={chat.id} onClick={() => handleChatClick(chat)} sx={{ cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: chat.type === 'traveller' ? 'primary.main' : 'secondary.main' }}>
                    {chat.type === 'traveller' ? '✈️' : '📦'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {chat.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {chat.subtitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Chat with {chat.otherUser}
                    </Typography>
                  </Box>
                  <Chip 
                    label={chat.type === 'traveller' ? 'Traveller' : 'Sender'} 
                    size="small" 
                    color={chat.type === 'traveller' ? 'primary' : 'secondary'}
                  />
                </Box>
              </CommonCard>
            ))}
          </Stack>
        )}
    </CommonLayout>
  );
};

export default ChatList; 