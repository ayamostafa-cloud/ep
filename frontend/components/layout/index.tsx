import { ReactNode } from 'react';
import Head from 'next/head';
import { Navbar, Text, useTheme, Container } from '@nextui-org/react';
import { useRouter } from 'next/router';
import { UserRole } from '@/types';
import { useSession, signOut } from 'next-auth/react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  roles?: UserRole[];
}

export const Layout = ({
  children,
  title = 'Admin Dashboard',
  description = 'System Administration Panel',
  roles = [],
}: LayoutProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  // Check if user has required role if roles are specified
  if (roles.length > 0 && !roles.includes(session.user.role as UserRole)) {
    return (
      <Container css={{ py: '$24', textAlign: 'center' }}>
        <Text h3>Access Denied</Text>
        <Text>You don't have permission to access this page.</Text>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>{`${title} | Admin Dashboard`}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
        <Navbar isBordered variant="sticky">
          <Navbar.Brand>
            <Text b color="inherit" hideIn="xs">
              HR System
            </Text>
          </Navbar.Brand>
          <Navbar.Content hideIn="xs" variant="highlight">
            <Navbar.Link 
              isActive={router.pathname === '/admin'} 
              href="/admin"
            >
              Dashboard
            </Navbar.Link>
            <Navbar.Link 
              isActive={router.pathname.startsWith('/admin/users')} 
              href="/admin/users"
            >
              Users
            </Navbar.Link>
            <Navbar.Link 
              isActive={router.pathname.startsWith('/admin/system-activity')} 
              href="/admin/system-activity"
            >
              System Activity
            </Navbar.Link>
          </Navbar.Content>
          <Navbar.Content>
            <Navbar.Item>
              <Text>{session.user?.name || session.user?.email}</Text>
            </Navbar.Item>
            <Navbar.Item>
              <button 
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme?.colors.text.value,
                  padding: '8px 12px',
                  borderRadius: '6px',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = theme?.colors.accents1.value;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Sign Out
              </button>
            </Navbar.Item>
          </Navbar.Content>
        </Navbar>

        <main style={{ flex: 1, padding: '20px 0' }}>
          {children}
        </main>

        <footer style={{ 
          padding: '20px', 
          textAlign: 'center', 
          borderTop: `1px solid ${theme?.colors.border.value}`,
          marginTop: 'auto'
        }}>
          <Text small color="$gray600">
            © {new Date().getFullYear()} HR System. All rights reserved.
          </Text>
        </footer>
      </div>
    </>
  );
};

export default Layout;
