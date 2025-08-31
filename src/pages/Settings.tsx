import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SettingsPage } from '@/components/profile/SettingsPage';
import { useAuth } from '@/hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6">
        {user && <SettingsPage user={user} />}
      </div>
    </ProtectedRoute>
  );
}