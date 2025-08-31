export interface Partner {
  id: string;
  name: string;
  country: string;
  language: string;
  access_level: string;
  created_at: Date;
}

export interface Submission {
  id: string;
  partner_id: string;
  content: string;
  media_files: Record<string, any>;
  privacy_level: string;
  timestamp: Date;
  processed: boolean;
}

export interface DatabaseConnectionStatus {
  success: boolean;
  message: string;
  data: any;
}