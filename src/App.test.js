import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('renders collection switcher', () => {
    render(<App />);
    // Collection switcher should be present
    expect(screen.getByRole('button', { name: /experiments/i })).toBeInTheDocument();
  });

  it('renders navigation', () => {
    render(<App />);
    // Navigation should be present
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
