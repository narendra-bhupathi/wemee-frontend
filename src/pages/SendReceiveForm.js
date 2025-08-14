import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Alert, Box, MenuItem, Select, InputLabel, FormControl, Grid, Chip } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CommonLayout, { CommonCard, CommonButton, SecondaryButton, CommonSubtitle, BackHeader } from '../components/CommonLayout';
import { getUsernameFromToken, getUserIdFromToken } from '../utils/auth';

const SendReceiveForm = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    product_type_id: '',
    product_name: '',
    weight: '',
    product_image: null,
    preferred_date: '',
    pickup_location: '',
    pickup_country: '',
    delivery_location: '',
    delivery_country: ''
  });
  const [productTypes, setProductTypes] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [savedEntry, setSavedEntry] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const username = user?.username || getUsernameFromToken() || 'User';
  const userId = user?.id || getUserIdFromToken();

  // common dark input style with high-contrast text/label/border
  const inputStyle = {
    bgcolor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    backdropFilter: 'blur(2px)',
    '& .MuiInputBase-input': { color: '#fff' },      // typing text
    '& .MuiInputLabel-root': { color: '#ddd' },      // label text
    '& .MuiSvgIcon-root': { color: '#fff' },         // select arrow icon
    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
  };

  useEffect(() => {
    // Prefill when navigated with state
    if(location.state?.entry){
      const e = location.state.entry;
      setForm({
        product_type_id: e.product_type_id || '',
        product_name: e.product_name || '',
        weight: e.weight || '',
        product_image: null,
        preferred_date: e.preferred_date ? e.preferred_date.split('T')[0] : '',
        pickup_location: e.pickup_location || '',
        pickup_country: e.pickup_country || '',
        delivery_location: e.delivery_location || '',
        delivery_country: e.delivery_country || ''
      });
      setEditingId(e.id || null);
      if(e.product_image){
        setImagePreview(`/uploads/${e.product_image}`);
      }
    }
    fetch('/product-types')
      .then(res => res.json())
      .then(data => setProductTypes(data))
      .catch(() => setProductTypes([]));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    setForm({ ...form, product_image: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!userId) {
      setError('User not authenticated');
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_type_id', form.product_type_id);
    formData.append('product_name', form.product_name);
    formData.append('weight', form.weight);
    formData.append('preferred_date', form.preferred_date);
    formData.append('pickup_location', form.pickup_location);
    formData.append('pickup_country', form.pickup_country);
    formData.append('delivery_location', form.delivery_location);
    formData.append('delivery_country', form.delivery_country);
    if (form.product_image) formData.append('product_image', form.product_image);
    try {
      const url = editingId ? `/send-receive/${editingId}` : '/send-receive';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save entry');
      setSuccess('Entry saved successfully!');
      // redirect to list so user sees their saved packages
      navigate('/send-receive-list');
      setForm({
        product_type_id: '',
        product_name: '',
        weight: '',
        product_image: null,
        preferred_date: '',
        pickup_location: '',
        pickup_country: '',
        delivery_location: '',
        delivery_country: ''
      });
      setImagePreview(null);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!userId) {
      setError('User not authenticated');
      navigate('/login');
      return;
    }
    setSearchLoading(true);
    setSearchResults([]);
    setError(null);
    try {
      const res = await fetch('/send-receive/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_country: form.delivery_country,
          travelling_country: form.delivery_country, // match on delivery_country for both
          user_id: userId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch matches');
      setSearchResults(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSaveAndSearch = async e => {
    e.preventDefault();
    if (!userId) {
      setError('User not authenticated');
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_type_id', form.product_type_id);
    formData.append('product_name', form.product_name);
    formData.append('weight', form.weight);
    formData.append('preferred_date', form.preferred_date);
    formData.append('pickup_location', form.pickup_location);
    formData.append('pickup_country', form.pickup_country);
    formData.append('delivery_location', form.delivery_location);
    formData.append('delivery_country', form.delivery_country);
    if (form.product_image) formData.append('product_image', form.product_image);
    try {
      const url = editingId ? `/send-receive/${editingId}` : '/send-receive';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save entry');
      setSuccess('Entry saved successfully!');
      // redirect to list so user sees their saved packages
      navigate('/send-receive-list');
      // Now perform search
      setSearchLoading(true);
      const searchRes = await fetch('/send-receive/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_country: form.delivery_country,
          travelling_country: form.delivery_country,
          user_id: userId
        })
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.message || 'Failed to fetch matches');
      setSearchResults(searchData.data || []);
      setForm({
        product_type_id: '',
        product_name: '',
        weight: '',
        product_image: null,
        preferred_date: '',
        current_location: '',
        current_country: '',
        delivery_location: '',
        delivery_country: ''
      });
      setImagePreview(null);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const isFormComplete = () => {
    return (
      form.product_type_id &&
      form.product_name &&
      form.weight &&
      form.preferred_date &&
      form.pickup_location &&
      form.pickup_country &&
      form.delivery_location &&
      form.delivery_country
    );
  };

  return (
    <CommonLayout bottomNavValue="/send-receive-form">
      <BackHeader title={`Hey ${username}, Let's Add Your Package 📦`} backTo="/send-receive-list" />
      <CommonSubtitle sx={{ mb: 3 }}>
        And start matching with travellers
      </CommonSubtitle>
      
      <CommonCard>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel sx={{ color: '#666' }}>Product Type</InputLabel>
              <Select
                name="product_type_id"
                value={form.product_type_id}
                label="Product Type"
                onChange={handleChange}
                sx={{ color: '#333' }}
              >
                {productTypes.map(pt => (
                  <MenuItem key={pt.id} value={pt.id}>{pt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Product Name" name="product_name" value={form.product_name} onChange={handleChange} fullWidth margin="normal" required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Approximate Weight (kg)" name="weight" value={form.weight} onChange={handleChange} fullWidth margin="normal" required type="number" inputProps={{ min: 0 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Preferred Date" name="preferred_date" type="date" value={form.preferred_date} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" component="label" fullWidth sx={{ mt: 1 }}>
              Upload Product Image
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </Button>
            {imagePreview && <Box sx={{ mt: 2, textAlign: 'center' }}><img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200 }} /></Box>}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Pickup Location" name="pickup_location" value={form.pickup_location} onChange={handleChange} fullWidth margin="normal" required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Pickup Country" name="pickup_country" value={form.pickup_country} onChange={handleChange} fullWidth margin="normal" required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Delivery Location" name="delivery_location" value={form.delivery_location} onChange={handleChange} fullWidth margin="normal" required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Delivery Country" name="delivery_country" value={form.delivery_country} onChange={handleChange} fullWidth margin="normal" required />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <CommonButton disabled={loading || !isFormComplete()} onClick={handleSave}>
            {loading ? 'Saving...' : 'Save'}
          </CommonButton>
          <SecondaryButton disabled={!isFormComplete() || searchLoading} onClick={handleSearch}>
            {searchLoading ? 'Searching...' : 'Search'}
          </SecondaryButton>
          <CommonButton disabled={loading || searchLoading || !isFormComplete()} onClick={handleSaveAndSearch}>
            {loading || searchLoading ? 'Processing...' : 'Save & Search'}
          </CommonButton>
        </Box>
      </CommonCard>
      {/* Show saved entry card */}
      {savedEntry && (
        <CommonCard>
          <CommonSubtitle sx={{ color: '#333', mb: 2 }}>Your Entry</CommonSubtitle>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <CommonCard>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#333' }}>{savedEntry.product_name}</Typography>
                <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                  <strong>Weight:</strong> {savedEntry.weight} kg
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                  <strong>From:</strong> {savedEntry.current_location}, {savedEntry.current_country}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                  <strong>To:</strong> {savedEntry.delivery_location}, {savedEntry.delivery_country}
                </Typography>
              </CommonCard>
            </Grid>
          </Grid>
        </CommonCard>
      )}

      {searchResults.length > 0 && (
        <CommonCard>
          <CommonSubtitle sx={{ color: '#333', mb: 2 }}>Matching Travellers</CommonSubtitle>
          <Grid container spacing={3}>
            {searchResults.map(travel => (
              <Grid item xs={12} sm={6} md={4} key={travel.id}>
                <CommonCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#333' }}>{travel.username}</Typography>
                      <Chip label={travel.baggage_space_available ? `${travel.baggage_space_available} kg` : 'N/A'} color="primary" size="small" />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                      <strong>Contact:</strong> {travel.contact || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                      <strong>Route:</strong> {travel.departure_airport} ➜ {travel.arrival_airport}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                      <strong>Dates:</strong> {travel.flight_departure_datetime} - {travel.flight_arrival_datetime}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
                      <strong>Travelling:</strong> {travel.travelling_location}, {travel.travelling_country}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <CommonButton sx={{ fontSize: '12px', padding: '8px 16px' }}>Contact</CommonButton>
                  </Box>
                </CommonCard>
              </Grid>
            ))}
          </Grid>
        </CommonCard>
      )}
    </CommonLayout>
  );
};

export default SendReceiveForm;