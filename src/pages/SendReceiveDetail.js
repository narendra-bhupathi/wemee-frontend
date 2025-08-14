import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Avatar, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField } from '@mui/material';
import { styled } from '@mui/system';
import CommonLayout, { CommonCard, CommonTitle, BackHeader } from '../components/CommonLayout';
import { getUserIdFromToken, getToken } from '../utils/auth';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const GradientBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  paddingBottom: theme.spacing(10),
  background: 'linear-gradient(135deg, #1A2CFF 0%, #0070FF 100%)',
  color: '#fff',
}));

const InfoCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(2),
  backgroundColor: '#fff',
  color: '#000',
}));

const TravellerCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(2),
  backgroundColor: '#fff',
}));

const SendReceiveDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const entry = location.state?.entry;

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidDialog, setBidDialog] = useState({ open: false, traveller: null });
  const [bids, setBids] = useState([]);
  const [myBid, setMyBid] = useState(null);
  const [bidAmount, setBidAmount] = useState(100);
  const [bidStatus, setBidStatus] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [highestBid, setHighestBid] = useState(0);
  const [userBids, setUserBids] = useState([]);
  const [userBidsLoading, setUserBidsLoading] = useState(false);
  const [userBidsError, setUserBidsError] = useState(null);

  useEffect(() => {
    if (!entry) {
      navigate('/send-receive-list');
      return;
    }
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await fetch('/send-receive/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            delivery_country: entry.delivery_country,
            date: entry.preferred_date,
            user_id: getUserIdFromToken()
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch matches');
        setMatches(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [entry, navigate]);

  // Fetch all bids by the current user (to show full history including rejected)
  useEffect(() => {
    const fetchUserBids = async () => {
      setUserBidsLoading(true);
      setUserBidsError(null);
      try {
        const res = await fetch('/bids/user', { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'Failed to fetch your bids');
        setUserBids(data.data || []);
      } catch (err) {
        setUserBidsError(err.message);
      } finally {
        setUserBidsLoading(false);
      }
    };
    fetchUserBids();
  }, []);

  if (!entry) return null;

  const openBidDialog = async (traveller) => {
    setBidDialog({ open: true, traveller });
    setBidStatus('');
    setBidLoading(true);
    try {
      const res = await fetch(`/bids/${traveller.id}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) {
        setBids(data.data);
        const userId = getUserIdFromToken();
        const my = data.data.find(b => b.sender_id === userId && b.status === 'active');
        setMyBid(my);
        setBidAmount(my ? my.amount : 100);
        setHighestBid(data.data.length > 0 ? Math.max(...data.data.filter(b => b.status === 'active').map(b => b.amount)) : 0);
      }
    } catch (err) {
      setBidStatus('Failed to load bids');
    } finally {
      setBidLoading(false);
    }
  };

  const closeBidDialog = () => {
    setBidDialog({ open: false, traveller: null });
    setBids([]);
    setMyBid(null);
    setBidAmount(100);
    setBidStatus('');
    setHighestBid(0);
  };

  const handleBidChange = (delta) => {
    setBidAmount(prev => Math.max((highestBid || 100), prev + delta));
  };

  const handleBidSubmit = async () => {
    setBidLoading(true);
    setBidStatus('');
    try {
      const userId = getUserIdFromToken();
      const res = await fetch('/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          trip_id: bidDialog.traveller.id,
          amount: bidAmount,
          sender_id: userId
        })
      });
      const data = await res.json();
      if (data.success) {
        setBidStatus('Bid placed/updated!');
        // Refresh bids
        openBidDialog(bidDialog.traveller);
      } else {
        setBidStatus(data.message || 'Failed to place bid');
      }
    } catch (err) {
      setBidStatus('Failed to place bid');
    } finally {
      setBidLoading(false);
    }
  };

  return (
    <CommonLayout bottomNavValue="/send-receive-list">
      <Box sx={{ px: 0, pt: 0 }}>
        <BackHeader title="Your Package Details" backTo="/send-receive-list" />
        <CommonCard>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>{entry.product_name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {entry.pickup_location}, {entry.pickup_country} ➜ {entry.delivery_location}, {entry.delivery_country}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Weight: {entry.weight} kg | Preferred Date: {new Date(entry.preferred_date).toLocaleDateString()}
            </Typography>
          </CardContent>
        </CommonCard>

        <Typography variant="h6" fontWeight={600} sx={{ mt: 2 }}>
          Available Travellers for Your Package
        </Typography>

        {loading && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CircularProgress color="inherit" />
          </Box>
        )}
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

        {!loading && matches.length === 0 && (
          <Typography sx={{ mt: 2 }}>No matching travellers found.</Typography>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {matches.map(traveller => {
      
            const currentUserId = getUserIdFromToken();
            const hasAcceptedBid = traveller.accepted_bid && traveller.accepted_bid.sender_id === currentUserId;
            
            return (
              <Grid item xs={12} key={traveller.id}>
                <CommonCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar src={traveller.avatar_url || ''} alt={traveller.username} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>{traveller.username}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {traveller.departure_airport} ➜ {traveller.arrival_airport} &nbsp;•&nbsp; {new Date(traveller.flight_departure_datetime).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {traveller.free_baggage_kg || '?'} kg baggage space • Bid {traveller.suggested_bid || '?'} Connects
                        </Typography>
                        {traveller.notes && <Typography variant="body2" sx={{ mt: 0.5 }}>{traveller.notes}</Typography>}
                        {/* Debug info */}
                        {traveller.accepted_bid && (
                          <Typography variant="caption" color="text.secondary">
                            Accepted bid: {traveller.accepted_bid.amount} by user {traveller.accepted_bid.sender_id}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                      <Button variant="outlined" fullWidth onClick={() => navigate('/traveller-details', { state: { traveller } })}>View Details</Button>
                      <Button variant="contained" fullWidth color="primary" onClick={() => openBidDialog(traveller)}>Place Bid</Button>
                      {hasAcceptedBid && (
                        <Button 
                          variant="contained" 
                          color="success" 
                          fullWidth 
                          onClick={() => navigate('/chat', { state: { trip: traveller, acceptedBid: traveller.accepted_bid } })}
                        >
                          Start Chat
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </CommonCard>
              </Grid>
            );
          })}
        </Grid>

        <Typography variant="h6" fontWeight={600} sx={{ mt: 4 }}>
          Your Bids for This Package (All statuses)
        </Typography>
        {userBidsLoading && (
          <Box sx={{ mt: 2 }}><CircularProgress size={20} /></Box>
        )}
        {userBidsError && (
          <Typography color="error" sx={{ mt: 2 }}>{userBidsError}</Typography>
        )}
        {!userBidsLoading && !userBidsError && (
          userBids.length === 0 ? (
            <Typography sx={{ mt: 1 }}>You have not placed any bids yet.</Typography>
          ) : (
            <Box component="ul" sx={{ mt: 1, pl: 3 }}>
              {userBids.map(bid => (
                <li key={bid.id}>
                  Trip #{bid.trip_id} — {bid.amount} Connects ({bid.status})
                </li>
              ))}
            </Box>
          )
        )}
      </Box>
      
      <Dialog open={bidDialog.open} onClose={closeBidDialog}>
        <DialogTitle>Bid for Trip</DialogTitle>
        <DialogContent>
          {bidLoading ? <CircularProgress /> : (
            <>
              <Typography gutterBottom>Highest Active Bid: {highestBid || 100} Connects</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => handleBidChange(-10)} disabled={bidAmount <= (highestBid || 100)}><RemoveIcon /></IconButton>
                <TextField value={bidAmount} size="small" sx={{ width: 80, mx: 1 }} inputProps={{ readOnly: true, style: { textAlign: 'center' } }} />
                <IconButton onClick={() => handleBidChange(10)}><AddIcon /></IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {myBid ? `Your current bid: ${myBid.amount} Connects (Status: ${myBid.status})` : 'No active bid yet.'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {bidStatus}
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>All Bids:</Typography>
              {bids.length === 0 ? <Typography>No bids yet.</Typography> : (
                <ul>
                  {bids.map(bid => (
                    <li key={bid.id}>{bid.username}: {bid.amount} Connects ({bid.status})</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBidDialog}>Close</Button>
          <Button onClick={handleBidSubmit} disabled={bidLoading || bidAmount < (highestBid || 100)} variant="contained">{myBid ? 'Update Bid' : 'Place Bid'}</Button>
        </DialogActions>
      </Dialog>
    </CommonLayout>
  );
};

export default SendReceiveDetail;
