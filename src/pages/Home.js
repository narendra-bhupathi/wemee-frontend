import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Flight as FlightIcon,
  AccountBalanceWallet as WalletIcon,
  LocalShipping as ShippingIcon,
  Inventory as PackageIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import ToggleBar from '../components/ToggleBar';
import CommonLayout, { CommonCard, CommonButton, SecondaryButton, CommonTitle, CommonSubtitle } from '../components/CommonLayout';
import { getUsernameFromToken, authHeader } from '../utils/auth';
import { walletApi } from '../api/walletApi';

const HeaderSection = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '20px'
});

const AirplaneIcon = styled(FlightIcon)({
  color: '#FFFFFF',
  fontSize: '32px',
  transform: 'rotate(45deg)',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '20px',
    height: '2px',
    background: 'rgba(255,255,255,0.3)',
    right: '-15px',
    top: '50%',
    transform: 'translateY(-50%)'
  }
});

const NoContentText = styled(Typography)({
  color: '#424242',
  fontSize: '18px',
  fontWeight: 'normal',
  marginBottom: '24px'
});

const PackageIconStyled = styled(PackageIcon)({
  fontSize: '80px',
  color: '#D2B48C',
  marginBottom: '24px'
});

const LocationPin1 = styled(LocationIcon)({
  fontSize: '24px',
  color: '#FF9800',
  position: 'absolute',
  left: '30%',
  top: '40%'
});

const LocationPin2 = styled(LocationIcon)({
  fontSize: '24px',
  color: '#FF9800',
  position: 'absolute',
  right: '30%',
  top: '40%'
});

// Info strip
const InfoStrip = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '20px'
});

const InfoText = styled(Typography)({
  color: '#424242',
  fontSize: '16px',
  fontWeight: 'normal'
});

const ShippingIconStyled = styled(ShippingIcon)({
  color: '#D2B48C',
  fontSize: '20px'
});

