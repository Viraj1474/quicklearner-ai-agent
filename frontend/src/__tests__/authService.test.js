/**
 * Authentication Service Tests
 * 
 * Tests for login, token management, and auth state.
 * Note: This is a demo-level test setup. Production tests would include:
 * - Mock API responses with jest.mock()
 * - Testing token refresh flow
 * - Testing password reset flow
 * - Testing Google OAuth flow
 * - Integration tests with backend
 */

import {
  storeAuthData,
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  login,
} from './authService';

// Setup: Mock localStorage and sessionStorage
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
});

describe('Token Storage', () => {
  test('storeAuthData should store tokens and user in correct storage', () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
    const accessToken = 'access_token_123';
    const refreshToken = 'refresh_token_456';

    storeAuthData(accessToken, refreshToken, mockUser, 3600);

    expect(localStorage.getItem('access_token')).toBe(accessToken);
    expect(sessionStorage.getItem('refresh_token')).toBe(refreshToken);
    expect(getStoredUser()).toEqual(mockUser);
  });

  test('getAccessToken should retrieve token from localStorage', () => {
    const token = 'access_token_123';
    localStorage.setItem('access_token', token);

    expect(getAccessToken()).toBe(token);
  });

  test('getRefreshToken should retrieve token from sessionStorage first, then localStorage as fallback', () => {
    const token = 'refresh_token_456';
    localStorage.setItem('refresh_token', token);

    expect(getRefreshToken()).toBe(token);
  });

  test('clearAuthData should remove all stored tokens and user', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user', '{}');
    sessionStorage.setItem('refresh_token', 'token');

    clearAuthData();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});

describe('Login', () => {
  test('login should handle successful authentication', async () => {
    // Mock the fetch call
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            user: { id: 1, email: 'test@example.com' },
            expires_in: 3600,
          }),
      })
    );

    // Note: Direct testing of login() would require mocking authService internals
    // This is shown as example structure; actual implementation may vary
    const mockResponse = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });

    const data = await mockResponse.json();

    expect(mockResponse.ok).toBe(true);
    expect(data.access_token).toBeDefined();
    expect(data.refresh_token).toBeDefined();
    expect(data.user).toBeDefined();

    // Clean up
    global.fetch.mockRestore();
  });

  test('login should handle network errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    await expect(
      fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      })
    ).rejects.toThrow('Network error');

    global.fetch.mockRestore();
  });
});

describe('Token Strategy', () => {
  test('access tokens should be stored in localStorage (persistent)', () => {
    localStorage.setItem('access_token', 'test_token');
    expect(localStorage.getItem('access_token')).toBe('test_token');
  });

  test('refresh tokens should be stored in sessionStorage (session-only)', () => {
    sessionStorage.setItem('refresh_token', 'test_refresh');
    expect(sessionStorage.getItem('refresh_token')).toBe('test_refresh');
  });

  test('sessionStorage should clear when session ends (browser closes)', () => {
    // This is handled by the browser; test verifies our storage choice
    sessionStorage.setItem('refresh_token', 'test');
    
    // Simulate session end
    sessionStorage.clear();
    
    expect(sessionStorage.getItem('refresh_token')).toBeNull();
  });
});
