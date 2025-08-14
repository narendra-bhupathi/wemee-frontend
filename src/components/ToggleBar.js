import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

/**
 * Pill-style toggle bar between two options.
 * Props:
 *   value: string ('travel' | 'send')
 *   onChange: (newValue) => void
 */
const ToggleBar = ({ value, onChange }) => {
  const handleChange = (_, newValue) => onChange(newValue);

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Tabs
        value={value}
        onChange={handleChange}
        centered
        variant="fullWidth"
        sx={{
          minHeight: 0,
          '& .MuiTabs-indicator': {
            display: 'none'
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '30px',
            mx: 0.5,
            minHeight: 0,
            py: 1,
            color: '#ffd600'
          },
          '& .Mui-selected': {
            bgcolor: '#fff',
            color: '#ff',
            boxShadow: '0 0 6px rgba(0,0,0,0.15)'
          },
          bgcolor: '#ffffff33',
          p: 0.5,
          borderRadius: '30px',
          backdropFilter: 'blur(4px)'
        }}
      >
        <Tab disableRipple label="Travel" value="travel" />
        <Tab disableRipple label="Send" value="send" />
      </Tabs>
    </Box>
  );
};

export default ToggleBar;
