import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Play, Pause, Square, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  maxDuration?: number; // in seconds
}

export const VoiceRecorder = ({ onRecordingComplete, maxDuration = 300 }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermission('granted');
      streamRef.current = stream;
      return stream;
    } catch (error) {
      setPermission('denied');
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record voice notes.",
        variant: "destructive"
      });
      return null;
    }
  };

  const startRecording = async () => {
    const stream = streamRef.current || await requestPermission();
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
      onRecordingComplete(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setDuration(0);

    // Start duration timer
    intervalRef.current = setInterval(() => {
      setDuration(prev => {
        if (prev >= maxDuration) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.play();
      setIsPlaying(true);
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setDuration(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingProgress = () => (duration / maxDuration) * 100;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Recording Status */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Voice Recording</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-mono">{formatTime(duration)}</span>
              <span className="text-sm text-muted-foreground">/ {formatTime(maxDuration)}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${getRecordingProgress()}%` }}
              />
            </div>
          </div>

          {/* Recording Visualizer */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1 h-16">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse-soft"
                  style={{
                    height: `${Math.random() * 40 + 20}px`,
                    animationDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-gradient-primary hover:bg-primary-hover shadow-primary rounded-full h-16 w-16"
                disabled={permission === 'denied'}
              >
                <Mic className="h-6 w-6" />
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="rounded-full h-16 w-16 animate-pulse-soft"
              >
                <Square className="h-6 w-6" />
              </Button>
            )}

            {audioBlob && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={playRecording}
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 w-12"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button
                  onClick={resetRecording}
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 w-12"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>

                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-gradient-primary hover:bg-primary-hover shadow-primary rounded-full h-12 w-12"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          {permission === 'denied' && (
            <div className="text-center text-sm text-destructive">
              Please enable microphone access in your browser settings to record voice notes.
            </div>
          )}

          {audioBlob && (
            <div className="text-center text-sm text-accent-success">
              ✓ Recording saved! You can play it back or record a new one.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};