import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Stack } from '@mui/material';
import CommonLayout, { CommonCard, CommonTitle, BackHeader } from '../components/CommonLayout';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/auth';

const AddConnects = () => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isNumeric = (val) => /^[0-9]*$/.test(val);

  const handleChange = (e) => {
    const val = e.target.value;
    if (isNumeric(val)) setAmount(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return setError('Enter amount in connects');
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/wallet/add', {
        method: 'POST',
        body: JSON.stringify({ amount: parseInt(amount, 10) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add connects');
      navigate('/wallet', { state: { updated: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonLayout bottomNavValue="/wallet">
      <BackHeader title="Add Connects" backTo="/wallet" />
      <CommonCard>
        <CommonTitle sx={{ display: 'none' }}>Add Connects</CommonTitle>
        {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
        <Stack spacing={3} component="form" onSubmit={handleSubmit} sx={{ maxWidth: 320 }}>
          <TextField
            label="Amount (Connects)"
            value={amount}
            onChange={handleChange}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            required
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Processing...' : 'Add'}
          </Button>
        </Stack>
      </CommonCard>
    </CommonLayout>
  );
};

export default AddConnects;
