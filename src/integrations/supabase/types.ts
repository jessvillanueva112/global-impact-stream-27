export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      crisis_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string | null
          description: string | null
          escalated: boolean | null
          escalated_at: string | null
          id: string
          partner_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          response_time_minutes: number | null
          severity: string
          status: string | null
          submission_id: string | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string | null
          description?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          id?: string
          partner_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_time_minutes?: number | null
          severity: string
          status?: string | null
          submission_id?: string | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string | null
          description?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          id?: string
          partner_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_time_minutes?: number | null
          severity?: string
          status?: string | null
          submission_id?: string | null
          title?: string
        }
        Relationships: []
      }
      file_metadata: {
        Row: {
          bucket_name: string
          created_at: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          original_name: string
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          original_name: string
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          original_name?: string
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      form_drafts: {
        Row: {
          created_at: string
          draft_data: Json
          id: string
          submission_type_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          draft_data?: Json
          id?: string
          submission_type_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          draft_data?: Json
          id?: string
          submission_type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_drafts_submission_type_id_fkey"
            columns: ["submission_type_id"]
            isOneToOne: false
            referencedRelation: "submission_types"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean | null
          address: string | null
          contact_email: string | null
          country: string
          created_at: string | null
          id: string
          language: string
          name: string
          org_type: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          contact_email?: string | null
          country: string
          created_at?: string | null
          id?: string
          language: string
          name: string
          org_type: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          contact_email?: string | null
          country?: string
          created_at?: string | null
          id?: string
          language?: string
          name?: string
          org_type?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          access_level: string
          country: string
          created_at: string
          id: string
          language: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          country: string
          created_at?: string
          id?: string
          language: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          country?: string
          created_at?: string
          id?: string
          language?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_level: string | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          id: string
          language: string | null
          name: string | null
          onboarded: boolean
          partner_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          id?: string
          language?: string | null
          name?: string | null
          onboarded?: boolean
          partner_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          id?: string
          language?: string | null
          name?: string | null
          onboarded?: boolean
          partner_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          download_count: number | null
          export_date: string | null
          exported_by: string | null
          format_type: string
          generated_content: Json | null
          id: string
          key_insights: string[] | null
          partner_id: string | null
          report_period_end: string | null
          report_period_start: string | null
          submission_ids: string[]
          summary: string | null
          survivor_stories: Json | null
        }
        Insert: {
          created_at?: string | null
          download_count?: number | null
          export_date?: string | null
          exported_by?: string | null
          format_type: string
          generated_content?: Json | null
          id?: string
          key_insights?: string[] | null
          partner_id?: string | null
          report_period_end?: string | null
          report_period_start?: string | null
          submission_ids: string[]
          summary?: string | null
          survivor_stories?: Json | null
        }
        Update: {
          created_at?: string | null
          download_count?: number | null
          export_date?: string | null
          exported_by?: string | null
          format_type?: string
          generated_content?: Json | null
          id?: string
          key_insights?: string[] | null
          partner_id?: string | null
          report_period_end?: string | null
          report_period_start?: string | null
          submission_ids?: string[]
          summary?: string | null
          survivor_stories?: Json | null
        }
        Relationships: []
      }
      submission_analytics: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          submission_id: string | null
          timestamp: string
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          submission_id?: string | null
          timestamp?: string
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          submission_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_analytics_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_types: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          max_character_limit: number | null
          name: string
          optional_fields: Json
          required_fields: Json
          supports_media: boolean | null
          supports_voice: boolean | null
          updated_at: string
          validation_rules: Json
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          max_character_limit?: number | null
          name: string
          optional_fields?: Json
          required_fields?: Json
          supports_media?: boolean | null
          supports_voice?: boolean | null
          updated_at?: string
          validation_rules?: Json
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          max_character_limit?: number | null
          name?: string
          optional_fields?: Json
          required_fields?: Json
          supports_media?: boolean | null
          supports_voice?: boolean | null
          updated_at?: string
          validation_rules?: Json
        }
        Relationships: []
      }
      submissions: {
        Row: {
          ai_analysis: Json | null
          audio_transcription: string | null
          character_count: number | null
          content: string
          content_approved: boolean | null
          created_at: string
          crisis_flag: boolean | null
          existing_survivors: number | null
          id: string
          media_files: Json | null
          new_survivors: number | null
          next_retry_at: string | null
          original_language: string | null
          partner_id: string
          pii_detected: boolean | null
          privacy_level: string
          processed: boolean
          processed_at: string | null
          processing_log: Json | null
          processing_status: string | null
          progress_step: number | null
          retry_count: number | null
          sentiment_score: number | null
          story_extraction: Json | null
          submission_category: string | null
          submission_type_id: string | null
          submitted_at: string | null
          survivor_anonymity_level: string | null
          survivor_count: number | null
          timestamp: string
          total_steps: number | null
          transcription_confidence: number | null
          translated_content: string | null
          translation_confidence: number | null
          updated_at: string
          urgency_level: string | null
          validation_errors: Json | null
          validation_overrides: Json | null
        }
        Insert: {
          ai_analysis?: Json | null
          audio_transcription?: string | null
          character_count?: number | null
          content: string
          content_approved?: boolean | null
          created_at?: string
          crisis_flag?: boolean | null
          existing_survivors?: number | null
          id?: string
          media_files?: Json | null
          new_survivors?: number | null
          next_retry_at?: string | null
          original_language?: string | null
          partner_id: string
          pii_detected?: boolean | null
          privacy_level?: string
          processed?: boolean
          processed_at?: string | null
          processing_log?: Json | null
          processing_status?: string | null
          progress_step?: number | null
          retry_count?: number | null
          sentiment_score?: number | null
          story_extraction?: Json | null
          submission_category?: string | null
          submission_type_id?: string | null
          submitted_at?: string | null
          survivor_anonymity_level?: string | null
          survivor_count?: number | null
          timestamp?: string
          total_steps?: number | null
          transcription_confidence?: number | null
          translated_content?: string | null
          translation_confidence?: number | null
          updated_at?: string
          urgency_level?: string | null
          validation_errors?: Json | null
          validation_overrides?: Json | null
        }
        Update: {
          ai_analysis?: Json | null
          audio_transcription?: string | null
          character_count?: number | null
          content?: string
          content_approved?: boolean | null
          created_at?: string
          crisis_flag?: boolean | null
          existing_survivors?: number | null
          id?: string
          media_files?: Json | null
          new_survivors?: number | null
          next_retry_at?: string | null
          original_language?: string | null
          partner_id?: string
          pii_detected?: boolean | null
          privacy_level?: string
          processed?: boolean
          processed_at?: string | null
          processing_log?: Json | null
          processing_status?: string | null
          progress_step?: number | null
          retry_count?: number | null
          sentiment_score?: number | null
          story_extraction?: Json | null
          submission_category?: string | null
          submission_type_id?: string | null
          submitted_at?: string | null
          survivor_anonymity_level?: string | null
          survivor_count?: number | null
          timestamp?: string
          total_steps?: number | null
          transcription_confidence?: number | null
          translated_content?: string | null
          translation_confidence?: number | null
          updated_at?: string
          urgency_level?: string | null
          validation_errors?: Json | null
          validation_overrides?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_submission_type_id_fkey"
            columns: ["submission_type_id"]
            isOneToOne: false
            referencedRelation: "submission_types"
            referencedColumns: ["id"]
          },
        ]
      }
      survivor_stories: {
        Row: {
          anonymity_level: string
          approved_for_advocacy: boolean | null
          approved_for_donors: boolean | null
          approved_for_public: boolean | null
          confidence_score: number | null
          content: string
          created_at: string | null
          estimated_read_time: number | null
          id: string
          impact_outcome: string | null
          partner_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sentiment: string | null
          submission_id: string | null
          title: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          anonymity_level: string
          approved_for_advocacy?: boolean | null
          approved_for_donors?: boolean | null
          approved_for_public?: boolean | null
          confidence_score?: number | null
          content: string
          created_at?: string | null
          estimated_read_time?: number | null
          id?: string
          impact_outcome?: string | null
          partner_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment?: string | null
          submission_id?: string | null
          title: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          anonymity_level?: string
          approved_for_advocacy?: boolean | null
          approved_for_donors?: boolean | null
          approved_for_public?: boolean | null
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          estimated_read_time?: number | null
          id?: string
          impact_outcome?: string | null
          partner_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment?: string | null
          submission_id?: string | null
          title?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
