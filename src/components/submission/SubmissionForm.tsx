import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VoiceRecorder } from "./VoiceRecorder";
import { ImageUpload } from "./ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Type, Camera, Send, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubmissionData {
  content: string;
  privacyLevel: 'internal' | 'ally' | 'donor' | 'public';
  type: 'voice' | 'text' | 'photo' | 'mixed';
  audioBlob?: Blob;
  images?: File[];
}

export const SubmissionForm = () => {
  const [submission, setSubmission] = useState<SubmissionData>({
    content: '',
    privacyLevel: 'ally',
    type: 'text'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  
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

    setIsSubmitting(true);
    
    try {
      // Simulate API call - in real app, this would upload to Supabase
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Submission Successful",
        description: "Your report has been submitted and is being processed.",
      });
      
      // Reset form
      setSubmission({
        content: '',
        privacyLevel: 'ally',
        type: 'text'
      });
      setActiveTab('text');
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support if the problem persists.",
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

          {/* Privacy Level Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy Level
            </Label>
            <Select 
              value={submission.privacyLevel} 
              onValueChange={(value: any) => setSubmission(prev => ({ ...prev, privacyLevel: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal Team Only</SelectItem>
                <SelectItem value="ally">Ally HQ Access</SelectItem>
                <SelectItem value="donor">Shareable with Donors</SelectItem>
                <SelectItem value="public">Public Communications</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Badge variant={getPrivacyBadgeVariant(submission.privacyLevel)}>
                {submission.privacyLevel.charAt(0).toUpperCase() + submission.privacyLevel.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {getPrivacyDescription(submission.privacyLevel)}
              </span>
            </div>
          </div>

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