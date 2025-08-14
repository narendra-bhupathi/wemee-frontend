import React, { useEffect, useState } from 'react';
import { Typography, Alert, CircularProgress } from '@mui/material';
import { fetchGreet } from '../api/userApi';

const GreetMessage = () => {
  const [greet, setGreet] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGreet()
      .then(data => setGreet(data.message))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return <Typography variant="h5" sx={{ mt: 2 }}>{greet}</Typography>;
};

export default GreetMessage; 