import { apiFetch } from '../utils/auth';

// Wallet API functions
export const walletApi = {
  // Get current balance
  getBalance: async () => {
    const response = await apiFetch('/wallet');
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    return response.json();
  },

  // Get transaction history
  getTransactions: async () => {
    const response = await apiFetch('/wallet/transactions');
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return response.json();
  },

  // Add connects
  addConnects: async (amount) => {
    const response = await apiFetch('/wallet/add', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add connects');
    }
    return response.json();
  },

  // Use connects for services
  useConnects: async (amount, description) => {
    const response = await apiFetch('/wallet/use', {
      method: 'POST',
      body: JSON.stringify({ amount, description })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to use connects');
    }
    return response.json();
  },

  // Earn connects for services
  earnConnects: async (amount, description) => {
    const response = await apiFetch('/wallet/earn', {
      method: 'POST',
      body: JSON.stringify({ amount, description })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to earn connects');
    }
    return response.json();
  },

  // Get wallet data (balance + transactions)
  getWalletData: async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        apiFetch('/wallet'),
        apiFetch('/wallet/transactions')
      ]);

      if (!balanceRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const balanceData = await balanceRes.json();
      const transactionsData = await transactionsRes.json();

      return {
        balance: balanceData.connects || 0,
        transactions: transactionsData
      };
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      throw error;
    }
  }
}; 