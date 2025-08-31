import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { OnboardingFlow } from '@/components/profile/OnboardingFlow';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function Onboarding() {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const checkOnboardingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist, needs onboarding
            setNeedsOnboarding(true);
          } else {
            console.error('Error checking onboarding status:', error);
            navigate('/dashboard');
          }
        } else {
          if (data.onboarded) {
            navigate('/dashboard');
          } else {
            setNeedsOnboarding(true);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        navigate('/dashboard');
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  if (needsOnboarding === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {user && <OnboardingFlow user={user} />}
    </ProtectedRoute>
  );
}