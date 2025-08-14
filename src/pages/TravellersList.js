import React, { useEffect, useState } from 'react';
import { Typography, CircularProgress, Alert, Grid, CardContent, Chip, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField } from '@mui/material';
import CommonLayout, { CommonCard, CommonTitle, BackHeader } from '../components/CommonLayout';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { getUserIdFromToken, getToken } from '../utils/auth';

const TravellersList = () => {
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidDialog, setBidDialog] = useState({ open: false, trip: null });
  const [bids, setBids] = useState([]);
  const [myBid, setMyBid] = useState(null);
  const [bidAmount, setBidAmount] = useState(100);
  const [bidStatus, setBidStatus] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [highestBid, setHighestBid] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetch('/travels')
      .then(res => res.json())
      .then(data => setTravels(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
    
    // Fetch wallet balance
    fetch('/bids/user/balance', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWalletBalance(data.balance);
        }
      })
      .catch(err => console.error('Failed to fetch wallet balance:', err));
  }, []);

  const openBidDialog = async (trip) => {
    setBidDialog({ open: true, trip });
    setBidStatus('');
    setBidLoading(true);
    try {
      const res = await fetch(`/bids/${trip.id}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
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
    setBidDialog({ open: false, trip: null });
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
          trip_id: bidDialog.trip.id,
          amount: bidAmount,
          sender_id: userId
        })
      });
      const data = await res.json();
      if (data.success) {
        setBidStatus('Bid placed/updated!');
        // Refresh bids
        openBidDialog(bidDialog.trip);
        // Update wallet balance
        fetch('/bids/user/balance', { headers: { 'Authorization': `Bearer ${getToken()}` } })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setWalletBalance(data.balance);
            }
          })
          .catch(err => console.error('Failed to update wallet balance:', err));
      } else {
        setBidStatus(data.message || 'Failed to place bid');
      }
    } catch (err) {
      setBidStatus('Failed to place bid');
    } finally {
      setBidLoading(false);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <CommonLayout bottomNavValue="/travellers">
      <BackHeader title="Travellers" />
      {travels.length === 0 ? (
        <Alert severity="info">No travellers found.</Alert>
      ) : (
        <Grid container spacing={3}>
          {travels.map(travel => (
            <Grid item xs={12} sm={6} md={4} key={travel.id}>
              <CommonCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">{travel.username}</Typography>
                    <Chip label={travel.baggage_space_available ? `${travel.baggage_space_available} kg` : 'N/A'} color="primary" size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Contact:</strong> {travel.contact || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Route:</strong> {travel.departure_airport} ➜ {travel.arrival_airport}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Dates:</strong> {travel.flight_departure_datetime} - {travel.flight_arrival_datetime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Travelling:</strong> {travel.travelling_location}, {travel.travelling_country}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Button variant="contained" size="small" onClick={() => openBidDialog(travel)}>
                    {myBid ? 'Edit Bid' : 'Place Bid'}
                  </Button>
                </Box>
              </CommonCard>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={bidDialog.open} onClose={closeBidDialog}>
        <DialogTitle>Bid for Trip</DialogTitle>
        <DialogContent>
          {bidLoading ? <CircularProgress /> : (
            <>
              <Typography gutterBottom>Your Wallet Balance: {walletBalance} Connects</Typography>
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

export default TravellersList;