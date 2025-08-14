import React, { useState } from 'react';
import { TextField, Typography, Alert, Box, Stack, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CommonLayout, { CommonCard, CommonButton, SecondaryButton, CommonTitle, BackHeader } from '../components/CommonLayout';
// Auth helper to attach JWT token
import { authHeader } from '../utils/auth';
import FlightRoundedIcon from '@mui/icons-material/FlightRounded';
import { useAuth } from '../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TravelForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditing = location.state?.isEditing;
  const tripToEdit = location.state?.trip;
  
  const [form, setForm] = useState({
    current_location: tripToEdit?.current_location || '',
    current_country: tripToEdit?.current_country || '',
    departure_airport: tripToEdit?.departure_airport || '',
    layover_airport: tripToEdit?.layover_airport || '',
    arrival_airport: tripToEdit?.arrival_airport || '',
    flight_departure_datetime: tripToEdit?.flight_departure_datetime ? 
      new Date(tripToEdit.flight_departure_datetime).toISOString().slice(0, 16) : '',
    flight_arrival_datetime: tripToEdit?.flight_arrival_datetime ? 
      new Date(tripToEdit.flight_arrival_datetime).toISOString().slice(0, 16) : '',
    travelling_location: tripToEdit?.travelling_location || '',
    travelling_country: tripToEdit?.travelling_country || '',
    airplane_name: tripToEdit?.airplane_name || '',
    flight_number: tripToEdit?.flight_number || '',
    baggage_space_available: tripToEdit?.baggage_space_available || ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addConnectsDialog, setAddConnectsDialog] = useState({ open: false, required: 20, current: 0 });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION START ===');
    console.log('Form submitted!');
    console.log('Form data:', form);
    console.log('User:', user);
    
    if (!user) {
      console.log('ERROR: User not authenticated');
      toast.error('User not authenticated');
      setError('User not authenticated');
      return;
    }
    
    console.log('User authenticated:', user);
    
    // Validate form data
    const requiredFields = ['current_location', 'current_country', 'departure_airport', 'arrival_airport', 'flight_departure_datetime', 'flight_arrival_datetime', 'travelling_location', 'travelling_country', 'airplane_name', 'flight_number'];
    const missingFields = requiredFields.filter(field => !form[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    console.log('Form validation passed');
    setError(null);
    setSuccess(null);

    // Pre-check wallet balance to show prompt immediately if insufficient
    try {
      console.log('Pre-checking wallet balance...');
      const walletRes = await fetch('/wallet', { headers: { 'Content-Type': 'application/json', ...authHeader() } });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        const balance = Number(walletData.connects ?? 0);
        const minRequired = 20; // UI pre-check; backend remains source of truth
        console.log('Wallet balance:', balance, 'Min required:', minRequired);
        if (!isEditing && balance < minRequired) {
          const message = `You need at least ${minRequired} connects to create a trip. Current balance: ${balance}.`;
          toast.error(message);
          setAddConnectsDialog({ open: true, required: minRequired, current: balance });
          return; // Stop before calling backend
        }
      }
    } catch (preErr) {
      console.log('Wallet pre-check failed, proceeding with backend validation.', preErr);
    }

    setLoading(true);
    
    try {
      const url = isEditing ? `/travels/${tripToEdit.id}` : '/travels';
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('Sending travel request:', { url, method, form });
      console.log('Auth header:', authHeader());
      console.log('Token from localStorage:', localStorage.getItem('token'));
      
      // use auth header so backend passes authMiddleware
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(form)
      });
      
      console.log('Fetch request completed');
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      const data = await res.json();
      console.log('Travel form response:', { status: res.status, data });
      
      if (!res.ok) {
        // Handle specific error cases
        if (data.error === 'Insufficient connects') {
          const req = data.required ?? 20;
          const cur = data.current ?? 0;
          const message = `You need at least ${req} connects to create a trip. Current balance: ${cur}. Add connects to continue!`;
          toast.error(message);
          setAddConnectsDialog({ open: true, required: req, current: cur });
          throw new Error(message);
        } else {
          const errorMessage = data.error || `Failed to ${isEditing ? 'update' : 'save'} travel details`;
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
      }
      
             const successMessage = data.message || `Travel details ${isEditing ? 'updated' : 'saved'} successfully!`;
       toast.success(successMessage);
       setSuccess(successMessage);
       
       // Show additional info if KYC is not verified
       if (data.kyc_verified === false) {
         toast.info('Note: Your trip will not appear in search results until you complete KYC verification.');
       }
       
       // Navigate to trips page after successful save
       setTimeout(() => {
         navigate('/my-trips');
       }, 1500); // Wait 1.5 seconds for user to see success message
       
       if (!isEditing) {
         setForm({
           current_location: '',
           current_country: '',
           departure_airport: '',
           layover_airport: '',
           arrival_airport: '',
           flight_departure_datetime: '',
           flight_arrival_datetime: '',
           travelling_location: '',
           travelling_country: '',
           airplane_name: '',
           flight_number: '',
           baggage_space_available: ''
         });
       }
    } catch (err) {
      console.log('ERROR in form submission:', err);
      console.log('Error message:', err.message);
      console.log('Error stack:', err.stack);
      setError(err.message);
    } finally {
      console.log('Form submission completed');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <CommonLayout bottomNavValue="/travel-form">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Typography>Loading...</Typography>
        </Box>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout bottomNavValue="/travel-form">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <BackHeader title={isEditing ? 'Edit Trip' : "Let's log your trip"} backTo="/my-trips" />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

             <CommonCard>
         <Box component="form" onSubmit={handleSubmit} noValidate>
           <input type="hidden" name="test" value="test" />
           <input type="submit" style={{ display: 'none' }} />
                     <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
               <TextField label="Current Location" name="current_location" value={form.current_location} onChange={handleChange} fullWidth />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField label="Current Country" name="current_country" value={form.current_country} onChange={handleChange} fullWidth />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField label="Departure Airport" name="departure_airport" value={form.departure_airport} onChange={handleChange} fullWidth />
             </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Layover Airport" name="layover_airport" value={form.layover_airport} onChange={handleChange} fullWidth />
            </Grid>
                         <Grid item xs={12} sm={6}>
               <TextField label="Arrival Airport" name="arrival_airport" value={form.arrival_airport} onChange={handleChange} fullWidth />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField label="Flight Departure Date & Time" name="flight_departure_datetime" type="datetime-local" value={form.flight_departure_datetime} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField label="Flight Arrival Date & Time" name="flight_arrival_datetime" type="datetime-local" value={form.flight_arrival_datetime} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField label="Travelling Location" name="travelling_location" value={form.travelling_location} onChange={handleChange} fullWidth />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField label="Travelling Country" name="travelling_country" value={form.travelling_country} onChange={handleChange} fullWidth />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField label="Airplane Name" name="airplane_name" value={form.airplane_name} onChange={handleChange} fullWidth />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField label="Flight Number" name="flight_number" value={form.flight_number} onChange={handleChange} fullWidth />
             </Grid>
            <Grid item xs={12}>
              <TextField label="Baggage Space Available (kg)" name="baggage_space_available" type="number" value={form.baggage_space_available} onChange={handleChange} fullWidth inputProps={{ min: 0 }} />
            </Grid>
          </Grid>

          {!isEditing && (
            <Typography variant="body2" sx={{ mt: 3, mb: 1, textAlign: 'center', color: '#666' }}>
              Saving this trip will cost 20 Connects
            </Typography>
          )}

              <Stack direction="column" spacing={2} sx={{ mt: 2 }}>
             <CommonButton 
               onClick={(e) => {
                 e.preventDefault();
                 console.log('Save & Continue clicked');
                 handleSubmit(e);
               }}
               disabled={loading}
             >
               {loading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Trip' : 'Save & Continue')}
             </CommonButton>


           </Stack>
        </Box>
      </CommonCard>
      {/* Insufficient Connects Prompt */}
      <Dialog open={addConnectsDialog.open} onClose={() => setAddConnectsDialog({ ...addConnectsDialog, open: false })}>
        <DialogTitle>Insufficient Connects</DialogTitle>
        <DialogContent>
          <Typography>
            You need at least {addConnectsDialog.required} connects to create a trip. Your current balance is {addConnectsDialog.current}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddConnectsDialog({ ...addConnectsDialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={() => { setAddConnectsDialog({ ...addConnectsDialog, open: false }); navigate('/wallet/add'); }}>Add Connects</Button>
        </DialogActions>
      </Dialog>
    </CommonLayout>
  );
};

export default TravelForm;