const Home = ({ user }) => {
  const username = user?.username || getUsernameFromToken() || 'User';
  const [mode, setMode] = useState(() => localStorage.getItem('homeMode') || 'travel');
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [travellersThisWeek, setTravellersThisWeek] = useState(null);
  const [sendersThisWeek, setSendersThisWeek] = useState(null);
  const [connectsDialogOpen, setConnectsDialogOpen] = useState(false);
  const [myTrips, setMyTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  const navigate = useNavigate();
  const isTravel = mode === 'travel';
  const minRequired = 20;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await walletApi.getBalance();
        if (isMounted) setBalance(data.connects ?? 0);
      } catch (e) {
        if (isMounted) setBalance(0);
      } finally {
        if (isMounted) setBalanceLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [travRes, sendRes] = await Promise.all([
          fetch('/travels/stats/week', { headers: { 'Content-Type': 'application/json' } }),
          fetch('/send-receive/stats/week', { headers: { 'Content-Type': 'application/json' } })
        ]);
        const travData = await travRes.json();
        const sendData = await sendRes.json();
        if (isMounted) {
          setTravellersThisWeek(travData.count ?? 0);
          setSendersThisWeek(sendData.count ?? 0);
        }
      } catch (e) {
        if (isMounted) {
          setTravellersThisWeek(0);
          setSendersThisWeek(0);
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Load user's trips to show upcoming and ongoing under Travel mode
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setTripsLoading(true);
      try {
        const res = await fetch('/travels/my', { headers: { 'Content-Type': 'application/json', ...authHeader() } });
        const data = await res.json();
        if (isMounted && res.ok) {
          setMyTrips(Array.isArray(data) ? data : []);
        }
      } catch (_) {
        if (isMounted) setMyTrips([]);
      } finally {
        if (isMounted) setTripsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const getUpcomingAndOngoingTrips = () => {
    const now = new Date();
    const list = myTrips.filter(t => (t.status === 'upcoming' || t.status === 'active') && new Date(t.flight_arrival_datetime) > now);
    // Sort nearest to oldest: ongoing first by arrival, then upcoming by departure
    list.sort((a,b) => {
      const aDep = new Date(a.flight_departure_datetime);
      const bDep = new Date(b.flight_departure_datetime);
      const aArr = new Date(a.flight_arrival_datetime);
      const bArr = new Date(b.flight_arrival_datetime);
      const aKey = aDep < now ? aArr : aDep;
      const bKey = bDep < now ? bArr : bDep;
      return aKey - bKey;
    });
    return list;
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <CommonLayout bottomNavValue="/home">
      {/* Header Section with logo and name */}
      <HeaderSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800 }}>WEMEE</Typography>
        </Box>
        <AirplaneIcon />
      </HeaderSection>

      <Box>
        <CommonTitle>Hey {username},</CommonTitle>
        <CommonTitle>Ready to {isTravel ? 'Fly & Earn' : 'Send'}?</CommonTitle>
        <CommonSubtitle>
          {isTravel ? 'Turn your baggage into cash' : 'Ship your package with trusted travelers'}
        </CommonSubtitle>
      </Box>

      {/* Wallet Summary */}
      <CommonCard sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <WalletIcon sx={{ color: '#28a745' }} />
            <Typography fontWeight={600} color="#333">Wallet Connects</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography fontWeight={700} color="#333">
              {balanceLoading ? '...' : `${balance} Connects`}
            </Typography>
            <SecondaryButton variant="contained" onClick={() => navigate('/wallet/add')}>Buy Connects</SecondaryButton>
          </Box>
        </Box>
      </CommonCard>

      {/* Toggle Bar */}
      <ToggleBar 
        value={mode} 
        onChange={(val) => {
          setMode(val);
          localStorage.setItem('homeMode', val);
        }}
      />

      {/* Main Content Card */}
      <CommonCard>
        {isTravel ? (
          <>
            {tripsLoading ? (
              <NoContentText>Loading your trips...</NoContentText>
            ) : (
              (() => {
                const trips = getUpcomingAndOngoingTrips();
                if (trips.length === 0) {
                  return (
                    <>
                      <NoContentText>No trips logged yet</NoContentText>
                      <Box sx={{ position: 'relative', marginBottom: '24px' }}>
                        <PackageIconStyled />
                        <LocationPin1 />
                        <LocationPin2 />
                      </Box>
                    </>
                  );
                }
                return (
                  <Box sx={{ display: 'grid', gap: 12/8, mb: 2, gridTemplateColumns: '1fr', '@media (min-width: 480px)': { gridTemplateColumns: '1fr' } }}>
                    {trips.map(trip => (
                      <Box
                        key={trip.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#fff',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          border: '1px solid rgba(0,0,0,0.06)',
                          cursor: 'pointer',
                          transition: 'transform 120ms ease, box-shadow 120ms ease',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(0,0,0,0.12)' }
                        }}
                        onClick={() => navigate('/trip-bids', { state: { trip } })}
                        role="button"
                        tabIndex={0}
                      >
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
                      </Box>
                    ))}
                  </Box>
                );
              })()
            )}
          </>
        ) : (
          <>
            <NoContentText>No packages yet</NoContentText>
            <Box sx={{ position: 'relative', marginBottom: '24px' }}>
              <PackageIconStyled />
              <LocationPin1 />
              <LocationPin2 />
            </Box>
          </>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <CommonButton variant="contained" size="small" sx={{ px: 2, py: 1, borderRadius: 999, fontWeight: 700 }} onClick={async () => {
          if (isTravel) {
            try {
              // Use loaded balance if available; otherwise fetch fresh
              let current = balance;
              if (current === null || balanceLoading) {
                const data = await walletApi.getBalance();
                current = Number(data.connects ?? 0);
              }
              if (Number(current) < minRequired) {
                setConnectsDialogOpen(true);
                return;
              }
            } catch (e) {
              // If balance fetch fails, still allow navigation; backend will validate
            }
            navigate('/travel-form');
          } else {
            navigate('/send-receive-form');
          }
         }}>
            {isTravel ? '+ Add Trip' : '+ Add Package'}
          </CommonButton>
        </Box>
      </CommonCard>

      {/* Connects requirement dialog for Add Travel */}
      <Dialog open={connectsDialogOpen} onClose={() => setConnectsDialogOpen(false)}>
        <DialogTitle>Insufficient Connects</DialogTitle>
        <DialogContent>
          <Typography>
            You need at least {minRequired} connects to add a trip. Your current balance is {balance ?? 0}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectsDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setConnectsDialogOpen(false); navigate('/wallet/add'); }}>Add Connects</Button>
        </DialogActions>
      </Dialog>

      {/* Info Strip */}
      <InfoStrip>
        <ShippingIconStyled />
        <InfoText>
          {isTravel 
            ? `${sendersThisWeek ?? '...'} Senders looking for co-travelers this week!`
            : `${travellersThisWeek ?? '...'} Travelers looking to deliver packages this week!`
          }
        </InfoText>
      </InfoStrip>
    </CommonLayout>
  );
};

export default Home; 