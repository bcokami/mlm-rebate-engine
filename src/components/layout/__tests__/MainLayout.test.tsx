import { render, screen } from '@testing-library/react';
import MainLayout from '../MainLayout';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('MainLayout', () => {
  it('renders the layout with sidebar when authenticated', () => {
    // Mock authenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
    });

    render(
      <MainLayout>
        <div data-testid="test-content">Test Content</div>
      </MainLayout>
    );

    // Check if the sidebar is rendered
    expect(screen.getByText('MLM Rebate Engine')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Genealogy')).toBeInTheDocument();
    expect(screen.getByText('Shop')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByText('Rebates')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();

    // Check if the user name is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();

    // Check if the sign out link is displayed
    expect(screen.getByText('Sign Out')).toBeInTheDocument();

    // Check if the content is rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders the layout without sidebar when not authenticated', () => {
    // Mock unauthenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(
      <MainLayout>
        <div data-testid="test-content">Test Content</div>
      </MainLayout>
    );

    // Check if the sidebar is not rendered
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Genealogy')).not.toBeInTheDocument();
    expect(screen.queryByText('Shop')).not.toBeInTheDocument();
    expect(screen.queryByText('Wallet')).not.toBeInTheDocument();
    expect(screen.queryByText('Rebates')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();

    // Check if the sign in link is displayed
    expect(screen.getByText('Sign In')).toBeInTheDocument();

    // Check if the content is rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
