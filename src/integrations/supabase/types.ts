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
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          created_by: string
          id: string
          message: string
          sent_count: number
          target_segment: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          message: string
          sent_count?: number
          target_segment?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          sent_count?: number
          target_segment?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      affiliate_goals: {
        Row: {
          created_at: string
          current_commission: number
          current_conversions: number
          id: string
          month: number
          target_commission: number
          target_conversions: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          current_commission?: number
          current_conversions?: number
          id?: string
          month: number
          target_commission?: number
          target_conversions?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          current_commission?: number
          current_conversions?: number
          id?: string
          month?: number
          target_commission?: number
          target_conversions?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      affiliate_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_tiers: {
        Row: {
          commission_percentage: number
          created_at: string
          id: string
          min_conversions: number
          name: string
        }
        Insert: {
          commission_percentage?: number
          created_at?: string
          id?: string
          min_conversions?: number
          name: string
        }
        Update: {
          commission_percentage?: number
          created_at?: string
          id?: string
          min_conversions?: number
          name?: string
        }
        Relationships: []
      }
      benefit_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_redeemable: boolean
          name: string
          sort_order: number
          tier_id: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_redeemable?: boolean
          name: string
          sort_order?: number
          tier_id: string
          type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_redeemable?: boolean
          name?: string
          sort_order?: number
          tier_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_items_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string
          expires_at: string | null
          id: string
          ip_address: string
          is_active: boolean
          notes: string | null
          reason: string
        }
        Insert: {
          blocked_at?: string
          blocked_by: string
          expires_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean
          notes?: string | null
          reason: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean
          notes?: string | null
          reason?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_at: string
          blocked_by: string
          id: string
          is_active: boolean
          reason: string
          unblocked_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_by: string
          id?: string
          is_active?: boolean
          reason: string
          unblocked_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string
          id?: string
          is_active?: boolean
          reason?: string
          unblocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      broadcast_emails: {
        Row: {
          content: string
          created_at: string
          created_by: string
          delivered_count: number
          determination_period_hours: number | null
          failed_count: number
          id: string
          is_ab_test: boolean
          opened_count: number
          scheduled_at: string | null
          segment: string
          sent_at: string | null
          status: string
          subject: string
          subject_variant_a: string | null
          subject_variant_b: string | null
          total_recipients: number
          variant_a_opened: number
          variant_a_sent: number
          variant_b_opened: number
          variant_b_sent: number
          winner_determined_at: string | null
          winner_variant: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          delivered_count?: number
          determination_period_hours?: number | null
          failed_count?: number
          id?: string
          is_ab_test?: boolean
          opened_count?: number
          scheduled_at?: string | null
          segment?: string
          sent_at?: string | null
          status?: string
          subject: string
          subject_variant_a?: string | null
          subject_variant_b?: string | null
          total_recipients?: number
          variant_a_opened?: number
          variant_a_sent?: number
          variant_b_opened?: number
          variant_b_sent?: number
          winner_determined_at?: string | null
          winner_variant?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          delivered_count?: number
          determination_period_hours?: number | null
          failed_count?: number
          id?: string
          is_ab_test?: boolean
          opened_count?: number
          scheduled_at?: string | null
          segment?: string
          sent_at?: string | null
          status?: string
          subject?: string
          subject_variant_a?: string | null
          subject_variant_b?: string | null
          total_recipients?: number
          variant_a_opened?: number
          variant_a_sent?: number
          variant_b_opened?: number
          variant_b_sent?: number
          winner_determined_at?: string | null
          winner_variant?: string | null
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          background_color: string
          border_color: string
          border_width: number
          created_at: string
          event_id: string
          footer_color: string
          footer_font_size: number
          footer_text: string | null
          id: string
          logo_url: string | null
          name_color: string
          name_font_size: number
          prize_color: string
          prize_font_size: number
          prize_label_text: string
          show_category: boolean
          show_decorations: boolean
          show_event_date: boolean
          show_ticket_number: boolean
          subtitle_color: string
          subtitle_font_size: number
          subtitle_text: string
          template_name: string
          title_color: string
          title_font_size: number
          title_text: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          border_color?: string
          border_width?: number
          created_at?: string
          event_id: string
          footer_color?: string
          footer_font_size?: number
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          name_color?: string
          name_font_size?: number
          prize_color?: string
          prize_font_size?: number
          prize_label_text?: string
          show_category?: boolean
          show_decorations?: boolean
          show_event_date?: boolean
          show_ticket_number?: boolean
          subtitle_color?: string
          subtitle_font_size?: number
          subtitle_text?: string
          template_name?: string
          title_color?: string
          title_font_size?: number
          title_text?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          border_color?: string
          border_width?: number
          created_at?: string
          event_id?: string
          footer_color?: string
          footer_font_size?: number
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          name_color?: string
          name_font_size?: number
          prize_color?: string
          prize_font_size?: number
          prize_label_text?: string
          show_category?: boolean
          show_decorations?: boolean
          show_event_date?: boolean
          show_ticket_number?: boolean
          subtitle_color?: string
          subtitle_font_size?: number
          subtitle_text?: string
          template_name?: string
          title_color?: string
          title_font_size?: number
          title_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          payment_id: string
          payout_reference: string | null
          referee_id: string
          referrer_id: string
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_id: string
          payout_reference?: string | null
          referee_id: string
          referrer_id: string
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_id?: string
          payout_reference?: string | null
          referee_id?: string
          referrer_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "event_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      email_link_clicks: {
        Row: {
          broadcast_id: string
          city: string | null
          clicked_at: string
          country: string | null
          id: string
          ip_address: string | null
          latitude: number | null
          longitude: number | null
          original_url: string
          recipient_email: string
          tracking_id: string | null
          user_agent: string | null
        }
        Insert: {
          broadcast_id: string
          city?: string | null
          clicked_at?: string
          country?: string | null
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          original_url: string
          recipient_email: string
          tracking_id?: string | null
          user_agent?: string | null
        }
        Update: {
          broadcast_id?: string
          city?: string | null
          clicked_at?: string
          country?: string | null
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          original_url?: string
          recipient_email?: string
          tracking_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_link_clicks_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcast_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_link_clicks_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "email_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_tracking: {
        Row: {
          broadcast_id: string
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_address: string | null
          latitude: number | null
          longitude: number | null
          open_count: number
          opened_at: string | null
          recipient_email: string
          user_agent: string | null
          variant: string | null
        }
        Insert: {
          broadcast_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          open_count?: number
          opened_at?: string | null
          recipient_email: string
          user_agent?: string | null
          variant?: string | null
        }
        Update: {
          broadcast_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          open_count?: number
          opened_at?: string | null
          recipient_email?: string
          user_agent?: string | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcast_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      eo_bank_settings: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at: string
          id: string
          is_verified: boolean
          organization_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at?: string
          id?: string
          is_verified?: boolean
          organization_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_code?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          organization_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eo_bank_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      eo_payouts: {
        Row: {
          created_at: string
          event_id: string
          gross_amount: number
          id: string
          iris_reference_no: string | null
          iris_status: string | null
          net_amount: number
          notes: string | null
          organization_id: string
          paid_at: string | null
          participant_payment_id: string
          platform_fee: number
          platform_fee_percentage: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          gross_amount: number
          id?: string
          iris_reference_no?: string | null
          iris_status?: string | null
          net_amount: number
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          participant_payment_id: string
          platform_fee: number
          platform_fee_percentage?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          gross_amount?: number
          id?: string
          iris_reference_no?: string | null
          iris_status?: string | null
          net_amount?: number
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          participant_payment_id?: string
          platform_fee?: number
          platform_fee_percentage?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eo_payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eo_payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eo_payouts_participant_payment_id_fkey"
            columns: ["participant_payment_id"]
            isOneToOne: false
            referencedRelation: "participant_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_forms: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_published: boolean
          public_slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_published?: boolean
          public_slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_published?: boolean
          public_slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_forms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payments: {
        Row: {
          amount: number
          created_at: string
          discount_amount: number
          event_id: string
          expires_at: string | null
          form_addon_amount: number
          form_addon_purchased: boolean
          id: string
          midtrans_order_id: string | null
          midtrans_transaction_id: string | null
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          proof_url: string | null
          referral_code: string | null
          rejected_at: string | null
          rejection_reason: string | null
          tier: Database["public"]["Enums"]["event_tier"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          discount_amount?: number
          event_id: string
          expires_at?: string | null
          form_addon_amount?: number
          form_addon_purchased?: boolean
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          organization_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          proof_url?: string | null
          referral_code?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          tier: Database["public"]["Enums"]["event_tier"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          discount_amount?: number
          event_id?: string
          expires_at?: string | null
          form_addon_amount?: number
          form_addon_purchased?: boolean
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          proof_url?: string | null
          referral_code?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          tier?: Database["public"]["Enums"]["event_tier"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_scanners: {
        Row: {
          created_at: string
          created_by: string
          email: string
          event_id: string
          full_name: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          event_id: string
          full_name: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_scanners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          checkin_required_for_draw: boolean
          claim_instructions: string | null
          contact_email: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          email_notification_enabled: boolean
          event_date: string
          event_time: string | null
          form_addon_purchased: boolean
          form_theme: string | null
          id: string
          is_paid_event: boolean | null
          location: string | null
          name: string
          organization_id: string
          public_viewer_slug: string | null
          qr_checkin_enabled: boolean
          registration_enabled: boolean
          status: Database["public"]["Enums"]["event_status"]
          ticket_price: number | null
          tier: Database["public"]["Enums"]["event_tier"]
          updated_at: string
        }
        Insert: {
          checkin_required_for_draw?: boolean
          claim_instructions?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email_notification_enabled?: boolean
          event_date: string
          event_time?: string | null
          form_addon_purchased?: boolean
          form_theme?: string | null
          id?: string
          is_paid_event?: boolean | null
          location?: string | null
          name: string
          organization_id: string
          public_viewer_slug?: string | null
          qr_checkin_enabled?: boolean
          registration_enabled?: boolean
          status?: Database["public"]["Enums"]["event_status"]
          ticket_price?: number | null
          tier?: Database["public"]["Enums"]["event_tier"]
          updated_at?: string
        }
        Update: {
          checkin_required_for_draw?: boolean
          claim_instructions?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email_notification_enabled?: boolean
          event_date?: string
          event_time?: string | null
          form_addon_purchased?: boolean
          form_theme?: string | null
          id?: string
          is_paid_event?: boolean | null
          location?: string | null
          name?: string
          organization_id?: string
          public_viewer_slug?: string | null
          qr_checkin_enabled?: boolean
          registration_enabled?: boolean
          status?: Database["public"]["Enums"]["event_status"]
          ticket_price?: number | null
          tier?: Database["public"]["Enums"]["event_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          created_at: string
          field_type: string
          form_id: string
          id: string
          is_required: boolean
          label: string
          mapped_to: string | null
          options: Json | null
          placeholder: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          field_type: string
          form_id: string
          id?: string
          is_required?: boolean
          label: string
          mapped_to?: string | null
          options?: Json | null
          placeholder?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          field_type?: string
          form_id?: string
          id?: string
          is_required?: boolean
          label?: string
          mapped_to?: string | null
          options?: Json | null
          placeholder?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          data: Json
          form_id: string
          id: string
          participant_id: string | null
          submitted_at: string
        }
        Insert: {
          data: Json
          form_id: string
          id?: string
          participant_id?: string | null
          submitted_at?: string
        }
        Update: {
          data?: Json
          form_id?: string
          id?: string
          participant_id?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string | null
          id: string
          ip_address: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email?: string | null
          id?: string
          ip_address: string
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string | null
          id?: string
          ip_address?: string
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          city: string | null
          country: string | null
          email: string
          id: string
          ip_address: string | null
          latitude: number | null
          login_at: string
          longitude: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          email: string
          id?: string
          ip_address?: string | null
          latitude?: number | null
          login_at?: string
          longitude?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          latitude?: number | null
          login_at?: string
          longitude?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      participant_benefits: {
        Row: {
          benefit_item_id: string
          created_at: string
          id: string
          is_redeemed: boolean
          participant_id: string
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          benefit_item_id: string
          created_at?: string
          id?: string
          is_redeemed?: boolean
          participant_id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          benefit_item_id?: string
          created_at?: string
          id?: string
          is_redeemed?: boolean
          participant_id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_benefits_benefit_item_id_fkey"
            columns: ["benefit_item_id"]
            isOneToOne: false
            referencedRelation: "benefit_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_benefits_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_payments: {
        Row: {
          amount: number
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          midtrans_order_id: string | null
          midtrans_transaction_id: string | null
          paid_at: string | null
          participant_id: string
          payment_method: string | null
          payment_status: string
          proof_uploaded_at: string | null
          proof_url: string | null
          rejected_at: string | null
          rejection_reason: string | null
          snap_token: string | null
          tier_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          paid_at?: string | null
          participant_id: string
          payment_method?: string | null
          payment_status?: string
          proof_uploaded_at?: string | null
          proof_url?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          snap_token?: string | null
          tier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          paid_at?: string | null
          participant_id?: string
          payment_method?: string | null
          payment_status?: string
          proof_uploaded_at?: string | null
          proof_url?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          snap_token?: string | null
          tier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_payments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_payments_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          address: string | null
          auth_user_id: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          company: string | null
          created_at: string
          division: string | null
          email: string | null
          event_id: string
          id: string
          name: string
          payment_status: string | null
          phone: string | null
          qr_email_sent: boolean
          qr_email_sent_at: string | null
          registration_id: string | null
          status: Database["public"]["Enums"]["participant_status"]
          ticket_number: string
          tier_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          company?: string | null
          created_at?: string
          division?: string | null
          email?: string | null
          event_id: string
          id?: string
          name: string
          payment_status?: string | null
          phone?: string | null
          qr_email_sent?: boolean
          qr_email_sent_at?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          ticket_number: string
          tier_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          company?: string | null
          created_at?: string
          division?: string | null
          email?: string | null
          event_id?: string
          id?: string
          name?: string
          payment_status?: string | null
          phone?: string | null
          qr_email_sent?: boolean
          qr_email_sent_at?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          ticket_number?: string
          tier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          created_at: string
          form_addon_price: number
          id: string
          max_grand_prize: number
          max_hiburan: number
          max_participants: number
          max_utama: number
          name: string
          price: number
          tier: Database["public"]["Enums"]["event_tier"]
        }
        Insert: {
          created_at?: string
          form_addon_price?: number
          id?: string
          max_grand_prize: number
          max_hiburan: number
          max_participants: number
          max_utama: number
          name: string
          price?: number
          tier: Database["public"]["Enums"]["event_tier"]
        }
        Update: {
          created_at?: string
          form_addon_price?: number
          id?: string
          max_grand_prize?: number
          max_hiburan?: number
          max_participants?: number
          max_utama?: number
          name?: string
          price?: number
          tier?: Database["public"]["Enums"]["event_tier"]
        }
        Relationships: []
      }
      prize_audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          event_id: string
          id: string
          prize_id: string
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          event_id: string
          id?: string
          prize_id: string
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          event_id?: string
          id?: string
          prize_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_audit_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_audit_logs_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      prizes: {
        Row: {
          category: Database["public"]["Enums"]["prize_category"]
          created_at: string
          description: string | null
          event_id: string
          id: string
          image_url: string | null
          name: string
          quantity: number
          remaining_quantity: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["prize_category"]
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          name: string
          quantity?: number
          remaining_quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["prize_category"]
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          name?: string
          quantity?: number
          remaining_quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prizes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_email_logs: {
        Row: {
          created_at: string
          email_address: string | null
          event_type: string
          id: string
          notes: string | null
          participant_id: string
        }
        Insert: {
          created_at?: string
          email_address?: string | null
          event_type: string
          id?: string
          notes?: string | null
          participant_id: string
        }
        Update: {
          created_at?: string
          email_address?: string | null
          event_type?: string
          id?: string
          notes?: string | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_email_logs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          custom_code: string | null
          id: string
          tier_id: string | null
          total_clicks: number
          total_conversions: number
          total_signups: number
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          custom_code?: string | null
          id?: string
          tier_id?: string | null
          total_clicks?: number
          total_conversions?: number
          total_signups?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          custom_code?: string | null
          id?: string
          tier_id?: string | null
          total_clicks?: number
          total_conversions?: number
          total_signups?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "affiliate_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referee_id: string
          referral_code_id: string
          referrer_id: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referee_id: string
          referral_code_id: string
          referrer_id: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referee_id?: string
          referral_code_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_requests: {
        Row: {
          amount: number
          created_at: string
          event_id: string
          id: string
          participant_id: string
          participant_payment_id: string
          reason: string
          refund_reference: string | null
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          event_id: string
          id?: string
          participant_id: string
          participant_payment_id: string
          reason: string
          refund_reference?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_id?: string
          id?: string
          participant_id?: string
          participant_payment_id?: string
          reason?: string
          refund_reference?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_participant_payment_id_fkey"
            columns: ["participant_payment_id"]
            isOneToOne: false
            referencedRelation: "participant_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_broadcasts: {
        Row: {
          broadcast_id: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          processed_at: string | null
          recipient_ids: string[]
          scheduled_for: string
          segment: string
          status: string
          subject: string
        }
        Insert: {
          broadcast_id?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          processed_at?: string | null
          recipient_ids?: string[]
          scheduled_for: string
          segment?: string
          status?: string
          subject: string
        }
        Update: {
          broadcast_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          processed_at?: string | null
          recipient_ids?: string[]
          scheduled_for?: string
          segment?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_broadcasts_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcast_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tiers: {
        Row: {
          created_at: string
          description: string | null
          early_bird_end_date: string | null
          early_bird_price: number | null
          event_id: string
          id: string
          is_active: boolean
          name: string
          price: number
          quota: number | null
          sold_count: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          early_bird_end_date?: string | null
          early_bird_price?: number | null
          event_id: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
          quota?: number | null
          sold_count?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          early_bird_end_date?: string | null
          early_bird_price?: number | null
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          quota?: number | null
          sold_count?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bank_info: {
        Row: {
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      winners: {
        Row: {
          animation_used: Database["public"]["Enums"]["draw_animation"]
          created_at: string
          drawn_at: string
          email_sent: boolean
          email_sent_at: string | null
          event_id: string
          id: string
          participant_id: string
          prize_id: string
        }
        Insert: {
          animation_used: Database["public"]["Enums"]["draw_animation"]
          created_at?: string
          drawn_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          event_id: string
          id?: string
          participant_id: string
          prize_id: string
        }
        Update: {
          animation_used?: Database["public"]["Enums"]["draw_animation"]
          created_at?: string
          drawn_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          event_id?: string
          id?: string
          participant_id?: string
          prize_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "prizes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_event_scanners: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_event_scanner: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      user_belongs_to_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "staff"
      commission_status: "pending" | "confirmed" | "paid" | "cancelled"
      draw_animation:
        | "spin_wheel"
        | "slot_machine"
        | "card_reveal"
        | "random_number"
      event_status:
        | "draft"
        | "pending_payment"
        | "active"
        | "completed"
        | "cancelled"
      event_tier: "free" | "basic" | "pro" | "enterprise"
      participant_status: "registered" | "checked_in" | "won"
      payment_status: "pending" | "paid" | "failed" | "refunded" | "expired"
      prize_category: "hiburan" | "utama" | "grand_prize"
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
    Enums: {
      app_role: ["admin", "owner", "staff"],
      commission_status: ["pending", "confirmed", "paid", "cancelled"],
      draw_animation: [
        "spin_wheel",
        "slot_machine",
        "card_reveal",
        "random_number",
      ],
      event_status: [
        "draft",
        "pending_payment",
        "active",
        "completed",
        "cancelled",
      ],
      event_tier: ["free", "basic", "pro", "enterprise"],
      participant_status: ["registered", "checked_in", "won"],
      payment_status: ["pending", "paid", "failed", "refunded", "expired"],
      prize_category: ["hiburan", "utama", "grand_prize"],
    },
  },
} as const
