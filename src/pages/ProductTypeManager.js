import React, { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, MenuItem, Select, InputLabel, FormControl, Switch, FormControlLabel, Paper, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import CommonLayout, { CommonCard, CommonTitle, BackHeader } from '../components/CommonLayout';
import DeleteIcon from '@mui/icons-material/Delete';

const ProductTypeManager = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [form, setForm] = useState({
    name: '',
    measurement_unit: 'piece',
    requires_weight: true
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProductTypes = () => {
    fetch('/product-types')
      .then(res => res.json())
      .then(data => setProductTypes(data))
      .catch(() => setProductTypes([]));
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/product-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add product type');
      setSuccess('Product type added!');
      setForm({ name: '', measurement_unit: 'piece', requires_weight: true });
      fetchProductTypes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this product type?')) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/product-types/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product type');
      setSuccess('Product type deleted!');
      fetchProductTypes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonLayout bottomNavValue="/product-types">
      <BackHeader title="Product Type Management" />
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <CommonCard component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
        <Typography variant="h6">Add Product Type</Typography>
        <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" required />
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Measurement Unit</InputLabel>
          <Select name="measurement_unit" value={form.measurement_unit} label="Measurement Unit" onChange={handleChange}>
            <MenuItem value="piece">Piece</MenuItem>
            <MenuItem value="quantity">Quantity</MenuItem>
            <MenuItem value="weight">Weight</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={form.requires_weight} onChange={e => setForm({ ...form, requires_weight: e.target.checked })} name="requires_weight" />}
          label="Requires Weight?"
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }} disabled={loading}>
          {loading ? 'Adding...' : 'Add Product Type'}
        </Button>
      </CommonCard>
      <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>All Product Types</Typography>
      <CommonCard>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Measurement Unit</TableCell>
              <TableCell>Requires Weight</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productTypes.map(pt => (
              <TableRow key={pt.id}>
                <TableCell>{pt.name}</TableCell>
                <TableCell>{pt.measurement_unit}</TableCell>
                <TableCell>{pt.requires_weight ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => handleDelete(pt.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </CommonCard>
    </CommonLayout>
  );
};

export default ProductTypeManager; 