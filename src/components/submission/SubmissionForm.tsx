import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VoiceRecorder } from "./VoiceRecorder";
import { ImageUpload } from "./ImageUpload";
import { PrivacyLevelSelector, PrivacyLevel, SurvivorAnonymityLevel } from "../forms/PrivacyLevelSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Type, Camera, Send, Shield, User, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submissionService } from "@/services/submissionService";

interface SubmissionData {
  content: string;
  privacyLevel: PrivacyLevel;
  survivorAnonymityLevel: SurvivorAnonymityLevel;
  submissionType: string;
  type: 'voice' | 'text' | 'photo' | 'mixed';
  audioBlob?: Blob;
  images?: File[];
  title?: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  survivorCount?: number;
  newSurvivors?: number;
  existingSurvivors?: number;
  containsSurvivorStory?: boolean;
}

export const SubmissionForm = () => {
  const [submission, setSubmission] = useState<SubmissionData>({
    content: '',
    privacyLevel: 'ally',
    survivorAnonymityLevel: 'full',
    submissionType: 'general_report',
    type: 'text',
    urgencyLevel: 'medium',
    containsSurvivorStory: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [showSurvivorFields, setShowSurvivorFields] = useState(false);
  
  const { toast } = useToast();

  const handleVoiceRecording = (audioBlob: Blob) => {
    setSubmission(prev => ({
      ...prev,
      audioBlob,
      type: prev.images?.length ? 'mixed' : 'voice'
    }));
  };

  const handleImageUpload = (files: File[]) => {
    setSubmission(prev => ({
      ...prev,
      images: files,
      type: prev.audioBlob ? 'mixed' : 'photo'
    }));
  };

  const handleSubmit = async () => {
    if (!submission.content && !submission.audioBlob && !submission.images?.length) {
      toast({
        title: "Missing Content",
        description: "Please add content, voice recording, or images before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Validate survivor count logic if provided
    if (showSurvivorFields && submission.newSurvivors && submission.existingSurvivors && submission.survivorCount) {
      if (submission.newSurvivors + submission.existingSurvivors !== submission.survivorCount) {
        toast({
          title: "Survivor Count Mismatch",
          description: "New survivors + existing survivors must equal total survivors.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      const submissionData = {
        content: submission.content,
        privacyLevel: submission.privacyLevel,
        submissionType: submission.submissionType,
        audioBlob: submission.audioBlob,
        images: submission.images,
        title: submission.title,
        urgencyLevel: submission.urgencyLevel,
        newSurvivors: submission.newSurvivors,
        existingSurvivors: submission.existingSurvivors,
        totalSurvivors: submission.survivorCount,
        mediaFiles: {
          survivorAnonymityLevel: submission.survivorAnonymityLevel,
          containsSurvivorStory: submission.containsSurvivorStory
        }
      };

      const result = await submissionService.createSubmission(submissionData);
      
      toast({
        title: "Submission Successful",
        description: "Your report has been submitted and is being processed with AI analysis.",
      });
      
      // Reset form
      setSubmission({
        content: '',
        privacyLevel: 'ally',
        survivorAnonymityLevel: 'full',
        submissionType: 'general_report',
        type: 'text',
        urgencyLevel: 'medium',
        containsSurvivorStory: false
      });
      setActiveTab('text');
      setShowSurvivorFields(false);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or contact support if the problem persists.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrivacyBadgeVariant = (level: string) => {
    switch (level) {
      case 'internal': return 'destructive';
      case 'ally': return 'default';
      case 'donor': return 'secondary';
      case 'public': return 'outline';
      default: return 'outline';
    }
  };

  const getPrivacyDescription = (level: string) => {
    switch (level) {
      case 'internal': return 'Only your local team can see this';
      case 'ally': return 'Visible to Ally HQ staff';
      case 'donor': return 'Can be shared with donors';
      case 'public': return 'May be used in public communications';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Send className="h-4 w-4 text-primary-foreground" />
            </div>
            Submit Program Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Submission Type Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="photo" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Photos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="content">Program Update</Label>
                <Textarea
                  id="content"
                  placeholder="Share updates about survivor care, prevention activities, challenges, or success stories..."
                  value={submission.content}
                  onChange={(e) => setSubmission(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-32"
                />
                <p className="text-xs text-muted-foreground">
                  Write in your local language - automatic translation is available
                </p>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="space-y-4 mt-6">
              <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
              {submission.audioBlob && (
                <div className="p-4 bg-accent-success/10 rounded-lg border">
                  <p className="text-sm text-accent-success font-medium">
                    ✓ Voice recording captured and ready to submit
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="photo" className="space-y-4 mt-6">
              <ImageUpload onUpload={handleImageUpload} />
              {submission.images?.length && (
                <div className="p-4 bg-accent-success/10 rounded-lg border">
                  <p className="text-sm text-accent-success font-medium">
                    ✓ {submission.images.length} image(s) ready to submit
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Submission Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Brief title for this submission..."
                  value={submission.title || ''}
                  onChange={(e) => setSubmission(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="submission-type">Submission Type</Label>
                <Select 
                  value={submission.submissionType} 
                  onValueChange={(value) => setSubmission(prev => ({ ...prev, submissionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_report">General Report</SelectItem>
                    <SelectItem value="crisis_report">Crisis Report</SelectItem>
                    <SelectItem value="survivor_report">Survivor Update</SelectItem>
                    <SelectItem value="monthly_summary">Monthly Summary</SelectItem>
                    <SelectItem value="story_submission">Story Submission</SelectItem>
                    <SelectItem value="financial_report">Financial Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select 
                  value={submission.urgencyLevel} 
                  onValueChange={(value: any) => setSubmission(prev => ({ ...prev, urgencyLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="critical">Critical/Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="contains-survivor-story"
                  checked={submission.containsSurvivorStory}
                  onChange={(e) => {
                    setSubmission(prev => ({ ...prev, containsSurvivorStory: e.target.checked }));
                    setShowSurvivorFields(e.target.checked);
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="contains-survivor-story" className="text-sm">
                  This contains survivor information
                </Label>
              </div>
            </div>
          </div>

          {/* Survivor Data Fields */}
          {showSurvivorFields && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-800 dark:text-blue-200">Survivor Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-survivors">New Survivors</Label>
                  <Input
                    id="new-survivors"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={submission.newSurvivors || ''}
                    onChange={(e) => setSubmission(prev => ({ 
                      ...prev, 
                      newSurvivors: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="existing-survivors">Existing Survivors</Label>
                  <Input
                    id="existing-survivors"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={submission.existingSurvivors || ''}
                    onChange={(e) => setSubmission(prev => ({ 
                      ...prev, 
                      existingSurvivors: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="total-survivors">Total Survivors</Label>
                  <Input
                    id="total-survivors"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={submission.survivorCount || ''}
                    onChange={(e) => setSubmission(prev => ({ 
                      ...prev, 
                      survivorCount: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
              
              {submission.newSurvivors && submission.existingSurvivors && submission.survivorCount && 
               (submission.newSurvivors + submission.existingSurvivors !== submission.survivorCount) && (
                <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-950/30 rounded text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                  Numbers don't match: {submission.newSurvivors} + {submission.existingSurvivors} ≠ {submission.survivorCount}
                </div>
              )}
            </div>
          )}

          {/* Privacy Level Selection */}
          <PrivacyLevelSelector
            value={submission.privacyLevel}
            onChange={(value) => setSubmission(prev => ({ ...prev, privacyLevel: value }))}
            showSurvivorAnonymity={submission.containsSurvivorStory}
            survivorAnonymity={submission.survivorAnonymityLevel}
            onSurvivorAnonymityChange={(value) => setSubmission(prev => ({ ...prev, survivorAnonymityLevel: value }))}
            showDescription={true}
          />

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-primary hover:bg-primary-hover shadow-primary"
            size="lg"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Processing Submission...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Submit Update
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};