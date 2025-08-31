import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Users, 
  Heart, 
  Globe, 
  Info,
  HelpCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type PrivacyLevel = 'internal' | 'ally' | 'donor' | 'public';
export type SurvivorAnonymityLevel = 'none' | 'partial_name' | 'partial_location' | 'partial_exploitation' | 'full';

interface PrivacyOption {
  value: PrivacyLevel;
  label: string;
  description: string;
  icon: any;
  color: string;
  audience: string;
  examples: string[];
}

interface AnonymityOption {
  value: SurvivorAnonymityLevel;
  label: string;
  description: string;
  icon: any;
  details: string;
}

const privacyOptions: PrivacyOption[] = [
  {
    value: 'internal',
    label: 'Internal Only',
    description: 'Visible only to your organization staff for case management',
    icon: Lock,
    color: 'text-red-600',
    audience: 'Your team only',
    examples: [
      'Sensitive case details',
      'Internal staff communications',
      'Confidential survivor information'
    ]
  },
  {
    value: 'ally',
    label: 'Ally Network',
    description: 'Shared with Ally Global Foundation headquarters for coordination',
    icon: Shield,
    color: 'text-orange-600',
    audience: 'Your team + Ally HQ',
    examples: [
      'Program updates and metrics',
      'Training requests',
      'Resource coordination needs'
    ]
  },
  {
    value: 'donor',
    label: 'Donor Reports',
    description: 'May be included in donor reports and funding updates',
    icon: Heart,
    color: 'text-blue-600',
    audience: 'Your team + Ally HQ + Donors',
    examples: [
      'Impact stories (anonymized)',
      'Program outcomes',
      'Success metrics'
    ]
  },
  {
    value: 'public',
    label: 'Public Advocacy',
    description: 'Can be used publicly for awareness and advocacy campaigns',
    icon: Globe,
    color: 'text-green-600',
    audience: 'Everyone',
    examples: [
      'Community awareness campaigns',
      'Public education materials',
      'Advocacy testimonials'
    ]
  }
];

const anonymityOptions: AnonymityOption[] = [
  {
    value: 'full',
    label: 'Full Anonymity',
    description: 'No identifying information shared',
    icon: EyeOff,
    details: 'Complete anonymization - no names, locations, or identifying details'
  },
  {
    value: 'partial_name',
    label: 'Name Hidden',
    description: 'Name anonymized, other details may be shared',
    icon: Eye,
    details: 'Location and situation type visible, but name protected'
  },
  {
    value: 'partial_location',
    label: 'Location Hidden',
    description: 'Location anonymized, name and situation may be shared',
    icon: Eye,
    details: 'Name and exploitation type visible, but location protected'
  },
  {
    value: 'partial_exploitation',
    label: 'Situation Hidden',
    description: 'Exploitation type hidden, name and location may be shared',
    icon: Eye,
    details: 'Name and location visible, but exploitation details protected'
  },
  {
    value: 'none',
    label: 'Full Transparency',
    description: 'All information can be shared (with explicit consent)',
    icon: Eye,
    details: 'Complete transparency with explicit survivor consent only'
  }
];

interface PrivacyLevelSelectorProps {
  value: PrivacyLevel;
  onChange: (value: PrivacyLevel) => void;
  disabled?: boolean;
  showDescription?: boolean;
  className?: string;
  showSurvivorAnonymity?: boolean;
  survivorAnonymity?: SurvivorAnonymityLevel;
  onSurvivorAnonymityChange?: (value: SurvivorAnonymityLevel) => void;
}

