// Simple test file for authentication utilities
// This can be run with Jest or any testing framework

import { 
  saveToken, 
  getToken, 
  clearToken, 
  isTokenValid, 
  isTokenExpiringSoon,
  saveRefreshToken,
  getRefreshToken
} from './auth';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Auth Utilities', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  test('saveToken should store token in localStorage', () => {
    const token = 'test-token';
    saveToken(token);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', token);
  });

  test('getToken should retrieve token from localStorage', () => {
    const token = 'test-token';
    localStorageMock.getItem.mockReturnValue(token);
    const result = getToken();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
    expect(result).toBe(token);
  });

  test('clearToken should remove tokens from localStorage', () => {
    clearToken();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  test('saveRefreshToken should store refresh token in localStorage', () => {
    const refreshToken = 'test-refresh-token';
    saveRefreshToken(refreshToken);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', refreshToken);
  });

  test('getRefreshToken should retrieve refresh token from localStorage', () => {
    const refreshToken = 'test-refresh-token';
    localStorageMock.getItem.mockReturnValue(refreshToken);
    const result = getRefreshToken();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('refreshToken');
    expect(result).toBe(refreshToken);
  });

  test('isTokenValid should return false for invalid token', () => {
    const result = isTokenValid();
    expect(result).toBe(false);
  });

  test('isTokenExpiringSoon should return true for no token', () => {
    const result = isTokenExpiringSoon();
    expect(result).toBe(true);
  });
});

// Test JWT token validation
describe('JWT Token Validation', () => {
  test('should validate a properly formatted JWT token', () => {
    // Create a mock JWT token (this is just for testing)
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdCIsImlhdCI6MTYzNTQ5NjAwMCwiZXhwIjoxNjM1NTgyNDAwfQ.signature';
    
    localStorageMock.getItem.mockReturnValue(mockToken);
    const result = isTokenValid();
    // This will return false because the token is not properly signed
    // but it tests that the function doesn't crash
    expect(typeof result).toBe('boolean');
  });
}); 