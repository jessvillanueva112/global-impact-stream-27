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
  HelpCircle
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type PrivacyLevel = 'internal' | 'ally' | 'donor' | 'public';

interface PrivacyOption {
  value: PrivacyLevel;
  label: string;
  description: string;
  icon: any;
  color: string;
  audience: string;
  examples: string[];
}

const privacyOptions: PrivacyOption[] = [
  {
    value: 'internal',
    label: 'Internal Only',
    description: 'Visible only to your organization staff',
    icon: Shield,
    color: 'text-blue-600',
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
    description: 'Shared with Ally Global Foundation headquarters',
    icon: Users,
    color: 'text-green-600',
    audience: 'Your team + Ally HQ',
    examples: [
      'Program updates and metrics',
      'Training requests',
      'Resource needs assessment'
    ]
  },
  {
    value: 'donor',
    label: 'Donor Reports',
    description: 'Included in donor reports and impact summaries',
    icon: Heart,
    color: 'text-orange-600',
    audience: 'Your team + Ally HQ + Donors',
    examples: [
      'Success stories (anonymized)',
      'Program impact metrics',
      'Community outcomes'
    ]
  },
  {
    value: 'public',
    label: 'Public Sharing',
    description: 'May be shared publicly for awareness and advocacy',
    icon: Globe,
    color: 'text-purple-600',
    audience: 'Everyone',
    examples: [
      'Community awareness campaigns',
      'Public education materials',
      'Advocacy success stories'
    ]
  }
];

interface PrivacyLevelSelectorProps {
  value: PrivacyLevel;
  onChange: (value: PrivacyLevel) => void;
  disabled?: boolean;
  showDescription?: boolean;
  className?: string;
}

export function PrivacyLevelSelector({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  className = ""
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

      {/* Crisis Alert Notice */}
      {value === 'internal' && (
        <div className="text-xs text-muted-foreground">
          <Info className="h-3 w-3 inline mr-1" />
          Crisis situations will automatically escalate regardless of privacy setting
        </div>
      )}
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