export function PrivacyLevelSelector({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  className = "",
  showSurvivorAnonymity = false,
  survivorAnonymity = 'full',
  onSurvivorAnonymityChange
}: PrivacyLevelSelectorProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const selectedOption = privacyOptions.find(option => option.value === value);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Label htmlFor="privacy-level">Privacy Level</Label>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <h4 className="font-semibold">Privacy Level Guide</h4>
              <p className="text-sm text-muted-foreground">
                Choose who can access this submission. Higher levels include all previous audiences.
              </p>
              
              <div className="space-y-2">
                {privacyOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={option.value} className="flex items-start gap-2 text-sm">
                      <Icon className={`h-4 w-4 mt-0.5 ${option.color}`} />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-muted-foreground">{option.audience}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id="privacy-level">
          <SelectValue placeholder="Select privacy level" />
        </SelectTrigger>
        <SelectContent>
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${option.color}`} />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Selected Option Details */}
      {selectedOption && showDescription && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <selectedOption.icon className={`h-5 w-5 mt-0.5 ${selectedOption.color}`} />
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-medium">{selectedOption.label}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOption.description}
                  </p>
                </div>
                
                <div>
                  <Badge variant="outline" className="mb-2">
                    Audience: {selectedOption.audience}
                  </Badge>
                  
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium mb-1">Typical use cases:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {selectedOption.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Notice for Public Submissions */}
      {value === 'public' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800 mb-1">
                  Public Sharing Notice
                </p>
                <p className="text-orange-700">
                  Content marked as public may be used in awareness campaigns, 
                  social media, and advocacy materials. Personal information will 
                  be anonymized before public sharing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Survivor Anonymity Section */}
      {showSurvivorAnonymity && onSurvivorAnonymityChange && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Label>Survivor Anonymity Level</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-3">
                  <h4 className="font-semibold">Survivor Privacy Protection</h4>
                  <p className="text-sm text-muted-foreground">
                    Different survivors have different comfort levels with sharing their information. 
                    Always respect survivor preferences and obtain explicit consent.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Select 
            value={survivorAnonymity} 
            onValueChange={onSurvivorAnonymityChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select anonymity level" />
            </SelectTrigger>
            <SelectContent>
              {anonymityOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Selected Anonymity Details */}
          {(() => {
            const selectedAnonymity = anonymityOptions.find(option => option.value === survivorAnonymity);
            return selectedAnonymity ? (
              <Card className="bg-muted/30">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start gap-2">
                    <selectedAnonymity.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium">{selectedAnonymity.label}</p>
                      <p className="text-muted-foreground text-xs">{selectedAnonymity.details}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null;
          })()}
        </div>
      )}

      {/* Crisis Alert Notice */}
      {value === 'internal' && (
        <div className="text-xs text-muted-foreground">
          <Info className="h-3 w-3 inline mr-1" />
          Crisis situations will automatically escalate regardless of privacy setting
        </div>
      )}

      {/* Survivor Protection Notice */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                Child Protection & Survivor Safety
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                All information is handled according to strict child protection protocols. 
                Survivor stories are never shared without explicit consent and appropriate 
                anonymization. Safety is our highest priority.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Helper function to get privacy level information
 */
export function getPrivacyLevelInfo(level: PrivacyLevel): PrivacyOption {
  return privacyOptions.find(option => option.value === level) || privacyOptions[0];
}

/**
 * Helper function to check if content is suitable for privacy level
 */
export function validatePrivacyLevel(content: string, level: PrivacyLevel): { 
  isValid: boolean; 
  warnings: string[]; 
} {
  const warnings: string[] = [];
  
  // Check for sensitive information patterns
  const sensitivePatterns = [
    { pattern: /\b\d{10,}\b/g, message: 'Phone numbers detected' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, message: 'Email addresses detected' },
    { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, message: 'Credit card numbers detected' },
    { pattern: /(?:address|home|location|live|stay)[\s\w]*:\s*[\w\s,.-]+/gi, message: 'Physical addresses detected' }
  ];

  sensitivePatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content) && (level === 'donor' || level === 'public')) {
      warnings.push(message);
    }
  });

  // Additional checks for public content
  if (level === 'public') {
    if (content.toLowerCase().includes('confidential')) {
      warnings.push('Content marked as confidential should not be public');
    }
    
    if (content.toLowerCase().includes('survivor') && !content.toLowerCase().includes('anonymous')) {
      warnings.push('Consider anonymizing survivor references for public sharing');
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}