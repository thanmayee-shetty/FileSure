import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const input = () => screen.getByTestId('identifier-input');

/** Paste directly — typing 500 lines character by character is too slow. */
function paste(text: string) {
  fireEvent.change(input(), { target: { value: text } });
}

function mockViewport(desktop: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: desktop,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
  it('shows onboarding before anything is checked, with no error state', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Check CINs and LLPINs' })).toBeInTheDocument();
    expect(screen.getByTestId('onboarding')).toBeInTheDocument();
    expect(input()).not.toHaveAttribute('aria-invalid');
    expect(screen.getByTestId('disclosure')).toHaveTextContent('not verified against MCA records');
  });

  it('shows the empty-input message when checking blank input', async () => {
    render(<App />);
    paste('   \n\n');
    await userEvent.click(screen.getByTestId('check-button'));
    const empty = await screen.findByTestId('empty-state');
    expect(empty).toHaveTextContent('Paste identifiers to check');
    expect(empty).toHaveTextContent('Enter one CIN or LLPIN per line, for example L17110MH1973PLC019786 or AAA-1234.');
  });

  it('decodes the assignment CIN and LLPIN in a desktop table', async () => {
    render(<App />);
    paste('L17110MH1973PLC019786\n\nAAA-1234');
    await userEvent.click(screen.getByTestId('check-button'));

    const table = await screen.findByTestId('results-table');
    const rows = within(table).getAllByTestId('result-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Listed');
    expect(rows[0]).toHaveTextContent('Maharashtra');
    expect(rows[0]).toHaveTextContent('1973');
    expect(rows[0]).toHaveTextContent('Public limited Indian non-government company');
    expect(rows[0]).toHaveTextContent('Valid format');
    expect(rows[1]).toHaveTextContent('Not encoded in LLPIN');
    expect(screen.getByTestId('results-summary')).toHaveTextContent('1 blank line ignored');
    expect(screen.queryByText(/verified$/i)).not.toBeInTheDocument();
  });

  it('shows exact error messages for invalid identifiers', async () => {
    render(<App />);
    paste('AAA 1234\nX17110MH1973PLC019786\nhello');
    await userEvent.click(screen.getByTestId('check-button'));
    const rows = await screen.findAllByTestId('result-row');
    expect(rows[0]).toHaveTextContent('LLPIN must use a hyphen in the format AAA-1234.');
    expect(rows[1]).toHaveTextContent('Listing indicator must be L or U.');
    expect(rows[2]).toHaveTextContent('Unknown format');
    expect(rows[2]).toHaveTextContent('Could not identify this as a CIN or LLPIN.');
  });

  it('expands a row to show the decoded breakdown', async () => {
    render(<App />);
    paste('L17110MH1973PLC019786');
    await userEvent.click(screen.getByTestId('check-button'));
    await userEvent.click(await screen.findByRole('button', { name: 'Show details for line 1' }));
    expect(screen.getByLabelText('CIN segments')).toBeInTheDocument();
    expect(screen.getByTestId('decoded-fields')).toHaveTextContent('019786');
  });

  it('filters by validity and entity type, and searches errors', async () => {
    render(<App />);
    paste('L17110MH1973PLC019786\nAAA-1234\nAAA-12X4');
    await userEvent.click(screen.getByTestId('check-button'));
    await screen.findByTestId('results-table');

    await userEvent.click(within(screen.getByTestId('filter-validity')).getByRole('button', { name: /Invalid format/ }));
    expect(screen.getAllByTestId('result-row')).toHaveLength(1);

    await userEvent.click(within(screen.getByTestId('filter-validity')).getByRole('button', { name: /^All/ }));
    await userEvent.click(within(screen.getByTestId('filter-entity')).getByRole('button', { name: /LLPIN/ }));
    expect(screen.getAllByTestId('result-row')).toHaveLength(2);

    await userEvent.type(screen.getByTestId('results-search'), 'suffix');
    expect(screen.getAllByTestId('result-row')).toHaveLength(1);
  });

  it('refuses more than 500 identifiers and states how many to remove', async () => {
    render(<App />);
    paste(Array.from({ length: 506 }, () => 'AAA-1234').join('\n'));
    expect(screen.getByTestId('input-counter')).toHaveTextContent('506 of 500 — remove 6 to check');
    await userEvent.click(screen.getByTestId('check-button'));
    const alert = await screen.findByTestId('over-limit');
    expect(alert).toHaveTextContent('Too many identifiers');
    expect(alert).toHaveTextContent('Remove 6 identifiers and try again.');
    expect(screen.queryByTestId('results-panel')).not.toBeInTheDocument();
    expect(input()).toHaveValue(Array.from({ length: 506 }, () => 'AAA-1234').join('\n'));
  });

  it('checks exactly 500 identifiers', async () => {
    render(<App />);
    paste(Array.from({ length: 500 }, () => 'AAA-1234').join('\n'));
    await userEvent.click(screen.getByTestId('check-button'));
    await screen.findByTestId('results-table');
    expect(screen.getAllByTestId('result-row')).toHaveLength(500);
  });

  it('renders cards on mobile', async () => {
    mockViewport(false);
    render(<App />);
    paste('L17110MH1973PLC019786\nAAA-1234');
    await userEvent.click(screen.getByTestId('check-button'));
    const cards = await screen.findAllByTestId('result-card');
    expect(cards).toHaveLength(2);
    expect(screen.queryByTestId('results-table')).not.toBeInTheDocument();
    expect(cards[0]).toHaveTextContent('Maharashtra');
  });

  it('fills the sample and clears input', async () => {
    render(<App />);
    await userEvent.click(screen.getByTestId('sample-button'));
    expect((input() as HTMLTextAreaElement).value).toContain('L17110MH1973PLC019786');
    await userEvent.click(screen.getByTestId('clear-button'));
    expect(input()).toHaveValue('');
  });

  it('flags results as stale after the input changes', async () => {
    render(<App />);
    paste('AAA-1234');
    await userEvent.click(screen.getByTestId('check-button'));
    await screen.findByTestId('results-panel');
    paste('AAA-1234\nAAB-1234');
    expect(screen.getByTestId('stale-notice')).toBeInTheDocument();
  });
});
