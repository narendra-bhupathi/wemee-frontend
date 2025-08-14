import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Typography, Alert, CircularProgress } from '@mui/material';
import CommonLayout, { CommonCard, CommonTitle } from './CommonLayout';
import { fetchUsers } from '../api/userApi';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(data => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <CommonLayout>
      <CommonTitle>User List</CommonTitle>
      <CommonCard>
        <List>
          {users.length > 0 ? users.map(user => (
            <ListItem key={user.id} divider>
              <ListItemText
                primary={user.username || user.name}
                secondary={user.contact ? `Contact: ${user.contact}` : null}
              />
            </ListItem>
          )) : <ListItem><ListItemText primary="No users found." /></ListItem>}
        </List>
      </CommonCard>
    </CommonLayout>
  );
};

export default UserList; 