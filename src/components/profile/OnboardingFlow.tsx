import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserProfile } from './UserProfile';
import { CheckCircle, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  country: string | null;
  language: string | null;
  avatar_url: string | null;
  bio: string | null;
  onboarded: boolean;
}

interface OnboardingFlowProps {
  user: User;
}

const onboardingSteps = [
  { id: 'profile', title: 'Complete Your Profile', description: 'Add your name, country, and language' },
  { id: 'avatar', title: 'Upload Profile Picture', description: 'Add a photo to personalize your account' },
  { id: 'bio', title: 'Write Your Bio', description: 'Tell us about your work and mission' }
];

export function OnboardingFlow({ user }: OnboardingFlowProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
        // If already onboarded, redirect to dashboard
        if (data.onboarded) {
          navigate('/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error loading profile',
        description: 'Failed to load your profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    if (updatedProfile.onboarded) {
      toast({
        title: 'Onboarding complete!',
        description: 'Welcome to Ally Impact Hub. Let\'s start tracking impact!',
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const getCompletionPercentage = () => {
    if (!profile) return 0;
    
    let completed = 0;
    const total = 4; // name, country, language, avatar/bio
    
    if (profile.name) completed++;
    if (profile.country) completed++;
    if (profile.language) completed++;
    if (profile.avatar_url || profile.bio) completed++;
    
    return (completed / total) * 100;
  };

  const getCompletedSteps = () => {
    if (!profile) return [];
    
    const completed = [];
    
    // Profile step (name, country, language)
    if (profile.name && profile.country && profile.language) {
      completed.push('profile');
    }
    
    // Avatar step
    if (profile.avatar_url) {
      completed.push('avatar');
    }
    
    // Bio step
    if (profile.bio) {
      completed.push('bio');
    }
    
    return completed;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const completedSteps = getCompletedSteps();
  const progress = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Welcome to Ally Impact Hub!</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Let's set up your profile so you can start tracking and sharing your impact stories.
          </p>
          
          {/* Progress */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile completion</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Steps Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onboardingSteps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                return (
                  <div key={step.id} className="flex items-center gap-4">
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-medium ${isCompleted ? 'text-green-700' : ''}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {isCompleted && (
                      <div className="text-sm text-green-600 font-medium">Complete</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        {profile && (
          <UserProfile 
            user={user} 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Skip for now
          </Button>
          
          {progress === 100 && (
            <Button onClick={() => navigate('/dashboard')} className="gap-2">
              Continue to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}