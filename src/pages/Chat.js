import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, TextField, Button, Paper, Box, Avatar, Stack, Alert } from '@mui/material';
import CommonLayout, { CommonCard, CommonTitle, BackHeader } from '../components/CommonLayout';
import { getUserIdFromToken, getToken } from '../utils/auth';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trip, acceptedBid } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    if (!trip) {
      navigate('/my-trips');
      return;
    }

    // If we don't have acceptedBid, try to fetch it
    const loadAcceptedBid = async () => {
      if (!acceptedBid) {
        try {
          const res = await fetch(`/chat/${trip.id}/accepted-bid`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          });
          const data = await res.json();
          if (data.success) {
            // Update the state with accepted bid data
            // This will trigger a re-render with the accepted bid
            return data.data;
          }
        } catch (err) {
          console.error('Failed to load accepted bid:', err);
        }
      }
      return acceptedBid;
    };

    const initializeChat = async () => {
      const bidData = await loadAcceptedBid();
      if (!bidData) {
        navigate('/my-trips');
        return;
      }

      // Load existing messages
      const loadMessages = async () => {
        try {
          const res = await fetch(`/chat/${trip.id}/messages`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          });
          const data = await res.json();
          if (data.success) {
            setMessages(data.data);
          }
        } catch (err) {
          setError('Failed to load messages');
        } finally {
          setLoading(false);
        }
      };

      loadMessages();

      // Connect to WebSocket
      const wsUrl = `ws://localhost:5000`;
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
  
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.trip_id === trip.id) {
            // Check if message already exists to prevent duplicates
            setMessages(prev => {
              const messageExists = prev.some(msg => 
                msg.id === data.id || 
                (msg.sender_id === data.sender_id && 
                 msg.message === data.message && 
                 Math.abs(new Date(msg.created_at) - new Date(data.created_at)) < 1000)
              );
              
              if (messageExists) {
                return prev;
              }
              
              return [...prev, data];
            });
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setWs(websocket);

      return () => {
        websocket.close();
      };
    };

    initializeChat();
  }, [trip, acceptedBid, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !ws) return;

    const messageData = {
      trip_id: trip.id,
      sender_id: currentUserId,
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    try {
      // Send via WebSocket only - the backend will handle saving and broadcasting
      ws.send(JSON.stringify(messageData));
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!trip || !acceptedBid) return null;

  const isSender = acceptedBid.sender_id === currentUserId;
  const otherUser = isSender ? trip.username : acceptedBid.username;

  return (
    <CommonLayout showBottomNav={false}>
      <BackHeader title={`Chat with ${otherUser}`} />
      <CommonCard>
        <Typography variant="body2" color="text.secondary">
          Trip: {trip.departure_airport} ➜ {trip.arrival_airport}
        </Typography>
      </CommonCard>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <CommonCard sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loading ? (
            <Typography>Loading messages...</Typography>
          ) : messages.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              No messages yet. Start the conversation!
            </Typography>
          ) : (
            <Stack spacing={2}>
              {messages.map((msg, index) => {
                const isOwnMessage = msg.sender_id === currentUserId;
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        maxWidth: '70%',
                        backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
                        color: isOwnMessage ? 'white' : 'text.primary'
                      }}
                    >
                      <Typography variant="body2">{msg.message}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
            />
            <Button
              variant="contained"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              Send
            </Button>
          </Stack>
        </Box>
      </CommonCard>
    </CommonLayout>
  );
};

export default Chat; 