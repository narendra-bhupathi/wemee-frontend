import { createTheme } from '@mui/material/styles';

// Colors inspired by the provided design
const colors = {
  backgroundGradient: 'linear-gradient(180deg, #3A2E8B 0%, #2C5BD9 100%)',
  primary: '#6C3BFF',
  primaryHover: '#5A30D9',
  secondary: '#F1993A',
  secondaryHover: '#DD8833',
  cardBg: '#FFFFFF',
  textPrimaryDark: '#1A1A1A',
  textOnPrimary: '#FFFFFF',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: colors.primary, contrastText: colors.textOnPrimary },
    secondary: { main: colors.secondary },
    background: { default: '#0E1340', paper: colors.cardBg },
    text: { primary: colors.textPrimaryDark },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    h3: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, padding: '10px 16px' },
        containedPrimary: { boxShadow: '0 8px 24px rgba(108,59,255,0.35)' },
        containedSecondary: { boxShadow: '0 8px 24px rgba(241,153,58,0.35)' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },
  },
});

export { colors };
export default theme;


