import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Card, Grid, Text, Container, Button } from '@nextui-org/react';
import { Layout } from '@/components/layout';
import { useSession } from 'next-auth/react';
import { useHasPermission } from '@/hooks/usePermissions';
import { UserRole } from '@/types';

const AdminDashboard: NextPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const canViewUsers = useHasPermission([UserRole.ADMIN]);
  const canViewSystemActivity = useHasPermission([UserRole.ADMIN]);

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage system users, roles, and permissions',
      icon: '👥',
      path: '/admin/users',
      enabled: canViewUsers,
    },
    {
      title: 'System Activity',
      description: 'View system logs and activity',
      icon: '📊',
      path: '/admin/system-activity',
      enabled: canViewSystemActivity,
    },
  ];

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <Layout title="Admin Dashboard">
      <Container css={{ py: '$12' }}>
        <Text h1 css={{ mb: '$10' }}>Admin Dashboard</Text>
        
        <Grid.Container gap={2}>
          {adminCards.map((card, index) => (
            card.enabled && (
              <Grid xs={12} sm={6} md={4} key={index}>
                <Card 
                  isHoverable 
                  isPressable
                  onClick={() => router.push(card.path)}
                  css={{ h: '200px', p: '$6' }}
                >
                  <Card.Body css={{ p: 0, h: '100%' }}>
                    <Text h2 css={{ fontSize: '2.5rem', mb: '$4' }}>{card.icon}</Text>
                    <Text h3 css={{ fontSize: '$xl', mb: '$2' }}>{card.title}</Text>
                    <Text color="$gray600">{card.description}</Text>
                  </Card.Body>
                </Card>
              </Grid>
            )
          ))}
        </Grid.Container>
      </Container>
    </Layout>
  );
};

export default AdminDashboard;
