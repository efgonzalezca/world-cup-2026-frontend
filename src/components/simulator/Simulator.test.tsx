import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Simulator from './Simulator';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', nickname: 'test' }, token: 'tk' }),
}));

function fillAllInputs() {
  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0], { target: { value: '2' } });
  fireEvent.change(inputs[1], { target: { value: '1' } });
  fireEvent.change(inputs[2], { target: { value: '2' } });
  fireEvent.change(inputs[3], { target: { value: '1' } });
}

describe('Simulator', () => {
  it('renders title and description', () => {
    render(<Simulator />);
    expect(screen.getByText('Simulador de Puntos')).toBeInTheDocument();
    expect(screen.getByText(/resultado hipotético/)).toBeInTheDocument();
  });

  it('shows empty state hint when inputs are incomplete', () => {
    render(<Simulator />);
    expect(screen.getByText(/Completa ambos marcadores/)).toBeInTheDocument();
  });

  it('hides result breakdown until inputs are filled', () => {
    render(<Simulator />);
    // Result should not be visible initially
    expect(screen.queryByText('Desglose de Puntos')).not.toBeInTheDocument();
    expect(screen.queryByText('Total')).not.toBeInTheDocument();
  });

  it('has 4 score inputs', () => {
    render(<Simulator />);
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });
});
