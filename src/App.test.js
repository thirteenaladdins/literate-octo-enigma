import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock the fetch API
global.fetch = jest.fn();

describe('App', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockClear();
    // Mock successful fetch response by default
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        artworks: [],
      }),
    });
  });

  it('renders without crashing', async () => {
    render(<App />);
  });

  it('renders collection switcher', async () => {
    render(<App />);
    
    // Wait for Suspense to resolve
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /experiments/i })).toBeInTheDocument();
    });
  });

  it('renders navigation', async () => {
    render(<App />);
    
    // Wait for Suspense to resolve
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});
