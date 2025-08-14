import { getToken } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Get user's KYC status
 * @returns {Promise<Object>} KYC status response
 */
export async function getKYCStatus() {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const response = await fetch(`${API_BASE_URL}/kyc/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch KYC status');
  }

  return response.json();
}

/**
 * Submit KYC verification with Aadhaar number
 * @param {string} aadhaarNumber - 12-digit Aadhaar number
 * @returns {Promise<Object>} KYC submission response
 */
export async function submitKYC(aadhaarNumber) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }

  // Validate Aadhaar number format
  const aadhaarRegex = /^\d{12}$/;
  if (!aadhaarRegex.test(aadhaarNumber)) {
    throw new Error('Aadhaar number must be exactly 12 digits');
  }

  const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ aadhaarNumber }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit KYC verification');
  }

  return data;
} 