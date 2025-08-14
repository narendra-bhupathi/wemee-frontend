import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Box, 
  Chip, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CommonLayout, { CommonCard, CommonButton, CommonSubtitle, BackHeader } from '../components/CommonLayout';
import { getUsernameFromToken } from '../utils/auth';

const SendReceiveList = ({ user }) => {
  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this entry?')) return;
    try{
      const res = await fetch(`/send-receive/${id}`, {method:'DELETE'});
      const data = await res.json();
      if(!res.ok) throw new Error(data.message || 'Failed to delete');
      setEntries(prev=>prev.filter(e=>e.id!==id));
    }catch(err){
      alert(err.message);
    }
  };

  const [entries, setEntries] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const currentUsername = user?.username || getUsernameFromToken();

  useEffect(() => {
    if(currentUsername){
      fetchEntries(currentUsername);
    }
  }, [currentUsername]);

  const fetchEntries = async (username) => {
    try {
      setLoading(true);
          const query = username ? `?username=${encodeURIComponent(username)}` : '';
          const response = await fetch(`/send-receive/by-username${query}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch entries');
      }
      
      setEntries(data.data || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Styled components for the design

  if (!currentUsername) {
    return (
      <CommonLayout bottomNavValue="/send-receive-list">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress color="inherit" />
        </Box>
      </CommonLayout>
    );
  }

  if (loading) {
    return (
      <CommonLayout bottomNavValue="/send-receive-list">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', flexDirection: 'column' }}>
          <CircularProgress color="inherit" />
          <CommonSubtitle sx={{ mt: 2 }}>Loading entries...</CommonSubtitle>
        </Box>
      </CommonLayout>
    );
  }

  if (error) {
    return (
      <CommonLayout bottomNavValue="/send-receive-list">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <CommonButton onClick={() => navigate('/home')}>Back to Home</CommonButton>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout bottomNavValue="/send-receive-list">
      <BackHeader title="Your Packages" />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <CommonButton onClick={() => navigate('/send-receive-form')}>
          Add New Entry
        </CommonButton>
      </Box>

      {entries.length === 0 ? (
        <CommonCard sx={{ textAlign: 'center', py: 4 }}>
          <CommonSubtitle sx={{ color: '#666', mb: 3 }}>
            No send/receive entries found.
          </CommonSubtitle>
          <CommonButton onClick={() => navigate('/send-receive-form')}>
            Create your first entry
          </CommonButton>
        </CommonCard>
      ) : (
        <Grid container spacing={3}>
          {entries.map((entry) => (
            <Grid item xs={12} md={6} lg={4} key={entry.id}>
              <CommonCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#333' }}>
                      {entry.product_name}
                    </Typography>
                    <Chip 
                      label={entry.product_type_name || 'Unknown Type'} 
                      color="primary" 
                      size="small" 
                    />
                  </Box>
                  
                  {entry.product_image && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                      <img 
                        src={`/uploads/${entry.product_image}`} 
                        alt={entry.product_name}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '150px', 
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  )}

                  <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                    <strong>Weight:</strong> {entry.weight} kg
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                    <strong>Preferred Date:</strong> {formatDate(entry.preferred_date)}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                    <strong>From:</strong> {entry.pickup_location}, {entry.pickup_country}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                    <strong>To:</strong> {entry.delivery_location}, {entry.delivery_country}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                    <strong>Created by:</strong> {entry.username || 'Unknown User'}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>Created:</strong> {formatDate(entry.created_at)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
                  <CommonButton 
                    sx={{ fontSize: '12px', padding: '8px 16px' }}
                    onClick={() => navigate('/send-receive-form', { state: { entry } })}
                  >
                    View / Edit
                  </CommonButton>
                  <CommonButton 
                    sx={{ fontSize: '12px', padding: '8px 16px' }}
                    onClick={() => navigate('/send-receive-detail', { state: { entry } })}
                  >
                    View Matches
                  </CommonButton>
                  <CommonButton 
                    sx={{ fontSize: '12px', padding: '8px 16px', backgroundColor: '#dc3545' }}
                    onClick={() => handleDelete(entry.id)}
                  >
                    Delete
                  </CommonButton>
                  {entry.bid_id && entry.bid_status === 'accepted' && (
                    <CommonButton 
                      sx={{ fontSize: '12px', padding: '8px 16px', backgroundColor: '#28a745' }}
                      onClick={() => navigate('/chat', { state: { trip: { id: entry.trip_id }, acceptedBid: { id: entry.bid_id, amount: entry.bid_amount, status: entry.bid_status, trip_id: entry.trip_id } } })}
                    >
                      Chat
                    </CommonButton>
                  )}
                </Box>
              </CommonCard>
            </Grid>
          ))}
        </Grid>
      )}
    </CommonLayout>
  );
};

export default SendReceiveList;
