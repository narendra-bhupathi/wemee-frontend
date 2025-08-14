import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert, 
  Stack,
  Card,
  CardContent,
  Divider,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CommonLayout, { CommonCard, CommonButton, CommonTitle, CommonSubtitle, BackHeader } from '../components/CommonLayout';
import { walletApi } from '../api/walletApi';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Styled components for the design
const HeaderSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  color: 'white',
}));

const WalletIcon = styled(AccountBalanceWalletIcon)(({ theme }) => ({
  fontSize: '2rem',
  marginRight: theme.spacing(1),
  color: '#ffffff',
}));

const BalanceSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const BalanceInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
}));

const BalanceAmount = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  color: '#333333',
  lineHeight: 1,
}));

const BalanceLabel = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: '#666666',
  marginTop: theme.spacing(0.5),
}));

const TransactionItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  '&:not(:last-child)': {
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
  },
}));

const TransactionText = styled(Typography)(({ theme }) => ({
  fontSize: '0.95rem',
  color: '#333333',
  fontWeight: 400,
}));

const TransactionAmount = styled(Typography)(({ theme, positive }) => ({
  fontSize: '0.95rem',
  fontWeight: 600,
  color: positive ? '#4caf50' : '#f44336',
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: '#666666',
  fontWeight: 600,
  marginBottom: theme.spacing(1),
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
}));

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadWalletData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const walletData = await walletApi.getWalletData();
      setBalance(walletData.balance);
      setTransactions(walletData.transactions);
    } catch (err) {
      console.error('Error loading wallet data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const handleBuyConnects = () => {
    navigate('/wallet/add');
  };

  // Format transaction amount based on type (credit = +, debit = -)
  const formatTransactionAmount = (transaction) => {
    const sign = transaction.type === 'credit' ? '+' : '-';
    return `${sign}${transaction.amount} Connects`;
  };

  // Check if transaction is positive (credit) or negative (debit)
  const isTransactionPositive = (transaction) => {
    return transaction.type === 'credit';
  };

  if (loading) {
    return (
      <CommonLayout bottomNavValue="/wallet">
        <BackHeader title="Wallet" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress size={40} />
        </Box>
      </CommonLayout>
    );
  }

  if (error) {
    return (
      <CommonLayout bottomNavValue="/wallet">
        <BackHeader title="Wallet" />
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <CommonButton onClick={loadWalletData}>
          Retry
        </CommonButton>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout bottomNavValue="/wallet">
      <BackHeader title="Wallet" />

      {/* Wallet Balance Card */}
      <CommonCard>
        <BalanceSection>
          <BalanceInfo>
            <CardTitle>
              Wallet Balance
            </CardTitle>
            <BalanceAmount>
              {balance}
            </BalanceAmount>
            <BalanceLabel>
              Connects
            </BalanceLabel>
          </BalanceInfo>
          <CommonButton
            onClick={handleBuyConnects}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <AddIcon sx={{ mr: 1 }} />
            Buy Connects
          </CommonButton>
        </BalanceSection>
      </CommonCard>

      {/* Transaction History Card */}
      <CommonCard>
        <Box sx={{ padding: 3, paddingBottom: 2 }}>
          <CardTitle>
            Transaction History
          </CardTitle>
        </Box>
        <Divider />
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <TransactionItem key={transaction.id}>
              <TransactionText>
                {transaction.description}
              </TransactionText>
              <TransactionAmount positive={isTransactionPositive(transaction)}>
                {formatTransactionAmount(transaction)}
              </TransactionAmount>
            </TransactionItem>
          ))
        ) : (
          <Box sx={{ padding: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No transactions yet
            </Typography>
          </Box>
        )}
      </CommonCard>
    </CommonLayout>
  );
};

export default Wallet;
