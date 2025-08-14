import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getToken } from '../utils/auth';
import CommonLayout, { CommonCard, CommonButton, CommonSubtitle, BackHeader } from '../components/CommonLayout';
import { useNavigate } from 'react-router-dom';
import { walletApi } from '../api/walletApi';

const TripCard = ({ trip, onViewBids, onChat, onEdit, onCancel }) => {
  const navigate = useNavigate();
  // Treat upcoming trips with kyc_verified === false as "pending KYC" for display
  const normalizedStatus = trip.status === 'active' ? 'upcoming' : trip.status; // backward compat
  const derivedStatus = !trip.kyc_verified && normalizedStatus === 'upcoming' ? 'pending_kyc' : normalizedStatus;

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#28a745';
      case 'cancelled': return '#dc3545';
      case 'completed': return '#6c757d';
      case 'pending_kyc': return '#ffc107';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      case 'pending_kyc': return 'Pending KYC';
      default: return 'Unknown';
    }
  };

  return (
    <CommonCard sx={{ width: '100%', maxWidth: 380, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography fontWeight={600} sx={{ color: '#333' }}>
          {trip.departure_airport} ➜ {trip.arrival_airport}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: getStatusColor(derivedStatus),
            fontWeight: 'bold',
            backgroundColor: `${getStatusColor(derivedStatus)}20`,
            padding: '2px 8px',
            borderRadius: '12px'
          }}
        >
          {getStatusText(derivedStatus)}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mt: 0.5, color: '#666' }}>
        Date: {new Date(trip.flight_departure_datetime).toLocaleString()}
      </Typography>
      <Typography variant="body2" sx={{ color: '#666' }}>
        Airline: {trip.airplane_name}
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
        Flight #: {trip.flight_number}
      </Typography>
      {trip.connects_deducted && (
        <Typography variant="body2" sx={{ color: '#666', mb: 2, fontStyle: 'italic' }}>
          Connects deducted: {trip.connects_deducted}
        </Typography>
      )}
      {!trip.kyc_verified && normalizedStatus === 'upcoming' && (
        <Typography variant="body2" sx={{ color: '#b26a00', mb: 2 }}>
          Please complete your KYC to make this trip live in search results.
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {normalizedStatus === 'upcoming' && derivedStatus !== 'pending_kyc' && (
          <CommonButton 
            sx={{ fontSize: '12px', padding: '8px 16px' }}
            onClick={() => onViewBids(trip)}
          >
            View Bids
          </CommonButton>
        )}
        {derivedStatus === 'pending_kyc' && (
          <CommonButton 
            sx={{ fontSize: '12px', padding: '8px 16px', backgroundColor: '#17a2b8' }}
            onClick={() => navigate('/kyc-verification')}
          >
            Complete KYC
          </CommonButton>
        )}
        {normalizedStatus === 'upcoming' && !trip.has_accepted_bids && (
          <>
            <CommonButton 
              sx={{ fontSize: '12px', padding: '8px 16px', backgroundColor: '#ffc107' }}
              onClick={() => onEdit(trip)}
            >
              Edit
            </CommonButton>
            <CommonButton 
              sx={{ fontSize: '12px', padding: '8px 16px', backgroundColor: '#dc3545' }}
              onClick={() => onCancel(trip)}
            >
              Cancel
            </CommonButton>
          </>
        )}
        {trip.status === 'completed' && (
          <CommonButton 
            sx={{ fontSize: '12px', padding: '8px 16px' }}
            onClick={() => onChat(trip)}
          >
            Chat
          </CommonButton>
        )}
      </Box>
    </CommonCard>
  );
};

const MyTrips = () => {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0: Upcoming, 1: Completed, 2: Cancelled, 3: All
  const navigate = useNavigate();
  const [connectsDialogOpen, setConnectsDialogOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(null);
  const minRequired = 20;

  const fetchTrips = async () => {
    try {
      const res = await fetch('/travels/my', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setTrips(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleViewBids = (trip) => {
    navigate('/trip-bids', { state: { trip } });
  };

  const handleChat = (trip) => {
    navigate('/chat', { state: { trip } });
  };

  const handleEdit = (trip) => {
    navigate('/travel-form', { state: { trip, isEditing: true } });
  };

  const handleCancel = async (trip) => {
    if (window.confirm('Are you sure you want to cancel this trip? This action cannot be undone.')) {
      try {
        const response = await fetch(`/travels/${trip.id}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          alert(data.message || 'Trip cancelled successfully');
          // Refresh the trips list
          fetchTrips();
        } else {
          alert(data.error || 'Failed to cancel trip');
        }
      } catch (error) {
        alert('Error cancelling trip');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getFilteredTrips = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 0: // Upcoming
        return trips.filter(trip => 
          (trip.status === 'upcoming' || trip.status === 'active') && 
          new Date(trip.flight_departure_datetime) > now
        );
      case 1: // Completed
        return trips.filter(trip => trip.status === 'completed');
      case 2: // Cancelled
        return trips.filter(trip => trip.status === 'cancelled');
      case 3: // All
        return trips;
      default:
        return trips;
    }
  };

  const filteredTrips = getFilteredTrips();

  const handleAddTravelClick = async () => {
    try {
      let balance = currentBalance;
      if (balance === null) {
        const data = await walletApi.getBalance();
        balance = Number(data.connects ?? 0);
        setCurrentBalance(balance);
      }
      if (Number(balance) < minRequired) {
        setConnectsDialogOpen(true);
        return;
      }
    } catch (_e) {
      // On failure, allow navigation; backend will enforce
    }
    navigate('/travel-form');
  };

  return (
    <CommonLayout bottomNavValue="/my-trips">
      <BackHeader title="My Trips" />
      
      {/* Filter Tabs */}
      <CommonCard sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              color: '#666',
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '14px',
              minHeight: '48px'
            },
            '& .Mui-selected': {
              color: '#ffffff',
              fontWeight: 'bold'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#ffffff',
              height: '3px'
            }
          }}
        >
          <Tab label="Upcoming" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
          <Tab label="All" />
        </Tabs>
      </CommonCard>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : filteredTrips.length === 0 ? (
        <CommonCard sx={{ textAlign: 'center', py: 4 }}>
          <CommonSubtitle sx={{ color: '#666', mb: 3 }}>
            {activeTab === 0 && 'No upcoming trips.'}
            {activeTab === 1 && 'No completed trips.'}
            {activeTab === 2 && 'No cancelled trips.'}
            {activeTab === 3 && 'No trips logged yet.'}
          </CommonSubtitle>
          {activeTab === 3 && (
            <CommonButton onClick={handleAddTravelClick}>
              + Add Travel
            </CommonButton>
          )}
        </CommonCard>
      ) : (
        filteredTrips.map(t => (
          <TripCard 
            key={t.id} 
            trip={t} 
            onViewBids={handleViewBids}
            onChat={handleChat}
            onEdit={handleEdit}
            onCancel={handleCancel}
          />
        ))
      )}

      <Dialog open={connectsDialogOpen} onClose={() => setConnectsDialogOpen(false)}>
        <DialogTitle>Insufficient Connects</DialogTitle>
        <DialogContent>
          <Typography>
            You need at least {minRequired} connects to add a trip. Your current balance is {currentBalance ?? 0}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectsDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setConnectsDialogOpen(false); navigate('/wallet/add'); }}>Add Connects</Button>
        </DialogActions>
      </Dialog>
    </CommonLayout>
  );
};

export default MyTrips;
