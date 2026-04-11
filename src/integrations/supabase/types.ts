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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievement_cycles: {
        Row: {
          completed_at: string | null
          cycle_number: number
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cycle_number?: number
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cycle_number?: number
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: string | null
          code: string | null
          created_at: string
          description_en: string | null
          description_sv: string | null
          icon: string | null
          id: string
          name_en: string | null
          name_sv: string | null
          points: number
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string
          description_en?: string | null
          description_sv?: string | null
          icon?: string | null
          id?: string
          name_en?: string | null
          name_sv?: string | null
          points?: number
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string
          description_en?: string | null
          description_sv?: string | null
          icon?: string | null
          id?: string
          name_en?: string | null
          name_sv?: string | null
          points?: number
        }
        Relationships: []
      }
      ai_function_calls: {
        Row: {
          created_at: string
          function_name: string
          id: string
          match_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          match_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          match_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_function_calls_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rate_limit_buckets: {
        Row: {
          count: number
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          updated_at?: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      app_logs: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          level: string
          message: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          level: string
          message: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          level?: string
          message?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      appeals: {
        Row: {
          created_at: string
          email_sent: boolean | null
          id: string
          reason: string
          report_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          reason: string
          report_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          reason?: string
          report_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appeals_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_emails: {
        Row: {
          created_at: string
          created_by: string | null
          filters: Json | null
          id: string
          name: string
          results: Json | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          id?: string
          name: string
          results?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          id?: string
          name?: string
          results?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_emails_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: string | null
          revoked_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealbreakers: {
        Row: {
          created_at: string
          gender_preferences: string[] | null
          id: string
          max_age: number | null
          max_distance_km: number | null
          min_age: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gender_preferences?: string[] | null
          id?: string
          max_age?: number | null
          max_distance_km?: number | null
          min_age?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gender_preferences?: string[] | null
          id?: string
          max_age?: number | null
          max_distance_km?: number | null
          min_age?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealbreakers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          appeal_id: string | null
          campaign_id: string | null
          clicked_at: string | null
          created_at: string
          error_message: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          report_id: string | null
          status: string
          subject: string
          template_id: string | null
          template_name: string | null
        }
        Insert: {
          appeal_id?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          report_id?: string | null
          status?: string
          subject: string
          template_id?: string | null
          template_name?: string | null
        }
        Update: {
          appeal_id?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          report_id?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_appeal_id_fkey"
            columns: ["appeal_id"]
            isOneToOne: false
            referencedRelation: "appeals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_en: string | null
          body_sv: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          last_used: string | null
          name: string
          subject_en: string | null
          subject_sv: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body_en?: string | null
          body_sv: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_used?: string | null
          name: string
          subject_en?: string | null
          subject_sv: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body_en?: string | null
          body_sv?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_used?: string | null
          name?: string
          subject_en?: string | null
          subject_sv?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      expo_push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expo_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_members: {
        Row: {
          group_chat_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_chat_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_chat_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_messages: {
        Row: {
          content: string
          created_at: string
          group_chat_id: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_chat_id: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_chat_id?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_messages_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          message_type: string | null
          read_by: Json | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          message_type?: string | null
          read_by?: Json | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          message_type?: string | null
          read_by?: Json | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      host_profiles: {
        Row: {
          activated_at: string | null
          bio_extended: string | null
          cover_image_id: string | null
          created_at: string
          eligibility_notes: string | null
          eligible_via: string | null
          last_activity_at: string
          paused_at: string | null
          slug: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          bio_extended?: string | null
          cover_image_id?: string | null
          created_at?: string
          eligibility_notes?: string | null
          eligible_via?: string | null
          last_activity_at?: string
          paused_at?: string | null
          slug?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          bio_extended?: string | null
          cover_image_id?: string | null
          created_at?: string
          eligibility_notes?: string | null
          eligible_via?: string | null
          last_activity_at?: string
          paused_at?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      introductions: {
        Row: {
          accepted_by_a: boolean | null
          accepted_by_b: boolean | null
          created_at: string
          host_user_id: string
          id: string
          match_created: boolean
          message: string | null
          updated_at: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          accepted_by_a?: boolean | null
          accepted_by_b?: boolean | null
          created_at?: string
          host_user_id: string
          id?: string
          match_created?: boolean
          message?: string | null
          updated_at?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          accepted_by_a?: boolean | null
          accepted_by_b?: boolean | null
          created_at?: string
          host_user_id?: string
          id?: string
          match_created?: boolean
          message?: string | null
          updated_at?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: []
      }
      last_daily_matches: {
        Row: {
          date: string
          match_ids: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          date: string
          match_ids?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          date?: string
          match_ids?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      match_engagement_scores: {
        Row: {
          archetype_alignment: number | null
          avg_response_time_minutes: number | null
          conversation_duration_hours: number | null
          created_at: string | null
          id: string
          initiated_chat: boolean
          match_id: string | null
          match_type: string | null
          matched_user_id: string
          messages_received: number
          messages_sent: number
          outcome: string
          personality_distance: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archetype_alignment?: number | null
          avg_response_time_minutes?: number | null
          conversation_duration_hours?: number | null
          created_at?: string | null
          id?: string
          initiated_chat?: boolean
          match_id?: string | null
          match_type?: string | null
          matched_user_id: string
          messages_received?: number
          messages_sent?: number
          outcome?: string
          personality_distance?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archetype_alignment?: number | null
          avg_response_time_minutes?: number | null
          conversation_duration_hours?: number | null
          created_at?: string | null
          id?: string
          initiated_chat?: boolean
          match_id?: string | null
          match_type?: string | null
          matched_user_id?: string
          messages_received?: number
          messages_sent?: number
          outcome?: string
          personality_distance?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_engagement_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          anxiety_reduction_score: number | null
          archetype_score: number | null
          bio_preview: string | null
          common_interests: string[] | null
          compatibility_score: number
          created_at: string
          dimension_breakdown: Json | null
          icebreakers: string[] | null
          id: string
          match_age: number | null
          match_archetype: string | null
          match_date: string
          match_score: number | null
          match_type: string | null
          matched_user_id: string
          personality_insight: string | null
          photo_urls: string[] | null
          status: string | null
          user_id: string
        }
        Insert: {
          anxiety_reduction_score?: number | null
          archetype_score?: number | null
          bio_preview?: string | null
          common_interests?: string[] | null
          compatibility_score: number
          created_at?: string
          dimension_breakdown?: Json | null
          icebreakers?: string[] | null
          id?: string
          match_age?: number | null
          match_archetype?: string | null
          match_date?: string
          match_score?: number | null
          match_type?: string | null
          matched_user_id: string
          personality_insight?: string | null
          photo_urls?: string[] | null
          status?: string | null
          user_id: string
        }
        Update: {
          anxiety_reduction_score?: number | null
          archetype_score?: number | null
          bio_preview?: string | null
          common_interests?: string[] | null
          compatibility_score?: number
          created_at?: string
          dimension_breakdown?: Json | null
          icebreakers?: string[] | null
          id?: string
          match_age?: number | null
          match_archetype?: string | null
          match_date?: string
          match_score?: number | null
          match_type?: string | null
          matched_user_id?: string
          personality_insight?: string | null
          photo_urls?: string[] | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_matched_user_id_fkey"
            columns: ["matched_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderator_roles: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personality_results: {
        Row: {
          archetype: string | null
          category: string
          created_at: string | null
          id: string
          scores: Json
          user_id: string
        }
        Insert: {
          archetype?: string | null
          category: string
          created_at?: string | null
          id?: string
          scores?: Json
          user_id: string
        }
        Update: {
          archetype?: string | null
          category?: string
          created_at?: string | null
          id?: string
          scores?: Json
          user_id?: string
        }
        Relationships: []
      }
      personality_scores: {
        Row: {
          agreeableness: number
          conscientiousness: number
          created_at: string
          extraversion: number
          id: string
          neuroticism: number
          openness: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agreeableness: number
          conscientiousness: number
          created_at?: string
          extraversion: number
          id?: string
          neuroticism: number
          openness: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agreeableness?: number
          conscientiousness?: number
          created_at?: string
          extraversion?: number
          id?: string
          neuroticism?: number
          openness?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personality_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          allow_analytics: boolean | null
          created_at: string
          id: string
          show_online_status: boolean | null
          show_read_receipts: boolean | null
          show_typing_indicator: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_analytics?: boolean | null
          created_at?: string
          id?: string
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          show_typing_indicator?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_analytics?: boolean | null
          created_at?: string
          id?: string
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          show_typing_indicator?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          media_type: string
          prompt: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          media_type?: string
          prompt?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          media_type?: string
          prompt?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          viewed_user_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          viewed_user_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          viewed_user_id?: string
          viewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alcohol: string | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          dating_intention: string | null
          dating_intention_extra: string | null
          display_name: string | null
          education: string | null
          email_messages: boolean
          email_new_matches: boolean
          gender: string | null
          height: number | null
          hometown: string | null
          id: string
          id_document_back_path: string | null
          id_document_front_path: string | null
          id_verification_status: string | null
          id_verification_submitted_at: string | null
          instagram: string | null
          interested_in: string | null
          linkedin: string | null
          looking_for: string | null
          max_age: number | null
          max_distance: number | null
          min_age: number | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          phone_verified_at: string | null
          politics: string | null
          profile_completion: number | null
          pronouns: string | null
          push_messages: boolean
          push_new_matches: boolean
          relationship_type: string | null
          relationship_type_extra: string | null
          religion: string | null
          selfie_path: string | null
          sexuality: string | null
          show_age: boolean | null
          show_education: boolean | null
          show_job: boolean | null
          show_last_name: boolean | null
          smoking: string | null
          updated_at: string
          user_id: string | null
          work: string | null
        }
        Insert: {
          alcohol?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          dating_intention?: string | null
          dating_intention_extra?: string | null
          display_name?: string | null
          education?: string | null
          email_messages?: boolean
          email_new_matches?: boolean
          gender?: string | null
          height?: number | null
          hometown?: string | null
          id: string
          id_document_back_path?: string | null
          id_document_front_path?: string | null
          id_verification_status?: string | null
          id_verification_submitted_at?: string | null
          instagram?: string | null
          interested_in?: string | null
          linkedin?: string | null
          looking_for?: string | null
          max_age?: number | null
          max_distance?: number | null
          min_age?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          politics?: string | null
          profile_completion?: number | null
          pronouns?: string | null
          push_messages?: boolean
          push_new_matches?: boolean
          relationship_type?: string | null
          relationship_type_extra?: string | null
          religion?: string | null
          selfie_path?: string | null
          sexuality?: string | null
          show_age?: boolean | null
          show_education?: boolean | null
          show_job?: boolean | null
          show_last_name?: boolean | null
          smoking?: string | null
          updated_at?: string
          user_id?: string | null
          work?: string | null
        }
        Update: {
          alcohol?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          dating_intention?: string | null
          dating_intention_extra?: string | null
          display_name?: string | null
          education?: string | null
          email_messages?: boolean
          email_new_matches?: boolean
          gender?: string | null
          height?: number | null
          hometown?: string | null
          id?: string
          id_document_back_path?: string | null
          id_document_front_path?: string | null
          id_verification_status?: string | null
          id_verification_submitted_at?: string | null
          instagram?: string | null
          interested_in?: string | null
          linkedin?: string | null
          looking_for?: string | null
          max_age?: number | null
          max_distance?: number | null
          min_age?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          politics?: string | null
          profile_completion?: number | null
          pronouns?: string | null
          push_messages?: boolean
          push_new_matches?: boolean
          relationship_type?: string | null
          relationship_type_extra?: string | null
          religion?: string | null
          selfie_path?: string | null
          sexuality?: string | null
          show_age?: boolean | null
          show_education?: boolean | null
          show_job?: boolean | null
          show_last_name?: boolean | null
          smoking?: string | null
          updated_at?: string
          user_id?: string | null
          work?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          context: string
          created_at: string
          description: string
          email_sent: boolean | null
          evidence_paths: string[] | null
          id: string
          match_id: string | null
          reported_user_id: string | null
          reporter_id: string
          status: string
          updated_at: string
          violation_type: string
          witness_statement: string | null
        }
        Insert: {
          context: string
          created_at?: string
          description: string
          email_sent?: boolean | null
          evidence_paths?: string[] | null
          id?: string
          match_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          updated_at?: string
          violation_type: string
          witness_statement?: string | null
        }
        Update: {
          context?: string
          created_at?: string
          description?: string
          email_sent?: boolean | null
          evidence_paths?: string[] | null
          id?: string
          match_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
          updated_at?: string
          violation_type?: string
          witness_statement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type: string
          started_at?: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      träff_rsvps: {
        Row: {
          attended: boolean | null
          rsvped_at: string
          träff_id: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          rsvped_at?: string
          träff_id: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          rsvped_at?: string
          träff_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "träff_rsvps_träff_id_fkey"
            columns: ["träff_id"]
            isOneToOne: false
            referencedRelation: "träff_rsvp_counts"
            referencedColumns: ["träff_id"]
          },
          {
            foreignKeyName: "träff_rsvps_träff_id_fkey"
            columns: ["träff_id"]
            isOneToOne: false
            referencedRelation: "träffar"
            referencedColumns: ["id"]
          },
        ]
      }
      träffar: {
        Row: {
          created_at: string
          description: string
          duration_minutes: number
          host_user_id: string
          id: string
          location_city: string
          location_label: string
          max_attendees: number
          min_confirm_attendees: number
          personality_theme: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          duration_minutes?: number
          host_user_id: string
          id?: string
          location_city: string
          location_label: string
          max_attendees: number
          min_confirm_attendees?: number
          personality_theme?: string | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_minutes?: number
          host_user_id?: string
          id?: string
          location_city?: string
          location_label?: string
          max_attendees?: number
          min_confirm_attendees?: number
          personality_theme?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_match_pools: {
        Row: {
          candidates_data: Json
          created_at: string
          delivered_at: string | null
          id: string
          is_delivered: boolean | null
          pool_date: string
          user_id: string
        }
        Insert: {
          candidates_data: Json
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_delivered?: boolean | null
          pool_date?: string
          user_id: string
        }
        Update: {
          candidates_data?: Json
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_delivered?: boolean | null
          pool_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_match_pools_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_match_delivery_status: {
        Row: {
          created_at: string
          id: string
          last_delivered_date: string | null
          next_available_date: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_delivered_date?: string | null
          next_available_date?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_delivered_date?: string | null
          next_available_date?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_match_delivery_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_match_preferences: {
        Row: {
          ab_bucket: number
          archetype_weight: number
          collaborative_boosts: Json | null
          deep_matches: number
          engaged_matches: number
          interest_weight: number
          personality_weight: number
          similar_ratio: number
          total_matches: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ab_bucket?: number
          archetype_weight?: number
          collaborative_boosts?: Json | null
          deep_matches?: number
          engaged_matches?: number
          interest_weight?: number
          personality_weight?: number
          similar_ratio?: number
          total_matches?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ab_bucket?: number
          archetype_weight?: number
          collaborative_boosts?: Json | null
          deep_matches?: number
          engaged_matches?: number
          interest_weight?: number
          personality_weight?: number
          similar_ratio?: number
          total_matches?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload?: Json | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      träff_rsvp_counts: {
        Row: {
          max_attendees: number | null
          rsvp_count: number | null
          träff_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      mark_group_message_read: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      try_consume_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_start: string }
        Returns: Json
      }
      update_photo_order: {
        Args: { p_photo_orders: Json; p_user_id: string }
        Returns: undefined
      }
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
A new version of Supabase CLI is available: v2.84.2 (currently installed v2.75.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
