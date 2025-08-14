import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, CircularProgress, Alert, Paper, Button, Stack, Accordion, AccordionSummary, AccordionDetails, Box, Chip } from '@mui/material';
import CommonLayout, { CommonCard, CommonTitle, BackHeader, CommonButton } from '../components/CommonLayout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getUserIdFromToken, getToken } from '../utils/auth';
import FlightIcon from '@mui/icons-material/Flight';

const TripBids = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const trip = location.state?.trip;
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [senderDetails, setSenderDetails] = useState({});
  
  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  useEffect(() => {
    if (!trip) {
      navigate('/my-trips');
      return;
    }
    const fetchBids = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/bids/${trip.id}`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setBids(data.data);
          // Fetch sender details for each bid
          const details = {};
          for (const bid of data.data) {
            try {
              const senderRes = await fetch(`/send-receive/by-username?username=${bid.username}`);
              const senderData = await senderRes.json();
              if (senderData.length > 0) {
                details[bid.sender_id] = senderData[0]; // Get first package for this sender
              }
            } catch (err) {
              console.error('Failed to fetch sender details:', err);
            }
          }
          setSenderDetails(details);
        } else {
          setError(data.message || 'Failed to load bids');
        }
      } catch (err) {
        setError('Failed to load bids');
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, [trip, navigate]);

  const handleAction = async (bidId, action) => {
    setActionStatus('');
    try {
      const res = await fetch(`/bids/${bidId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setActionStatus(`Bid ${action}ed!`);
        // Refresh bids
        const res2 = await fetch(`/bids/${trip.id}`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        const data2 = await res2.json();
        setBids(data2.data);
      } else {
        setActionStatus(data.message || `Failed to ${action} bid`);
      }
    } catch (err) {
      setActionStatus(`Failed to ${action} bid`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'primary';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'refunded': return 'warning';
      default: return 'default';
    }
  };

  if (!trip) return null;

  return (
    <CommonLayout bottomNavValue="/my-trips">
      <BackHeader title={`Bids for Trip: ${trip.departure_airport} ➜ ${trip.arrival_airport}`} backTo="/my-trips" />

      {/* Top-right Back to Trips */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <CommonButton
          size="small"
          sx={{ borderRadius: 999, px: 2, py: 1 }}
          onClick={() => navigate('/my-trips')}
        >
          Back to My Trips
        </CommonButton>
      </Box>

      {/* Trip details header, matching Home style */}
      <CommonCard>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" sx={{ color: '#6b7280', mb: 0.5 }}>From</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1f2a44', lineHeight: 1 }}>
              {trip.departure_airport || '—'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
              {(trip.current_location || '') + (trip.current_country ? `, ${trip.current_country}` : '')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
              {formatTime(trip.flight_departure_datetime)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
            <Box sx={{ width: 28, height: 2, bgcolor: '#e5e7eb', mr: 1 }} />
            <FlightIcon sx={{ color: '#1f2a44', transform: 'rotate(90deg)' }} />
            <Box sx={{ width: 28, height: 2, bgcolor: '#e5e7eb', ml: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#6b7280', mb: 0.5 }}>To</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1f2a44', lineHeight: 1 }}>
              {trip.arrival_airport || '—'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
              {(trip.travelling_location || '') + (trip.travelling_country ? `, ${trip.travelling_country}` : '')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
              {formatTime(trip.flight_arrival_datetime)}
            </Typography>
          </Box>
        </Box>
      </CommonCard>

      {/* Active bid section */}
      <CommonCard>
        <Typography variant="h6" sx={{ mb: 1, color: '#1f2a44', fontWeight: 700 }}>Active Bid</Typography>
        {(() => {
          const accepted = bids.find(b => b.status === 'accepted');
          const highestActive = bids.filter(b => b.status === 'active').sort((a,b) => b.amount - a.amount)[0];
          const activeBid = accepted || highestActive;
          if (!activeBid) {
            return <Typography variant="body2" color="text.secondary">No active bids yet.</Typography>;
          }
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>{activeBid.username}</Typography>
                <Typography variant="body2" color="text.secondary">Bid Amount</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight={800}>{activeBid.amount} Connects</Typography>
                <Chip label={activeBid.status} color={activeBid.status === 'accepted' ? 'success' : 'primary'} size="small" />
                {activeBid.status === 'accepted' && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    onClick={() => navigate('/chat', { state: { trip, acceptedBid: activeBid } })}
                  >
                    Start Chat
                  </Button>
                )}
              </Box>
            </Box>
          );
        })()}
      </CommonCard>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <Stack spacing={2}>
          {bids.length === 0 ? <Typography>No bids yet.</Typography> : bids.map(bid => {
            const senderDetail = senderDetails[bid.sender_id];
            return (
              <CommonCard key={bid.id} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{bid.username}</Typography>
                    <Typography variant="body1" color="primary" fontWeight={500}>
                      {bid.amount} Connects
                    </Typography>
                    <Chip 
                      label={bid.status} 
                      color={getStatusColor(bid.status)} 
                      size="small" 
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  {bid.status === 'active' && (
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" color="success" size="small" onClick={() => handleAction(bid.id, 'accept')}>
                        Accept
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => handleAction(bid.id, 'reject')}>
                        Reject
                      </Button>
                    </Stack>
                  )}
                  {bid.status === 'accepted' && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small" 
                      onClick={() => navigate('/chat', { state: { trip, acceptedBid: bid } })}
                    >
                      Start Chat
                    </Button>
                  )}
                </Box>
                
                {senderDetail && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          📦 {senderDetail.product_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {senderDetail.pickup_location}, {senderDetail.pickup_country} ➜ {senderDetail.delivery_location}, {senderDetail.delivery_country}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Weight:</strong> {senderDetail.weight} kg
                        </Typography>
                        <Typography variant="body2">
                          <strong>Product Type:</strong> {senderDetail.product_type_name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Preferred Date:</strong> {new Date(senderDetail.preferred_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Created:</strong> {new Date(senderDetail.created_at).toLocaleDateString()}
                        </Typography>
                        {senderDetail.product_image && (
                          <Box sx={{ mt: 1 }}>
                            <img 
                              src={`/uploads/${senderDetail.product_image}`} 
                              alt={senderDetail.product_name}
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '150px', 
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          </Box>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CommonCard>
            );
          })}
        </Stack>
      )}
      {actionStatus && <Alert severity="info" sx={{ mt: 2 }}>{actionStatus}</Alert>}
    </CommonLayout>
  );
};

export default TripBids;