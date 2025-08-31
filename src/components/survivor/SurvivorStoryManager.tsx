import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Shield, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Globe,
  Save,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SurvivorAnonymityLevel } from '../forms/PrivacyLevelSelector';

interface SurvivorStory {
  id?: string;
  title: string;
  content: string;
  impact_outcome?: string;
  anonymity_level: SurvivorAnonymityLevel;
  approved_for_advocacy: boolean;
  approved_for_donors: boolean;
  approved_for_public: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  confidence_score?: number;
  reviewed_by?: string;
  review_notes?: string;
}

interface SurvivorStoryManagerProps {
  submissionId: string;
  partnerId: string;
  onStoryCreated?: (story: SurvivorStory) => void;
  initialStory?: SurvivorStory;
  mode?: 'create' | 'edit' | 'review';
}

export function SurvivorStoryManager({ 
  submissionId, 
  partnerId, 
  onStoryCreated, 
  initialStory,
  mode = 'create' 
}: SurvivorStoryManagerProps) {
  const [story, setStory] = useState<SurvivorStory>({
    title: '',
    content: '',
    impact_outcome: '',
    anonymity_level: 'full',
    approved_for_advocacy: false,
    approved_for_donors: false,
    approved_for_public: false,
    ...initialStory
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    setWordCount(story.content.split(' ').filter(word => word.length > 0).length);
  }, [story.content]);

  const handleSave = async () => {
    if (!story.title.trim() || !story.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and story content.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call - in real app, this would save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const savedStory = {
        ...story,
        id: story.id || Math.random().toString(36).substr(2, 9),
        word_count: wordCount,
        estimated_read_time: Math.ceil(wordCount / 200) // ~200 words per minute
      };

      onStoryCreated?.(savedStory);
      
      toast({
        title: "Story Saved",
        description: `Survivor story has been ${mode === 'edit' ? 'updated' : 'created'} successfully.`,
      });

      if (mode === 'create') {
        // Reset form for new story
        setStory({
          title: '',
          content: '',
          impact_outcome: '',
          anonymity_level: 'full',
          approved_for_advocacy: false,
          approved_for_donors: false,
          approved_for_public: false
        });
      }
      
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnonymityIcon = (level: SurvivorAnonymityLevel) => {
    switch (level) {
      case 'none': return Eye;
      case 'full': return EyeOff;
      default: return Shield;
    }
  };

  const getAnonymityColor = (level: SurvivorAnonymityLevel) => {
    switch (level) {
      case 'none': return 'text-green-600';
      case 'full': return 'text-red-600';
      default: return 'text-orange-600';
    }
  };

  const getAnonymityDescription = (level: SurvivorAnonymityLevel) => {
    switch (level) {
      case 'none': return 'Full transparency with explicit consent';
      case 'partial_name': return 'Name protected, other details visible';
      case 'partial_location': return 'Location protected, other details visible';
      case 'partial_exploitation': return 'Situation details protected';
      case 'full': return 'Complete anonymization';
      default: return 'Protected identity';
    }
  };

  const AnonymityIcon = getAnonymityIcon(story.anonymity_level);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            {mode === 'edit' ? 'Edit' : mode === 'review' ? 'Review' : 'Create'} Survivor Story
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === 'review' 
              ? 'Review and approve this survivor story for different audiences'
              : 'Create a meaningful story that respects survivor privacy and can inspire others'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Story Title */}
          <div className="space-y-2">
            <Label htmlFor="story-title">Story Title</Label>
            <Input
              id="story-title"
              placeholder="A meaningful title for this survivor's journey..."
              value={story.title}
              onChange={(e) => setStory(prev => ({ ...prev, title: e.target.value }))}
              disabled={mode === 'review'}
            />
          </div>

          {/* Story Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="story-content">Story Content</Label>
              <div className="text-xs text-muted-foreground">
                {wordCount} words • ~{Math.ceil(wordCount / 200)} min read
              </div>
            </div>
            <Textarea
              id="story-content"
              placeholder="Share the survivor's journey, challenges overcome, and positive impact. Focus on hope, resilience, and transformation while respecting their privacy..."
              value={story.content}
              onChange={(e) => setStory(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-32"
              disabled={mode === 'review'}
            />
          </div>

          {/* Impact Outcome */}
          <div className="space-y-2">
            <Label htmlFor="impact-outcome">Impact & Outcome</Label>
            <Textarea
              id="impact-outcome"
              placeholder="What positive changes or outcomes resulted from this survivor's journey? How has their life improved?"
              value={story.impact_outcome}
              onChange={(e) => setStory(prev => ({ ...prev, impact_outcome: e.target.value }))}
              className="min-h-20"
              disabled={mode === 'review'}
            />
          </div>

          <Separator />

          {/* Anonymity Level */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AnonymityIcon className={`h-5 w-5 ${getAnonymityColor(story.anonymity_level)}`} />
              <Label>Privacy Protection Level</Label>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { value: 'full', label: 'Full Anonymity' },
                { value: 'partial_name', label: 'Name Hidden' },
                { value: 'partial_location', label: 'Location Hidden' },
                { value: 'partial_exploitation', label: 'Situation Hidden' },
                { value: 'none', label: 'Full Transparency' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={story.anonymity_level === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStory(prev => ({ 
                    ...prev, 
                    anonymity_level: option.value as SurvivorAnonymityLevel 
                  }))}
                  disabled={mode === 'review'}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground">
              <Shield className="h-4 w-4 inline mr-1" />
              {getAnonymityDescription(story.anonymity_level)}
            </p>
          </div>

          <Separator />

          {/* Approval Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Sharing Permissions</Label>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Advocacy Use</p>
                    <p className="text-xs text-muted-foreground">Share with advocacy partners and campaigns</p>
                  </div>
                </div>
                <Switch
                  checked={story.approved_for_advocacy}
                  onCheckedChange={(checked) => setStory(prev => ({ ...prev, approved_for_advocacy: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <div>
                    <p className="font-medium text-sm">Donor Reports</p>
                    <p className="text-xs text-muted-foreground">Include in donor updates and funding reports</p>
                  </div>
                </div>
                <Switch
                  checked={story.approved_for_donors}
                  onCheckedChange={(checked) => setStory(prev => ({ ...prev, approved_for_donors: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Public Sharing</p>
                    <p className="text-xs text-muted-foreground">Use in public awareness and education</p>
                  </div>
                </div>
                <Switch
                  checked={story.approved_for_public}
                  onCheckedChange={(checked) => setStory(prev => ({ ...prev, approved_for_public: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Review Notes (for review mode) */}
          {mode === 'review' && (
            <div className="space-y-2">
              <Label htmlFor="review-notes">Review Notes</Label>
              <Textarea
                id="review-notes"
                placeholder="Add any notes about this review, concerns, or required changes..."
                value={story.review_notes}
                onChange={(e) => setStory(prev => ({ ...prev, review_notes: e.target.value }))}
                className="min-h-20"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={isSubmitting || (!story.title.trim() || !story.content.trim())}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  {mode === 'edit' ? 'Updating...' : mode === 'review' ? 'Reviewing...' : 'Saving...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {mode === 'edit' ? 'Update Story' : mode === 'review' ? 'Complete Review' : 'Save Story'}
                </div>
              )}
            </Button>
          </div>

          {/* Privacy Reminder */}
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800 dark:text-blue-200">
              <strong>Privacy Reminder:</strong> Always ensure you have explicit consent from the 
              survivor before creating or sharing their story. Stories should focus on hope, 
              resilience, and positive outcomes while protecting sensitive details according to 
              their anonymity preferences.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}