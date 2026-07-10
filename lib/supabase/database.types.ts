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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_request_status: {
        Row: {
          approval_stage: Database["public"]["Enums"]["access_request_stage"]
          request_id: string
          status: Database["public"]["Enums"]["approval_status"]
          status_message: string | null
          status_token: string
          updated_at: string
        }
        Insert: {
          approval_stage?: Database["public"]["Enums"]["access_request_stage"]
          request_id: string
          status?: Database["public"]["Enums"]["approval_status"]
          status_message?: string | null
          status_token: string
          updated_at?: string
        }
        Update: {
          approval_stage?: Database["public"]["Enums"]["access_request_stage"]
          request_id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          status_message?: string | null
          status_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_request_status_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      access_requests: {
        Row: {
          admin_notes: string | null
          approval_stage: Database["public"]["Enums"]["access_request_stage"]
          assigned_role: string | null
          business_purpose: string
          company_name: string | null
          created_at: string
          decision_notes: string | null
          deleted_at: string | null
          deleted_by: string | null
          denied_at: string | null
          denied_by: string | null
          email: string
          full_name: string
          id: string
          is_deleted: boolean
          last_waitlist_email_sent_at: string | null
          operational_notes: string | null
          phone: string | null
          requested_role: Database["public"]["Enums"]["user_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          stage_updated_at: string
          status: Database["public"]["Enums"]["approval_status"]
          status_token: string
          status_updated_at: string | null
          status_updated_by: string | null
          suspended_at: string | null
          suspended_by: string | null
          waitlisted_at: string | null
          waitlisted_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          approval_stage?: Database["public"]["Enums"]["access_request_stage"]
          assigned_role?: string | null
          business_purpose?: string
          company_name?: string | null
          created_at?: string
          decision_notes?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          denied_at?: string | null
          denied_by?: string | null
          email: string
          full_name: string
          id?: string
          is_deleted?: boolean
          last_waitlist_email_sent_at?: string | null
          operational_notes?: string | null
          phone?: string | null
          requested_role: Database["public"]["Enums"]["user_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          stage_updated_at?: string
          status?: Database["public"]["Enums"]["approval_status"]
          status_token?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          waitlisted_at?: string | null
          waitlisted_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          approval_stage?: Database["public"]["Enums"]["access_request_stage"]
          assigned_role?: string | null
          business_purpose?: string
          company_name?: string | null
          created_at?: string
          decision_notes?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          denied_at?: string | null
          denied_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_deleted?: boolean
          last_waitlist_email_sent_at?: string | null
          operational_notes?: string | null
          phone?: string | null
          requested_role?: Database["public"]["Enums"]["user_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          stage_updated_at?: string
          status?: Database["public"]["Enums"]["approval_status"]
          status_token?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          waitlisted_at?: string | null
          waitlisted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_denied_by_fkey"
            columns: ["denied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_status_updated_by_fkey"
            columns: ["status_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_waitlisted_by_fkey"
            columns: ["waitlisted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aircraft: {
        Row: {
          aircraft_category: string | null
          airworthiness_signed_off: boolean
          avionics_notes: string | null
          baggage_notes: string | null
          client_id: string | null
          created_at: string
          home_base: string | null
          id: string
          maintenance_status: string
          make: string | null
          model: string | null
          notes: string | null
          passenger_capacity: number | null
          range_notes: string | null
          required_crew: number | null
          serial_number: string | null
          status: string
          tail_number: string
          updated_at: string
          year: number | null
        }
        Insert: {
          aircraft_category?: string | null
          airworthiness_signed_off?: boolean
          avionics_notes?: string | null
          baggage_notes?: string | null
          client_id?: string | null
          created_at?: string
          home_base?: string | null
          id?: string
          maintenance_status?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          passenger_capacity?: number | null
          range_notes?: string | null
          required_crew?: number | null
          serial_number?: string | null
          status?: string
          tail_number: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          aircraft_category?: string | null
          airworthiness_signed_off?: boolean
          avionics_notes?: string | null
          baggage_notes?: string | null
          client_id?: string | null
          created_at?: string
          home_base?: string | null
          id?: string
          maintenance_status?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          passenger_capacity?: number | null
          range_notes?: string | null
          required_crew?: number | null
          serial_number?: string | null
          status?: string
          tail_number?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      airports: {
        Row: {
          city: string | null
          code: string
          country: string
          created_at: string
          iata: string | null
          icao: string | null
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          region: string | null
          state: string | null
        }
        Insert: {
          city?: string | null
          code: string
          country?: string
          created_at?: string
          iata?: string | null
          icao?: string | null
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          region?: string | null
          state?: string | null
        }
        Update: {
          city?: string | null
          code?: string
          country?: string
          created_at?: string
          iata?: string | null
          icao?: string | null
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          region?: string | null
          state?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          created_at: string
          detail: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_document_sequences: {
        Row: {
          document_type: string
          last_number: number
          period_start: string
          updated_at: string
        }
        Insert: {
          document_type: string
          last_number?: number
          period_start: string
          updated_at?: string
        }
        Update: {
          document_type?: string
          last_number?: number
          period_start?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_documents: {
        Row: {
          client_id: string | null
          created_at: string
          document_number: string
          document_type: string
          emailed_at: string | null
          emailed_to: string[]
          file_name: string
          file_size: number | null
          generated_at: string
          generated_by: string | null
          id: string
          invoice_id: string | null
          is_latest: boolean
          is_locked: boolean
          mime_type: string
          payment_id: string | null
          quote_id: string | null
          resend_count: number
          sent_at: string | null
          status: string
          storage_bucket: string
          storage_path: string
          version_number: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          document_number: string
          document_type: string
          emailed_at?: string | null
          emailed_to?: string[]
          file_name: string
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          invoice_id?: string | null
          is_latest?: boolean
          is_locked?: boolean
          mime_type?: string
          payment_id?: string | null
          quote_id?: string | null
          resend_count?: number
          sent_at?: string | null
          status?: string
          storage_bucket?: string
          storage_path: string
          version_number?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          document_number?: string
          document_type?: string
          emailed_at?: string | null
          emailed_to?: string[]
          file_name?: string
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          invoice_id?: string | null
          is_latest?: boolean
          is_locked?: boolean
          mime_type?: string
          payment_id?: string | null
          quote_id?: string | null
          resend_count?: number
          sent_at?: string | null
          status?: string
          storage_bucket?: string
          storage_path?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_documents_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_documents_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_documents_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_settings: {
        Row: {
          ach_instructions: string | null
          auto_send_invoice_on_quote_approval: boolean
          check_instructions: string | null
          company_address: string | null
          company_email: string | null
          company_legal_name: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          default_deposit_percent: number
          dunning_enabled: boolean
          id: string
          invoice_disclaimer: string | null
          invoice_terms: string | null
          logo_path: string
          payment_instructions: string | null
          quote_disclaimer: string | null
          quote_terms: string | null
          receipt_disclaimer: string | null
          tax_rate: number
          updated_at: string
          updated_by: string | null
          wire_instructions: string | null
        }
        Insert: {
          ach_instructions?: string | null
          auto_send_invoice_on_quote_approval?: boolean
          check_instructions?: string | null
          company_address?: string | null
          company_email?: string | null
          company_legal_name?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          default_deposit_percent?: number
          dunning_enabled?: boolean
          id?: string
          invoice_disclaimer?: string | null
          invoice_terms?: string | null
          logo_path?: string
          payment_instructions?: string | null
          quote_disclaimer?: string | null
          quote_terms?: string | null
          receipt_disclaimer?: string | null
          tax_rate?: number
          updated_at?: string
          updated_by?: string | null
          wire_instructions?: string | null
        }
        Update: {
          ach_instructions?: string | null
          auto_send_invoice_on_quote_approval?: boolean
          check_instructions?: string | null
          company_address?: string | null
          company_email?: string | null
          company_legal_name?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          default_deposit_percent?: number
          dunning_enabled?: boolean
          id?: string
          invoice_disclaimer?: string | null
          invoice_terms?: string | null
          logo_path?: string
          payment_instructions?: string | null
          quote_disclaimer?: string | null
          quote_terms?: string | null
          receipt_disclaimer?: string | null
          tax_rate?: number
          updated_at?: string
          updated_by?: string | null
          wire_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notified: boolean
          profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notified?: boolean
          profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notified?: boolean
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          aircraft_id: string | null
          all_day: boolean
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          event_type: string
          id: string
          location: string | null
          mission_id: string | null
          starts_at: string
          status: string
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          aircraft_id?: string | null
          all_day?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          mission_id?: string | null
          starts_at: string
          status?: string
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          aircraft_id?: string | null
          all_day?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          mission_id?: string | null
          starts_at?: string
          status?: string
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          aircraft_id: string | null
          amount_cents: number | null
          annual_price: number
          billing_cadence: string
          cancel_at: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          credit_balance: number
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          custom_description: string | null
          custom_interval: string | null
          custom_interval_count: number | null
          custom_name: string | null
          custom_price: number | null
          end_date: string | null
          ended_at: string | null
          id: string
          ignored_at: string | null
          included_admin_hours: number
          included_flights: number
          included_mx_repositions: number
          is_custom: boolean
          is_test: boolean
          line_items_snapshot: Json | null
          monthly_price: number
          notes: string | null
          plan_code: string | null
          plan_id: string | null
          plan_name: string | null
          renewal_date: string | null
          source: string
          source_quote_id: string | null
          start_date: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_checkout_url: string | null
          stripe_customer_id: string | null
          stripe_last_event_at: string | null
          stripe_last_event_id: string | null
          stripe_last_event_type: string | null
          stripe_last_synced_at: string | null
          stripe_latest_invoice_id: string | null
          stripe_mode: string | null
          stripe_payment_status: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          stripe_sync_status: string
          stripe_sync_warning: string | null
          tier_id: string | null
          tier_key: string | null
          trial_days: number | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          aircraft_id?: string | null
          amount_cents?: number | null
          annual_price?: number
          billing_cadence?: string
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          credit_balance?: number
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          custom_description?: string | null
          custom_interval?: string | null
          custom_interval_count?: number | null
          custom_name?: string | null
          custom_price?: number | null
          end_date?: string | null
          ended_at?: string | null
          id?: string
          ignored_at?: string | null
          included_admin_hours?: number
          included_flights?: number
          included_mx_repositions?: number
          is_custom?: boolean
          is_test?: boolean
          line_items_snapshot?: Json | null
          monthly_price?: number
          notes?: string | null
          plan_code?: string | null
          plan_id?: string | null
          plan_name?: string | null
          renewal_date?: string | null
          source?: string
          source_quote_id?: string | null
          start_date?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_checkout_url?: string | null
          stripe_customer_id?: string | null
          stripe_last_event_at?: string | null
          stripe_last_event_id?: string | null
          stripe_last_event_type?: string | null
          stripe_last_synced_at?: string | null
          stripe_latest_invoice_id?: string | null
          stripe_mode?: string | null
          stripe_payment_status?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          stripe_sync_status?: string
          stripe_sync_warning?: string | null
          tier_id?: string | null
          tier_key?: string | null
          trial_days?: number | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          aircraft_id?: string | null
          amount_cents?: number | null
          annual_price?: number
          billing_cadence?: string
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          credit_balance?: number
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          custom_description?: string | null
          custom_interval?: string | null
          custom_interval_count?: number | null
          custom_name?: string | null
          custom_price?: number | null
          end_date?: string | null
          ended_at?: string | null
          id?: string
          ignored_at?: string | null
          included_admin_hours?: number
          included_flights?: number
          included_mx_repositions?: number
          is_custom?: boolean
          is_test?: boolean
          line_items_snapshot?: Json | null
          monthly_price?: number
          notes?: string | null
          plan_code?: string | null
          plan_id?: string | null
          plan_name?: string | null
          renewal_date?: string | null
          source?: string
          source_quote_id?: string | null
          start_date?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_checkout_url?: string | null
          stripe_customer_id?: string | null
          stripe_last_event_at?: string | null
          stripe_last_event_id?: string | null
          stripe_last_event_type?: string | null
          stripe_last_synced_at?: string | null
          stripe_latest_invoice_id?: string | null
          stripe_mode?: string | null
          stripe_payment_status?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          stripe_sync_status?: string
          stripe_sync_warning?: string | null
          tier_id?: string | null
          tier_key?: string | null
          trial_days?: number | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_source_quote_id_fkey"
            columns: ["source_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_plan_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          file_size_bytes: number | null
          id: string
          message_id: string
          source: string
          storage_bucket: string
          storage_path: string
          thread_id: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          message_id: string
          source: string
          storage_bucket: string
          storage_path: string
          thread_id: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          message_id?: string
          source?: string
          storage_bucket?: string
          storage_path?: string
          thread_id?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_attachments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_attachments_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_audit_log: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          message_id: string | null
          metadata: Json
          thread_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          message_id?: string | null
          metadata?: Json
          thread_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message_id?: string | null
          metadata?: Json
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_audit_log_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_audit_log_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_messages: {
        Row: {
          bcc_emails: string[]
          body_html: string | null
          body_preview: string | null
          body_text: string | null
          cc_emails: string[]
          created_at: string
          created_by_user_id: string | null
          delivered_at: string | null
          direction: string
          email_category: string | null
          failed_at: string | null
          failure_reason: string | null
          from_email: string | null
          from_name: string | null
          id: string
          in_reply_to: string | null
          inbound_webhook_event_id: string | null
          message_type: string
          provider: string | null
          provider_message_id: string | null
          provider_thread_id: string | null
          public_id: string
          raw_headers: Json | null
          raw_payload: Json | null
          received_at: string | null
          references_header: string | null
          reply_to_email: string | null
          sent_at: string | null
          sent_by_user_id: string | null
          status: string
          subject: string | null
          template_id: string | null
          template_name: string | null
          thread_id: string
          to_emails: string[]
          visibility: string
        }
        Insert: {
          bcc_emails?: string[]
          body_html?: string | null
          body_preview?: string | null
          body_text?: string | null
          cc_emails?: string[]
          created_at?: string
          created_by_user_id?: string | null
          delivered_at?: string | null
          direction: string
          email_category?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          inbound_webhook_event_id?: string | null
          message_type: string
          provider?: string | null
          provider_message_id?: string | null
          provider_thread_id?: string | null
          public_id: string
          raw_headers?: Json | null
          raw_payload?: Json | null
          received_at?: string | null
          references_header?: string | null
          reply_to_email?: string | null
          sent_at?: string | null
          sent_by_user_id?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          template_name?: string | null
          thread_id: string
          to_emails?: string[]
          visibility?: string
        }
        Update: {
          bcc_emails?: string[]
          body_html?: string | null
          body_preview?: string | null
          body_text?: string | null
          cc_emails?: string[]
          created_at?: string
          created_by_user_id?: string | null
          delivered_at?: string | null
          direction?: string
          email_category?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          inbound_webhook_event_id?: string | null
          message_type?: string
          provider?: string | null
          provider_message_id?: string | null
          provider_thread_id?: string | null
          public_id?: string
          raw_headers?: Json | null
          raw_payload?: Json | null
          received_at?: string | null
          references_header?: string | null
          reply_to_email?: string | null
          sent_at?: string | null
          sent_by_user_id?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          template_name?: string | null
          thread_id?: string
          to_emails?: string[]
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_messages_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_messages_sent_by_user_id_fkey"
            columns: ["sent_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_participants: {
        Row: {
          client_id: string | null
          contact_id: string | null
          created_at: string
          crew_id: string | null
          email: string | null
          id: string
          is_primary: boolean
          name: string | null
          participant_type: string
          role_label: string | null
          thread_id: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          crew_id?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string | null
          participant_type: string
          role_label?: string | null
          thread_id: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          crew_id?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string | null
          participant_type?: string
          role_label?: string | null
          thread_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_participants_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_participants_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          active: boolean
          allowed_roles: string[]
          body_template_html: string | null
          body_template_text: string | null
          category: string
          created_at: string
          id: string
          name: string
          subject_template: string
          template_key: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          active?: boolean
          allowed_roles?: string[]
          body_template_html?: string | null
          body_template_text?: string | null
          category: string
          created_at?: string
          id?: string
          name: string
          subject_template: string
          template_key?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          active?: boolean
          allowed_roles?: string[]
          body_template_html?: string | null
          body_template_text?: string | null
          category?: string
          created_at?: string
          id?: string
          name?: string
          subject_template?: string
          template_key?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      communication_threads: {
        Row: {
          assigned_to_user_id: string | null
          channel: string
          closed_at: string | null
          created_at: string
          created_by_user_id: string | null
          id: string
          is_archived: boolean
          last_message_at: string | null
          priority: string
          public_id: string
          related_aircraft_id: string | null
          related_client_id: string | null
          related_crew_assignment_id: string | null
          related_invoice_id: string | null
          related_quote_id: string | null
          related_request_id: string | null
          status: string
          subject: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          channel?: string
          closed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          priority?: string
          public_id: string
          related_aircraft_id?: string | null
          related_client_id?: string | null
          related_crew_assignment_id?: string | null
          related_invoice_id?: string | null
          related_quote_id?: string | null
          related_request_id?: string | null
          status?: string
          subject?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          channel?: string
          closed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          priority?: string
          public_id?: string
          related_aircraft_id?: string | null
          related_client_id?: string | null
          related_crew_assignment_id?: string | null
          related_invoice_id?: string | null
          related_quote_id?: string | null
          related_request_id?: string | null
          status?: string
          subject?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_threads_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_related_aircraft_id_fkey"
            columns: ["related_aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_related_client_id_fkey"
            columns: ["related_client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_related_crew_assignment_id_fkey"
            columns: ["related_crew_assignment_id"]
            isOneToOne: false
            referencedRelation: "mission_crew_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_related_quote_id_fkey"
            columns: ["related_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_related_request_id_fkey"
            columns: ["related_request_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_user_state: {
        Row: {
          created_at: string
          id: string
          last_read_at: string | null
          muted: boolean
          pinned: boolean
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_read_at?: string | null
          muted?: boolean
          pinned?: boolean
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_read_at?: string | null
          muted?: boolean
          pinned?: boolean
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_user_state_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_user_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_events: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          area: string
          created_at: string
          id: string
          metadata: Json
          subject_id: string | null
          subject_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          area: string
          created_at?: string
          id?: string
          metadata?: Json
          subject_id?: string | null
          subject_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          area?: string
          created_at?: string
          id?: string
          metadata?: Json
          subject_id?: string | null
          subject_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_evidence_events: {
        Row: {
          acknowledgment_text: string | null
          actor_email: string | null
          actor_role: string | null
          actor_user_id: string | null
          audience: string
          consent_categories: Json | null
          created_at: string
          event_area: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          policy_key: string | null
          policy_version: string | null
          public_id: string
          related_record_id: string | null
          related_record_type: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          acknowledgment_text?: string | null
          actor_email?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          audience: string
          consent_categories?: Json | null
          created_at?: string
          event_area: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          policy_key?: string | null
          policy_version?: string | null
          public_id: string
          related_record_id?: string | null
          related_record_type?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          acknowledgment_text?: string | null
          actor_email?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          audience?: string
          consent_categories?: Json | null
          created_at?: string
          event_area?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          policy_key?: string | null
          policy_version?: string | null
          public_id?: string
          related_record_id?: string | null
          related_record_type?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_evidence_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_events: {
        Row: {
          categories: Json
          consent_source: string
          consent_version: string
          created_at: string
          gpc_enabled: boolean
          id: string
          ip_hash: string | null
          page_path: string | null
          user_agent: string | null
        }
        Insert: {
          categories?: Json
          consent_source: string
          consent_version: string
          created_at?: string
          gpc_enabled?: boolean
          id?: string
          ip_hash?: string | null
          page_path?: string | null
          user_agent?: string | null
        }
        Update: {
          categories?: Json
          consent_source?: string
          consent_version?: string
          created_at?: string
          gpc_enabled?: boolean
          id?: string
          ip_hash?: string | null
          page_path?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      contact_form_submissions: {
        Row: {
          acknowledgement: boolean
          acknowledgment: boolean
          aircraft: string | null
          aircraft_category: string | null
          aircraft_make_model: string | null
          aircraft_status: string | null
          aircraft_tail_number: string | null
          aircraft_type: string | null
          arrival: string | null
          arrival_airport: string | null
          arrival_date: string | null
          company: string | null
          confirmation_email_sent: boolean
          confirmation_email_sent_at: string | null
          consent: string | null
          contact_name: string | null
          created_at: string
          crew_need: string | null
          date_time: string | null
          departure: string | null
          departure_airport: string | null
          departure_date: string | null
          destination: string | null
          email: string | null
          email_address: string | null
          email_error: string | null
          email_sent: boolean
          email_sent_at: string | null
          first_name: string | null
          form_name: string | null
          full_name: string | null
          id: string
          inquiry_type: string | null
          internal_email_sent: boolean
          internal_email_sent_at: string | null
          ip_address: string | null
          last_name: string | null
          marketing_consent: boolean
          message: string | null
          mission_type: string | null
          name: string | null
          notes: string | null
          organization: string | null
          origin: string | null
          page_url: string | null
          passenger_context: string | null
          payload: Json
          phone: string | null
          phone_number: string | null
          preferred_contact_method: string | null
          privacy_acknowledgement: boolean
          referrer: string | null
          request_type: string | null
          requested_date: string | null
          requested_time: string | null
          requester_name: string | null
          route: string | null
          service_interest: string | null
          service_type: string | null
          sms_consent: boolean
          source_page: string
          source_path: string | null
          source_url: string | null
          status: string
          subject: string | null
          submission_type: string
          support_type: string | null
          tail_number: string | null
          timing: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          acknowledgement?: boolean
          acknowledgment?: boolean
          aircraft?: string | null
          aircraft_category?: string | null
          aircraft_make_model?: string | null
          aircraft_status?: string | null
          aircraft_tail_number?: string | null
          aircraft_type?: string | null
          arrival?: string | null
          arrival_airport?: string | null
          arrival_date?: string | null
          company?: string | null
          confirmation_email_sent?: boolean
          confirmation_email_sent_at?: string | null
          consent?: string | null
          contact_name?: string | null
          created_at?: string
          crew_need?: string | null
          date_time?: string | null
          departure?: string | null
          departure_airport?: string | null
          departure_date?: string | null
          destination?: string | null
          email?: string | null
          email_address?: string | null
          email_error?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          first_name?: string | null
          form_name?: string | null
          full_name?: string | null
          id?: string
          inquiry_type?: string | null
          internal_email_sent?: boolean
          internal_email_sent_at?: string | null
          ip_address?: string | null
          last_name?: string | null
          marketing_consent?: boolean
          message?: string | null
          mission_type?: string | null
          name?: string | null
          notes?: string | null
          organization?: string | null
          origin?: string | null
          page_url?: string | null
          passenger_context?: string | null
          payload?: Json
          phone?: string | null
          phone_number?: string | null
          preferred_contact_method?: string | null
          privacy_acknowledgement?: boolean
          referrer?: string | null
          request_type?: string | null
          requested_date?: string | null
          requested_time?: string | null
          requester_name?: string | null
          route?: string | null
          service_interest?: string | null
          service_type?: string | null
          sms_consent?: boolean
          source_page?: string
          source_path?: string | null
          source_url?: string | null
          status?: string
          subject?: string | null
          submission_type?: string
          support_type?: string | null
          tail_number?: string | null
          timing?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          acknowledgement?: boolean
          acknowledgment?: boolean
          aircraft?: string | null
          aircraft_category?: string | null
          aircraft_make_model?: string | null
          aircraft_status?: string | null
          aircraft_tail_number?: string | null
          aircraft_type?: string | null
          arrival?: string | null
          arrival_airport?: string | null
          arrival_date?: string | null
          company?: string | null
          confirmation_email_sent?: boolean
          confirmation_email_sent_at?: string | null
          consent?: string | null
          contact_name?: string | null
          created_at?: string
          crew_need?: string | null
          date_time?: string | null
          departure?: string | null
          departure_airport?: string | null
          departure_date?: string | null
          destination?: string | null
          email?: string | null
          email_address?: string | null
          email_error?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          first_name?: string | null
          form_name?: string | null
          full_name?: string | null
          id?: string
          inquiry_type?: string | null
          internal_email_sent?: boolean
          internal_email_sent_at?: string | null
          ip_address?: string | null
          last_name?: string | null
          marketing_consent?: boolean
          message?: string | null
          mission_type?: string | null
          name?: string | null
          notes?: string | null
          organization?: string | null
          origin?: string | null
          page_url?: string | null
          passenger_context?: string | null
          payload?: Json
          phone?: string | null
          phone_number?: string | null
          preferred_contact_method?: string | null
          privacy_acknowledgement?: boolean
          referrer?: string | null
          request_type?: string | null
          requested_date?: string | null
          requested_time?: string | null
          requester_name?: string | null
          route?: string | null
          service_interest?: string | null
          service_type?: string | null
          sms_consent?: boolean
          source_page?: string
          source_path?: string | null
          source_url?: string | null
          status?: string
          subject?: string | null
          submission_type?: string
          support_type?: string | null
          tail_number?: string | null
          timing?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      content_approvals: {
        Row: {
          aircraft_photo_allowed: boolean
          aircraft_tail_allowed: boolean
          approval_status: string
          approved_at: string | null
          approved_by_user_id: string | null
          company_name_allowed: boolean
          compensation_or_material_connection: string | null
          content_text: string | null
          content_type: string
          created_at: string
          display_name_allowed: boolean
          expires_at: string | null
          id: string
          notes: string | null
          person_or_company_name: string | null
          release_document_path: string | null
          updated_at: string
        }
        Insert: {
          aircraft_photo_allowed?: boolean
          aircraft_tail_allowed?: boolean
          approval_status?: string
          approved_at?: string | null
          approved_by_user_id?: string | null
          company_name_allowed?: boolean
          compensation_or_material_connection?: string | null
          content_text?: string | null
          content_type: string
          created_at?: string
          display_name_allowed?: boolean
          expires_at?: string | null
          id?: string
          notes?: string | null
          person_or_company_name?: string | null
          release_document_path?: string | null
          updated_at?: string
        }
        Update: {
          aircraft_photo_allowed?: boolean
          aircraft_tail_allowed?: boolean
          approval_status?: string
          approved_at?: string | null
          approved_by_user_id?: string | null
          company_name_allowed?: boolean
          compensation_or_material_connection?: string | null
          content_text?: string | null
          content_type?: string
          created_at?: string
          display_name_allowed?: boolean
          expires_at?: string | null
          id?: string
          notes?: string | null
          person_or_company_name?: string | null
          release_document_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_approvals_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_availability: {
        Row: {
          availability_type: string
          created_at: string
          crew_id: string
          end_date: string
          id: string
          notes: string | null
          start_date: string
        }
        Insert: {
          availability_type?: string
          created_at?: string
          crew_id: string
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
        }
        Update: {
          availability_type?: string
          created_at?: string
          crew_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_availability_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_credentials: {
        Row: {
          created_at: string
          credential_type: string
          crew_id: string
          document_id: string | null
          expiration_date: string | null
          id: string
          identifier: string | null
          issued_date: string | null
          review_notes: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          crew_id: string
          document_id?: string | null
          expiration_date?: string | null
          id?: string
          identifier?: string | null
          issued_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          crew_id?: string
          document_id?: string | null
          expiration_date?: string | null
          id?: string
          identifier?: string | null
          issued_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_credentials_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_credentials_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_credentials_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_presence_sessions: {
        Row: {
          airport_code: string
          created_at: string
          crew_id: string
          duration_minutes: number
          ended_at: string | null
          ended_reason: string | null
          expires_at: string
          id: string
          latitude: number
          longitude: number
          prior_availability_status: string | null
          started_at: string
        }
        Insert: {
          airport_code: string
          created_at?: string
          crew_id: string
          duration_minutes: number
          ended_at?: string | null
          ended_reason?: string | null
          expires_at: string
          id?: string
          latitude: number
          longitude: number
          prior_availability_status?: string | null
          started_at?: string
        }
        Update: {
          airport_code?: string
          created_at?: string
          crew_id?: string
          duration_minutes?: number
          ended_at?: string | null
          ended_reason?: string | null
          expires_at?: string
          id?: string
          latitude?: number
          longitude?: number
          prior_availability_status?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_presence_sessions_airport_code_fkey"
            columns: ["airport_code"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "crew_presence_sessions_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_profiles: {
        Row: {
          address: string | null
          aircraft_type_experience: string | null
          approved: boolean
          availability_notes: string | null
          availability_status: string
          certificate_level: string | null
          certificates_held: string[]
          certificates_ratings: string | null
          city: string | null
          closest_major_airport: string | null
          company: string | null
          country: string | null
          crew_status: string
          date_of_birth: string | null
          day_rate: number | null
          desired_day_rate: number | null
          display_name: string | null
          dual_given_time: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          generally_short_notice: boolean | null
          home_airport: string | null
          id: string
          import_batch_id: string | null
          import_row_number: number | null
          import_source: string | null
          imported_at: string | null
          instrument_time: number | null
          insurance_approved: boolean
          international_experience: boolean
          jet_time: number | null
          last_contacted: string | null
          last_name: string | null
          location_display: string | null
          max_days_away: number | null
          me_time: number | null
          medical: string | null
          medical_certificate: string | null
          medical_expiration_date: string | null
          minimum_call_time: string | null
          minimum_notice_required: string | null
          multi_time: number | null
          needs_manual_review: boolean
          notes: string | null
          ops_notes: string | null
          passport_mentioned: boolean
          pic_time: number | null
          preferred_aircraft: string[] | null
          preferred_regions: string[] | null
          priority_candidate: boolean
          profile_completed_at: string | null
          profile_completion_percent: number
          profile_status: string
          ratings_held: string[]
          resume_notes: string | null
          reviewed: boolean
          searchable_text: string | null
          short_notice_available: boolean
          sic_time: number | null
          source_email: string | null
          state: string | null
          time_in_type: string | null
          total_time: number | null
          turbine_time: number | null
          type_ratings: string[] | null
          updated_at: string
          weekly_availability: Json
          willing_to_travel: boolean | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          aircraft_type_experience?: string | null
          approved?: boolean
          availability_notes?: string | null
          availability_status?: string
          certificate_level?: string | null
          certificates_held?: string[]
          certificates_ratings?: string | null
          city?: string | null
          closest_major_airport?: string | null
          company?: string | null
          country?: string | null
          crew_status?: string
          date_of_birth?: string | null
          day_rate?: number | null
          desired_day_rate?: number | null
          display_name?: string | null
          dual_given_time?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          generally_short_notice?: boolean | null
          home_airport?: string | null
          id: string
          import_batch_id?: string | null
          import_row_number?: number | null
          import_source?: string | null
          imported_at?: string | null
          instrument_time?: number | null
          insurance_approved?: boolean
          international_experience?: boolean
          jet_time?: number | null
          last_contacted?: string | null
          last_name?: string | null
          location_display?: string | null
          max_days_away?: number | null
          me_time?: number | null
          medical?: string | null
          medical_certificate?: string | null
          medical_expiration_date?: string | null
          minimum_call_time?: string | null
          minimum_notice_required?: string | null
          multi_time?: number | null
          needs_manual_review?: boolean
          notes?: string | null
          ops_notes?: string | null
          passport_mentioned?: boolean
          pic_time?: number | null
          preferred_aircraft?: string[] | null
          preferred_regions?: string[] | null
          priority_candidate?: boolean
          profile_completed_at?: string | null
          profile_completion_percent?: number
          profile_status?: string
          ratings_held?: string[]
          resume_notes?: string | null
          reviewed?: boolean
          searchable_text?: string | null
          short_notice_available?: boolean
          sic_time?: number | null
          source_email?: string | null
          state?: string | null
          time_in_type?: string | null
          total_time?: number | null
          turbine_time?: number | null
          type_ratings?: string[] | null
          updated_at?: string
          weekly_availability?: Json
          willing_to_travel?: boolean | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          aircraft_type_experience?: string | null
          approved?: boolean
          availability_notes?: string | null
          availability_status?: string
          certificate_level?: string | null
          certificates_held?: string[]
          certificates_ratings?: string | null
          city?: string | null
          closest_major_airport?: string | null
          company?: string | null
          country?: string | null
          crew_status?: string
          date_of_birth?: string | null
          day_rate?: number | null
          desired_day_rate?: number | null
          display_name?: string | null
          dual_given_time?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          generally_short_notice?: boolean | null
          home_airport?: string | null
          id?: string
          import_batch_id?: string | null
          import_row_number?: number | null
          import_source?: string | null
          imported_at?: string | null
          instrument_time?: number | null
          insurance_approved?: boolean
          international_experience?: boolean
          jet_time?: number | null
          last_contacted?: string | null
          last_name?: string | null
          location_display?: string | null
          max_days_away?: number | null
          me_time?: number | null
          medical?: string | null
          medical_certificate?: string | null
          medical_expiration_date?: string | null
          minimum_call_time?: string | null
          minimum_notice_required?: string | null
          multi_time?: number | null
          needs_manual_review?: boolean
          notes?: string | null
          ops_notes?: string | null
          passport_mentioned?: boolean
          pic_time?: number | null
          preferred_aircraft?: string[] | null
          preferred_regions?: string[] | null
          priority_candidate?: boolean
          profile_completed_at?: string | null
          profile_completion_percent?: number
          profile_status?: string
          ratings_held?: string[]
          resume_notes?: string | null
          reviewed?: boolean
          searchable_text?: string | null
          short_notice_available?: boolean
          sic_time?: number | null
          source_email?: string | null
          state?: string | null
          time_in_type?: string | null
          total_time?: number | null
          turbine_time?: number | null
          type_ratings?: string[] | null
          updated_at?: string
          weekly_availability?: Json
          willing_to_travel?: boolean | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: string
          body: string
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          lead_id: string
        }
        Insert: {
          activity_type?: string
          body: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          activity_type?: string
          body?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          company: string | null
          converted_profile_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          estimated_value: number | null
          form_submission_id: string | null
          full_name: string
          id: string
          lost_reason: string | null
          next_action_at: string | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          source: string
          stage: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          converted_profile_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          form_submission_id?: string | null
          full_name: string
          id?: string
          lost_reason?: string | null
          next_action_at?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          converted_profile_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          form_submission_id?: string | null
          full_name?: string
          id?: string
          lost_reason?: string | null
          next_action_at?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_converted_profile_id_fkey"
            columns: ["converted_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_level: string
          archived_at: string | null
          compliance_category: string
          created_at: string
          doc_type: string
          expiration_date: string | null
          file_size: number | null
          id: string
          is_current: boolean
          mime_type: string | null
          mission_id: string | null
          name: string
          notes: string | null
          original_file_name: string | null
          policy_version: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scope_id: string | null
          scope_type: string
          status: string
          storage_bucket: string
          storage_path: string
          terms_acknowledged_at: string | null
          updated_at: string
          uploaded_by: string | null
          version: number
          visibility: string
        }
        Insert: {
          access_level?: string
          archived_at?: string | null
          compliance_category?: string
          created_at?: string
          doc_type: string
          expiration_date?: string | null
          file_size?: number | null
          id?: string
          is_current?: boolean
          mime_type?: string | null
          mission_id?: string | null
          name: string
          notes?: string | null
          original_file_name?: string | null
          policy_version?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_id?: string | null
          scope_type: string
          status?: string
          storage_bucket?: string
          storage_path: string
          terms_acknowledged_at?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
          visibility?: string
        }
        Update: {
          access_level?: string
          archived_at?: string | null
          compliance_category?: string
          created_at?: string
          doc_type?: string
          expiration_date?: string | null
          file_size?: number | null
          id?: string
          is_current?: boolean
          mime_type?: string | null
          mission_id?: string | null
          name?: string
          notes?: string | null
          original_file_name?: string | null
          policy_version?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_id?: string | null
          scope_type?: string
          status?: string
          storage_bucket?: string
          storage_path?: string
          terms_acknowledged_at?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_amount: number | null
          billable_to_client: boolean
          category: string
          created_at: string
          crew_id: string
          currency: string
          expense_date: string
          id: string
          invoice_line_item_id: string | null
          merchant: string | null
          mission_id: string | null
          notes: string | null
          quote_line_item_id: string | null
          receipt_path: string | null
          reimbursable: boolean
          review_notes: string | null
          reviewed_by: string | null
          status: string
          tax_amount: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_amount?: number | null
          billable_to_client?: boolean
          category: string
          created_at?: string
          crew_id: string
          currency?: string
          expense_date?: string
          id?: string
          invoice_line_item_id?: string | null
          merchant?: string | null
          mission_id?: string | null
          notes?: string | null
          quote_line_item_id?: string | null
          receipt_path?: string | null
          reimbursable?: boolean
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          tax_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_amount?: number | null
          billable_to_client?: boolean
          category?: string
          created_at?: string
          crew_id?: string
          currency?: string
          expense_date?: string
          id?: string
          invoice_line_item_id?: string | null
          merchant?: string | null
          mission_id?: string | null
          notes?: string | null
          quote_line_item_id?: string | null
          receipt_path?: string | null
          reimbursable?: boolean
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          tax_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_invoice_line_item_id_fkey"
            columns: ["invoice_line_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_quote_line_item_id_fkey"
            columns: ["quote_line_item_id"]
            isOneToOne: false
            referencedRelation: "quote_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          billable: boolean
          billing_frequency: string | null
          calculator_inputs: Json | null
          category: string
          client_notes: string | null
          client_visible: boolean
          cost_type: string | null
          created_at: string
          description: string | null
          expense_id: string | null
          id: string
          included_in_total: boolean
          internal_cost: number | null
          internal_notes: string | null
          invoice_id: string
          item_code: string | null
          markup_type: string
          markup_value: number
          notes: string | null
          quantity: number
          recurring_interval: string | null
          recurring_interval_count: number | null
          service_date: string | null
          service_id: string | null
          service_variant_id: string | null
          sort_order: number
          taxable: boolean
          unit: string | null
          unit_price: number
        }
        Insert: {
          amount?: number
          billable?: boolean
          billing_frequency?: string | null
          calculator_inputs?: Json | null
          category: string
          client_notes?: string | null
          client_visible?: boolean
          cost_type?: string | null
          created_at?: string
          description?: string | null
          expense_id?: string | null
          id?: string
          included_in_total?: boolean
          internal_cost?: number | null
          internal_notes?: string | null
          invoice_id: string
          item_code?: string | null
          markup_type?: string
          markup_value?: number
          notes?: string | null
          quantity?: number
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          service_date?: string | null
          service_id?: string | null
          service_variant_id?: string | null
          sort_order?: number
          taxable?: boolean
          unit?: string | null
          unit_price?: number
        }
        Update: {
          amount?: number
          billable?: boolean
          billing_frequency?: string | null
          calculator_inputs?: Json | null
          category?: string
          client_notes?: string | null
          client_visible?: boolean
          cost_type?: string | null
          created_at?: string
          description?: string | null
          expense_id?: string | null
          id?: string
          included_in_total?: boolean
          internal_cost?: number | null
          internal_notes?: string | null
          invoice_id?: string
          item_code?: string | null
          markup_type?: string
          markup_value?: number
          notes?: string | null
          quantity?: number
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          service_date?: string | null
          service_id?: string | null
          service_variant_id?: string | null
          sort_order?: number
          taxable?: boolean
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_service_variant_id_fkey"
            columns: ["service_variant_id"]
            isOneToOne: false
            referencedRelation: "service_price_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          aircraft_id: string | null
          amount_due: number
          amount_paid: number
          billing_contact_company: string | null
          billing_contact_name: string | null
          billing_contact_phone: string | null
          cc_emails: string[] | null
          client_id: string | null
          client_notes: string | null
          closing_note: string | null
          created_at: string
          created_by: string | null
          currency: string
          deposit_amount: number
          deposit_paid: number
          deposit_required: boolean
          discount: number
          discount_total: number
          due_date: string | null
          dunning_paused: boolean
          footer_note: string | null
          group_line_items_by_category: boolean
          id: string
          internal_notes: string | null
          invoice_number: string
          issued_at: string | null
          mission_id: string | null
          opening_note: string | null
          paid_at: string | null
          payment_amount_cents: number | null
          payment_currency: string
          payment_error: string | null
          payment_instructions: string | null
          payment_link_url: string | null
          payment_provider: string | null
          payment_provider_session_id: string | null
          payment_status: string | null
          pdf_document_id: string | null
          pdf_template: string
          quote_id: string | null
          recipient_email: string | null
          revised_from_invoice_id: string | null
          revision_reason: string | null
          sent_at: string | null
          show_aircraft_block: boolean
          show_deposit_block: boolean
          show_line_item_details: boolean
          show_mission_block: boolean
          show_route_block: boolean
          show_tax_line: boolean
          status: string
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          stripe_payment_url: string | null
          subtotal: number
          superseded_by_invoice_id: string | null
          tax: number
          tax_total: number
          terms: string | null
          total: number
          updated_at: string
          version_number: number
          viewed_at: string | null
        }
        Insert: {
          aircraft_id?: string | null
          amount_due?: number
          amount_paid?: number
          billing_contact_company?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          cc_emails?: string[] | null
          client_id?: string | null
          client_notes?: string | null
          closing_note?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_amount?: number
          deposit_paid?: number
          deposit_required?: boolean
          discount?: number
          discount_total?: number
          due_date?: string | null
          dunning_paused?: boolean
          footer_note?: string | null
          group_line_items_by_category?: boolean
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          issued_at?: string | null
          mission_id?: string | null
          opening_note?: string | null
          paid_at?: string | null
          payment_amount_cents?: number | null
          payment_currency?: string
          payment_error?: string | null
          payment_instructions?: string | null
          payment_link_url?: string | null
          payment_provider?: string | null
          payment_provider_session_id?: string | null
          payment_status?: string | null
          pdf_document_id?: string | null
          pdf_template?: string
          quote_id?: string | null
          recipient_email?: string | null
          revised_from_invoice_id?: string | null
          revision_reason?: string | null
          sent_at?: string | null
          show_aircraft_block?: boolean
          show_deposit_block?: boolean
          show_line_item_details?: boolean
          show_mission_block?: boolean
          show_route_block?: boolean
          show_tax_line?: boolean
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_payment_url?: string | null
          subtotal?: number
          superseded_by_invoice_id?: string | null
          tax?: number
          tax_total?: number
          terms?: string | null
          total?: number
          updated_at?: string
          version_number?: number
          viewed_at?: string | null
        }
        Update: {
          aircraft_id?: string | null
          amount_due?: number
          amount_paid?: number
          billing_contact_company?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          cc_emails?: string[] | null
          client_id?: string | null
          client_notes?: string | null
          closing_note?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_amount?: number
          deposit_paid?: number
          deposit_required?: boolean
          discount?: number
          discount_total?: number
          due_date?: string | null
          dunning_paused?: boolean
          footer_note?: string | null
          group_line_items_by_category?: boolean
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          issued_at?: string | null
          mission_id?: string | null
          opening_note?: string | null
          paid_at?: string | null
          payment_amount_cents?: number | null
          payment_currency?: string
          payment_error?: string | null
          payment_instructions?: string | null
          payment_link_url?: string | null
          payment_provider?: string | null
          payment_provider_session_id?: string | null
          payment_status?: string | null
          pdf_document_id?: string | null
          pdf_template?: string
          quote_id?: string | null
          recipient_email?: string | null
          revised_from_invoice_id?: string | null
          revision_reason?: string | null
          sent_at?: string | null
          show_aircraft_block?: boolean
          show_deposit_block?: boolean
          show_line_item_details?: boolean
          show_mission_block?: boolean
          show_route_block?: boolean
          show_tax_line?: boolean
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_payment_url?: string | null
          subtotal?: number
          superseded_by_invoice_id?: string | null
          tax?: number
          tax_total?: number
          terms?: string | null
          total?: number
          updated_at?: string
          version_number?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_pdf_document_id_fkey"
            columns: ["pdf_document_id"]
            isOneToOne: false
            referencedRelation: "billing_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_revised_from_invoice_id_fkey"
            columns: ["revised_from_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_superseded_by_invoice_id_fkey"
            columns: ["superseded_by_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_consents: {
        Row: {
          consent_channel: string
          consent_source: string
          consent_status: string
          consent_text: string | null
          consent_version: string
          created_at: string
          email: string
          id: string
          phone: string | null
          related_submission_id: string | null
          requester_name: string | null
          source_url: string | null
          user_agent: string | null
        }
        Insert: {
          consent_channel: string
          consent_source: string
          consent_status: string
          consent_text?: string | null
          consent_version?: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          related_submission_id?: string | null
          requester_name?: string | null
          source_url?: string | null
          user_agent?: string | null
        }
        Update: {
          consent_channel?: string
          consent_source?: string
          consent_status?: string
          consent_text?: string | null
          consent_version?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          related_submission_id?: string | null
          requester_name?: string | null
          source_url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_consents_related_submission_id_fkey"
            columns: ["related_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          mission_id: string | null
          scope_id: string | null
          scope_type: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          mission_id?: string | null
          scope_id?: string | null
          scope_type: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          mission_id?: string | null
          scope_id?: string | null
          scope_type?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_email: string | null
          sender_id: string
          thread_id: string
          visibility: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_email?: string | null
          sender_id: string
          thread_id: string
          visibility?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_email?: string | null
          sender_id?: string
          thread_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_crew_assignments: {
        Row: {
          created_at: string
          crew_id: string
          crew_role: string
          duty_notes: string | null
          id: string
          mission_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          crew_id: string
          crew_role?: string
          duty_notes?: string | null
          id?: string
          mission_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          crew_id?: string
          crew_role?: string
          duty_notes?: string | null
          id?: string
          mission_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_crew_assignments_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_crew_assignments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_crew_requests: {
        Row: {
          created_at: string
          crew_id: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          id: string
          message: string | null
          mission_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crew_id: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          id?: string
          message?: string | null
          mission_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crew_id?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          id?: string
          message?: string | null
          mission_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_crew_requests_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_crew_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_crew_requests_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_partner_assignments: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          mission_id: string | null
          partner_id: string
          partner_notes: string | null
          quote_amount: number | null
          ref: string
          required_datetime: string | null
          responded_at: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          mission_id?: string | null
          partner_id: string
          partner_notes?: string | null
          quote_amount?: number | null
          ref?: string
          required_datetime?: string | null
          responded_at?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          mission_id?: string | null
          partner_id?: string
          partner_notes?: string | null
          quote_amount?: number | null
          ref?: string
          required_datetime?: string | null
          responded_at?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_partner_assignments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_partner_assignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_passengers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          mission_id: string
          notes: string | null
          passenger_type: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          mission_id: string
          notes?: string | null
          passenger_type?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          mission_id?: string
          notes?: string | null
          passenger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_passengers_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          additional_notes: string | null
          aircraft_id: string | null
          alternate_airport: string | null
          arrival_airport: string
          assigned_crew_id: string | null
          baggage_estimate: string | null
          catering: boolean
          client_id: string | null
          client_notes: string | null
          created_at: string
          created_by: string | null
          customs_notes: string | null
          departure_airport: string
          fbo_preference: string | null
          flexible_time: boolean
          ground_transport: boolean
          id: string
          internal_notes: string | null
          is_international: boolean
          mission_type: string
          passenger_count: number
          pets_onboard: boolean
          pool_published_at: string | null
          pool_requirements: Json
          pool_visible: boolean
          ref: string
          requested_arrival: string | null
          requested_departure: string | null
          sla_breached_at: string | null
          sla_due_at: string | null
          sla_met_at: string | null
          special_handling: string | null
          status: string
          tail_number: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          additional_notes?: string | null
          aircraft_id?: string | null
          alternate_airport?: string | null
          arrival_airport: string
          assigned_crew_id?: string | null
          baggage_estimate?: string | null
          catering?: boolean
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          created_by?: string | null
          customs_notes?: string | null
          departure_airport: string
          fbo_preference?: string | null
          flexible_time?: boolean
          ground_transport?: boolean
          id?: string
          internal_notes?: string | null
          is_international?: boolean
          mission_type?: string
          passenger_count?: number
          pets_onboard?: boolean
          pool_published_at?: string | null
          pool_requirements?: Json
          pool_visible?: boolean
          ref?: string
          requested_arrival?: string | null
          requested_departure?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
          sla_met_at?: string | null
          special_handling?: string | null
          status?: string
          tail_number?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          additional_notes?: string | null
          aircraft_id?: string | null
          alternate_airport?: string | null
          arrival_airport?: string
          assigned_crew_id?: string | null
          baggage_estimate?: string | null
          catering?: boolean
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          created_by?: string | null
          customs_notes?: string | null
          departure_airport?: string
          fbo_preference?: string | null
          flexible_time?: boolean
          ground_transport?: boolean
          id?: string
          internal_notes?: string | null
          is_international?: boolean
          mission_type?: string
          passenger_count?: number
          pets_onboard?: boolean
          pool_published_at?: string | null
          pool_requirements?: Json
          pool_visible?: boolean
          ref?: string
          requested_arrival?: string | null
          requested_departure?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
          sla_met_at?: string | null
          special_handling?: string | null
          status?: string
          tail_number?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_assigned_crew_id_fkey"
            columns: ["assigned_crew_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      network_application_files: {
        Row: {
          application_id: string
          content_type: string | null
          file_kind: string
          file_size: number | null
          id: string
          original_filename: string
          storage_bucket: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          application_id: string
          content_type?: string | null
          file_kind: string
          file_size?: number | null
          id?: string
          original_filename: string
          storage_bucket: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          application_id?: string
          content_type?: string | null
          file_kind?: string
          file_size?: number | null
          id?: string
          original_filename?: string
          storage_bucket?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_application_files_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "network_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      network_application_status_events: {
        Row: {
          application_id: string
          changed_at: string
          changed_by: string | null
          email_error: string | null
          email_sent: boolean
          email_sent_at: string | null
          id: string
          missing_information: string | null
          new_status: Database["public"]["Enums"]["network_application_status"]
          note: string | null
          other_status_reason: string | null
          previous_status:
            | Database["public"]["Enums"]["network_application_status"]
            | null
        }
        Insert: {
          application_id: string
          changed_at?: string
          changed_by?: string | null
          email_error?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          missing_information?: string | null
          new_status: Database["public"]["Enums"]["network_application_status"]
          note?: string | null
          other_status_reason?: string | null
          previous_status?:
            | Database["public"]["Enums"]["network_application_status"]
            | null
        }
        Update: {
          application_id?: string
          changed_at?: string
          changed_by?: string | null
          email_error?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          missing_information?: string | null
          new_status?: Database["public"]["Enums"]["network_application_status"]
          note?: string | null
          other_status_reason?: string | null
          previous_status?:
            | Database["public"]["Enums"]["network_application_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "network_application_status_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "network_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      network_applications: {
        Row: {
          additional_notes: string | null
          approved_at: string | null
          approved_by: string | null
          certificates_held: string[]
          closest_major_airport: string
          commute_time: string
          created_at: string
          crew_profile_id: string | null
          crew_user_id: string | null
          decision_email_sent_at: string | null
          denial_reason: string | null
          desired_day_rate: number | null
          email: string
          full_name: string
          home_airport: string
          id: string
          import_batch_id: string | null
          instrument_time: number | null
          internal_notes: string | null
          international_ops: boolean | null
          jet_time: number | null
          medical_certificate: string
          medical_expiration_date: string | null
          minimum_call_time: string
          missing_information: string | null
          multi_engine_time: number | null
          other_status_reason: string | null
          passport_available: boolean | null
          phone: string
          pic_time: number | null
          position_applied: string | null
          preferred_assignment_types: string[]
          ratings_held: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          sic_time: number | null
          source: string
          status: Database["public"]["Enums"]["network_application_status"]
          status_updated_at: string | null
          status_updated_by: string | null
          submitted_at: string
          total_time: number
          turbine_time: number | null
          type_ratings: string | null
          updated_at: string
          work_authorization_status: string
        }
        Insert: {
          additional_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          certificates_held?: string[]
          closest_major_airport: string
          commute_time: string
          created_at?: string
          crew_profile_id?: string | null
          crew_user_id?: string | null
          decision_email_sent_at?: string | null
          denial_reason?: string | null
          desired_day_rate?: number | null
          email: string
          full_name: string
          home_airport: string
          id?: string
          import_batch_id?: string | null
          instrument_time?: number | null
          internal_notes?: string | null
          international_ops?: boolean | null
          jet_time?: number | null
          medical_certificate: string
          medical_expiration_date?: string | null
          minimum_call_time: string
          missing_information?: string | null
          multi_engine_time?: number | null
          other_status_reason?: string | null
          passport_available?: boolean | null
          phone: string
          pic_time?: number | null
          position_applied?: string | null
          preferred_assignment_types?: string[]
          ratings_held?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          sic_time?: number | null
          source?: string
          status?: Database["public"]["Enums"]["network_application_status"]
          status_updated_at?: string | null
          status_updated_by?: string | null
          submitted_at?: string
          total_time: number
          turbine_time?: number | null
          type_ratings?: string | null
          updated_at?: string
          work_authorization_status: string
        }
        Update: {
          additional_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          certificates_held?: string[]
          closest_major_airport?: string
          commute_time?: string
          created_at?: string
          crew_profile_id?: string | null
          crew_user_id?: string | null
          decision_email_sent_at?: string | null
          denial_reason?: string | null
          desired_day_rate?: number | null
          email?: string
          full_name?: string
          home_airport?: string
          id?: string
          import_batch_id?: string | null
          instrument_time?: number | null
          internal_notes?: string | null
          international_ops?: boolean | null
          jet_time?: number | null
          medical_certificate?: string
          medical_expiration_date?: string | null
          minimum_call_time?: string
          missing_information?: string | null
          multi_engine_time?: number | null
          other_status_reason?: string | null
          passport_available?: boolean | null
          phone?: string
          pic_time?: number | null
          position_applied?: string | null
          preferred_assignment_types?: string[]
          ratings_held?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          sic_time?: number | null
          source?: string
          status?: Database["public"]["Enums"]["network_application_status"]
          status_updated_at?: string | null
          status_updated_by?: string | null
          submitted_at?: string
          total_time?: number
          turbine_time?: number | null
          type_ratings?: string | null
          updated_at?: string
          work_authorization_status?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          attempted_at: string | null
          channel: string
          created_at: string
          error_message: string | null
          event_type: string | null
          id: string
          notification_id: string | null
          provider: string | null
          provider_message_id: string | null
          recipient: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempted_at?: string | null
          channel: string
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          notification_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempted_at?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          notification_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          notification_type: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          notification_type?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          notification_type?: string | null
          title?: string
          user_id?: string | null
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
      onboarding_item_completions: {
        Row: {
          completed_at: string
          completed_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_done: boolean
          item_key: string
          note: string | null
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_done?: boolean
          item_key: string
          note?: string | null
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_done?: boolean
          item_key?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_item_completions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_items: {
        Row: {
          completed_by_role: string
          completion_source: string
          created_at: string
          created_by: string | null
          entity_type: string
          grants_access: boolean
          is_active: boolean
          is_auto: boolean
          is_custom: boolean
          is_required: boolean
          item_key: string
          label: string
          rule_note: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          completed_by_role?: string
          completion_source?: string
          created_at?: string
          created_by?: string | null
          entity_type: string
          grants_access?: boolean
          is_active?: boolean
          is_auto?: boolean
          is_custom?: boolean
          is_required?: boolean
          item_key: string
          label: string
          rule_note?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          completed_by_role?: string
          completion_source?: string
          created_at?: string
          created_by?: string | null
          entity_type?: string
          grants_access?: boolean
          is_active?: boolean
          is_auto?: boolean
          is_custom?: boolean
          is_required?: boolean
          item_key?: string
          label?: string
          rule_note?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          detail: string | null
          due_at: string | null
          id: string
          priority: string
          related_id: string | null
          related_label: string | null
          related_type: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          detail?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          related_id?: string | null
          related_label?: string | null
          related_type?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          detail?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          related_id?: string | null
          related_label?: string | null
          related_type?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          after_hours_support: boolean | null
          airports_served: string[] | null
          company_name: string | null
          contact_email: string | null
          hours_of_operation: string | null
          id: string
          notes: string | null
          onboarding_docs_verified: boolean
          partner_type: string | null
          phone: string | null
          primary_contact: string | null
          service_area: string | null
          service_categories: string[] | null
          service_type: string | null
        }
        Insert: {
          after_hours_support?: boolean | null
          airports_served?: string[] | null
          company_name?: string | null
          contact_email?: string | null
          hours_of_operation?: string | null
          id: string
          notes?: string | null
          onboarding_docs_verified?: boolean
          partner_type?: string | null
          phone?: string | null
          primary_contact?: string | null
          service_area?: string | null
          service_categories?: string[] | null
          service_type?: string | null
        }
        Update: {
          after_hours_support?: boolean | null
          airports_served?: string[] | null
          company_name?: string | null
          contact_email?: string | null
          hours_of_operation?: string | null
          id?: string
          notes?: string | null
          onboarding_docs_verified?: boolean
          partner_type?: string | null
          phone?: string | null
          primary_contact?: string | null
          service_area?: string | null
          service_categories?: string[] | null
          service_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_frequent: boolean
          owner_id: string
          preferences: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_frequent?: boolean
          owner_id: string
          preferences?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_frequent?: boolean
          owner_id?: string
          preferences?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passenger_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          internal_notes: string | null
          invoice_id: string
          notes: string | null
          paid_at: string
          payment_link_url: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_provider_session_id: string | null
          payment_reference: string | null
          payment_status: string | null
          provider: string | null
          provider_checkout_session_id: string | null
          provider_customer_id: string | null
          provider_payment_id: string | null
          raw_event_id: string | null
          receipt_document_id: string | null
          receipt_number: string | null
          receipt_send_suppressed: boolean
          receipt_sent_at: string | null
          recorded_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          internal_notes?: string | null
          invoice_id: string
          notes?: string | null
          paid_at?: string
          payment_link_url?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_provider_session_id?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          provider?: string | null
          provider_checkout_session_id?: string | null
          provider_customer_id?: string | null
          provider_payment_id?: string | null
          raw_event_id?: string | null
          receipt_document_id?: string | null
          receipt_number?: string | null
          receipt_send_suppressed?: boolean
          receipt_sent_at?: string | null
          recorded_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          internal_notes?: string | null
          invoice_id?: string
          notes?: string | null
          paid_at?: string
          payment_link_url?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_provider_session_id?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          provider?: string | null
          provider_checkout_session_id?: string | null
          provider_customer_id?: string | null
          provider_payment_id?: string | null
          raw_event_id?: string | null
          receipt_document_id?: string | null
          receipt_number?: string | null
          receipt_send_suppressed?: boolean
          receipt_sent_at?: string | null
          recorded_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_receipt_document_id_fkey"
            columns: ["receipt_document_id"]
            isOneToOne: false
            referencedRelation: "billing_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_user_status_events: {
        Row: {
          access_request_id: string | null
          business_purpose: string | null
          changed_at: string
          changed_by: string | null
          id: string
          new_role: string | null
          new_status: string
          note: string | null
          portal_user_id: string | null
          previous_role: string | null
          previous_status: string | null
        }
        Insert: {
          access_request_id?: string | null
          business_purpose?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_role?: string | null
          new_status: string
          note?: string | null
          portal_user_id?: string | null
          previous_role?: string | null
          previous_status?: string | null
        }
        Update: {
          access_request_id?: string | null
          business_purpose?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_role?: string | null
          new_status?: string
          note?: string | null
          portal_user_id?: string | null
          previous_role?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_user_status_events_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_user_status_events_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_user_status_events_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          details: string | null
          email: string
          id: string
          phone: string | null
          relationship: string | null
          request_type: string
          requester_name: string
          response_notes: string | null
          source_url: string | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          details?: string | null
          email: string
          id?: string
          phone?: string | null
          relationship?: string | null
          request_type: string
          requester_name: string
          response_notes?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          details?: string | null
          email?: string
          id?: string
          phone?: string | null
          relationship?: string | null
          request_type?: string
          requester_name?: string
          response_notes?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "privacy_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_notes: string | null
          assigned_role: string | null
          avatar_path: string | null
          billing_cc_emails: string[] | null
          billing_contact_email: string | null
          billing_contact_name: string | null
          billing_contact_phone: string | null
          business_purpose: string
          company_name: string | null
          created_at: string
          deleted: boolean
          deleted_at: string | null
          deleted_by: string | null
          denied_at: string | null
          denied_by: string | null
          email: string
          full_name: string | null
          home_base: string | null
          id: string
          invitation_channel: string | null
          invitation_sent_at: string | null
          invitation_status: string | null
          invited_by: string | null
          is_active: boolean
          is_deleted: boolean
          last_login_at: string | null
          last_waitlist_email_sent_at: string | null
          organization_id: string | null
          permissions: string[] | null
          phone: string | null
          phone_verification_attempts: number
          phone_verification_code_hash: string | null
          phone_verification_expires_at: string | null
          phone_verification_sent_at: string | null
          phone_verified_at: string | null
          profile_completed_at: string | null
          requested_role: string | null
          role: string
          sms_notifications_enabled: boolean
          status: string
          status_updated_at: string | null
          status_updated_by: string | null
          stripe_customer_id: string | null
          suspended_at: string | null
          suspended_by: string | null
          updated_at: string
          waitlisted_at: string | null
          waitlisted_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_role?: string | null
          avatar_path?: string | null
          billing_cc_emails?: string[] | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          business_purpose?: string
          company_name?: string | null
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          denied_at?: string | null
          denied_by?: string | null
          email: string
          full_name?: string | null
          home_base?: string | null
          id: string
          invitation_channel?: string | null
          invitation_sent_at?: string | null
          invitation_status?: string | null
          invited_by?: string | null
          is_active?: boolean
          is_deleted?: boolean
          last_login_at?: string | null
          last_waitlist_email_sent_at?: string | null
          organization_id?: string | null
          permissions?: string[] | null
          phone?: string | null
          phone_verification_attempts?: number
          phone_verification_code_hash?: string | null
          phone_verification_expires_at?: string | null
          phone_verification_sent_at?: string | null
          phone_verified_at?: string | null
          profile_completed_at?: string | null
          requested_role?: string | null
          role?: string
          sms_notifications_enabled?: boolean
          status?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          stripe_customer_id?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          updated_at?: string
          waitlisted_at?: string | null
          waitlisted_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_role?: string | null
          avatar_path?: string | null
          billing_cc_emails?: string[] | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          business_purpose?: string
          company_name?: string | null
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          denied_at?: string | null
          denied_by?: string | null
          email?: string
          full_name?: string | null
          home_base?: string | null
          id?: string
          invitation_channel?: string | null
          invitation_sent_at?: string | null
          invitation_status?: string | null
          invited_by?: string | null
          is_active?: boolean
          is_deleted?: boolean
          last_login_at?: string | null
          last_waitlist_email_sent_at?: string | null
          organization_id?: string | null
          permissions?: string[] | null
          phone?: string | null
          phone_verification_attempts?: number
          phone_verification_code_hash?: string | null
          phone_verification_expires_at?: string | null
          phone_verification_sent_at?: string | null
          phone_verified_at?: string | null
          profile_completed_at?: string | null
          requested_role?: string | null
          role?: string
          sms_notifications_enabled?: boolean
          status?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          stripe_customer_id?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          updated_at?: string
          waitlisted_at?: string | null
          waitlisted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_denied_by_fkey"
            columns: ["denied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_status_updated_by_fkey"
            columns: ["status_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_waitlisted_by_fkey"
            columns: ["waitlisted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_support_requests: {
        Row: {
          aircraft_base: string | null
          aircraft_display: string | null
          aircraft_make: string | null
          aircraft_model: string | null
          archived_at: string | null
          arrival_airport: string | null
          assigned_admin_id: string | null
          category_details: Json
          client_id: string | null
          company_name: string | null
          created_at: string
          departure_airport: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          mission_id: string
          operational_summary: string | null
          phone: string | null
          portal_account_status: string
          portal_account_user_id: string | null
          portal_invitation_sent_at: string | null
          preferred_contact_method: string | null
          raw_form: Json
          requested_service_category: string
          requested_timing: string | null
          requester_name: string
          route: string | null
          source_form_type: string
          source_submission_id: string | null
          tail_number: string | null
          updated_at: string
        }
        Insert: {
          aircraft_base?: string | null
          aircraft_display?: string | null
          aircraft_make?: string | null
          aircraft_model?: string | null
          archived_at?: string | null
          arrival_airport?: string | null
          assigned_admin_id?: string | null
          category_details?: Json
          client_id?: string | null
          company_name?: string | null
          created_at?: string
          departure_airport?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mission_id: string
          operational_summary?: string | null
          phone?: string | null
          portal_account_status?: string
          portal_account_user_id?: string | null
          portal_invitation_sent_at?: string | null
          preferred_contact_method?: string | null
          raw_form?: Json
          requested_service_category: string
          requested_timing?: string | null
          requester_name: string
          route?: string | null
          source_form_type?: string
          source_submission_id?: string | null
          tail_number?: string | null
          updated_at?: string
        }
        Update: {
          aircraft_base?: string | null
          aircraft_display?: string | null
          aircraft_make?: string | null
          aircraft_model?: string | null
          archived_at?: string | null
          arrival_airport?: string | null
          assigned_admin_id?: string | null
          category_details?: Json
          client_id?: string | null
          company_name?: string | null
          created_at?: string
          departure_airport?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mission_id?: string
          operational_summary?: string | null
          phone?: string | null
          portal_account_status?: string
          portal_account_user_id?: string | null
          portal_invitation_sent_at?: string | null
          preferred_contact_method?: string | null
          raw_form?: Json
          requested_service_category?: string
          requested_timing?: string | null
          requester_name?: string
          route?: string | null
          source_form_type?: string
          source_submission_id?: string | null
          tail_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_support_requests_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_support_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_support_requests_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: true
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_support_requests_portal_account_user_id_fkey"
            columns: ["portal_account_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_support_requests_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          amount: number
          billable: boolean
          billing_frequency: string | null
          calculator_inputs: Json | null
          category: string
          client_notes: string | null
          client_visible: boolean
          cost_type: string | null
          created_at: string
          description: string | null
          id: string
          included_in_total: boolean
          internal_cost: number | null
          internal_notes: string | null
          item_code: string | null
          markup_type: string
          markup_value: number
          notes: string | null
          price_locked: boolean | null
          quantity: number
          quote_id: string
          recurring_interval: string | null
          recurring_interval_count: number | null
          service_date: string | null
          service_id: string | null
          service_variant_id: string | null
          sort_order: number
          taxable: boolean
          unit: string | null
          unit_price: number
        }
        Insert: {
          amount?: number
          billable?: boolean
          billing_frequency?: string | null
          calculator_inputs?: Json | null
          category: string
          client_notes?: string | null
          client_visible?: boolean
          cost_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          included_in_total?: boolean
          internal_cost?: number | null
          internal_notes?: string | null
          item_code?: string | null
          markup_type?: string
          markup_value?: number
          notes?: string | null
          price_locked?: boolean | null
          quantity?: number
          quote_id: string
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          service_date?: string | null
          service_id?: string | null
          service_variant_id?: string | null
          sort_order?: number
          taxable?: boolean
          unit?: string | null
          unit_price?: number
        }
        Update: {
          amount?: number
          billable?: boolean
          billing_frequency?: string | null
          calculator_inputs?: Json | null
          category?: string
          client_notes?: string | null
          client_visible?: boolean
          cost_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          included_in_total?: boolean
          internal_cost?: number | null
          internal_notes?: string | null
          item_code?: string | null
          markup_type?: string
          markup_value?: number
          notes?: string | null
          price_locked?: boolean | null
          quantity?: number
          quote_id?: string
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          service_date?: string | null
          service_id?: string | null
          service_variant_id?: string | null
          sort_order?: number
          taxable?: boolean
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_service_variant_id_fkey"
            columns: ["service_variant_id"]
            isOneToOne: false
            referencedRelation: "service_price_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_template_line_items: {
        Row: {
          billable: boolean
          category: string
          client_visible: boolean
          cost_type: string | null
          created_at: string
          description: string | null
          id: string
          included_in_total: boolean
          quantity: number
          sort_order: number
          taxable: boolean
          template_id: string
          unit: string | null
          unit_price: number
        }
        Insert: {
          billable?: boolean
          category: string
          client_visible?: boolean
          cost_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          included_in_total?: boolean
          quantity?: number
          sort_order?: number
          taxable?: boolean
          template_id: string
          unit?: string | null
          unit_price?: number
        }
        Update: {
          billable?: boolean
          category?: string
          client_visible?: boolean
          cost_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          included_in_total?: boolean
          quantity?: number
          sort_order?: number
          taxable?: boolean
          template_id?: string
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_template_line_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quote_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_templates: {
        Row: {
          client_notes: string | null
          created_at: string
          description: string | null
          id: string
          internal_notes: string | null
          is_active: boolean
          name: string
        }
        Insert: {
          client_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          name: string
        }
        Update: {
          client_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          aircraft_summary: string | null
          approved_at: string | null
          approved_by: string | null
          balance_due_timing: string | null
          billing_contact_company: string | null
          billing_contact_name: string | null
          billing_contact_phone: string | null
          cc_emails: string[] | null
          client_id: string | null
          client_notes: string | null
          closing_note: string | null
          converted_invoice_id: string | null
          converted_subscription_id: string | null
          created_at: string
          created_by: string | null
          deposit_amount: number
          deposit_due_date: string | null
          deposit_percent: number | null
          deposit_required: boolean
          deposit_terms: string | null
          discount_total: number
          expires_at: string | null
          footer_note: string | null
          group_line_items_by_category: boolean
          id: string
          internal_notes: string | null
          manual_client_company: string | null
          manual_client_email: string | null
          manual_client_name: string | null
          manual_client_phone: string | null
          mission_id: string | null
          opening_note: string | null
          payment_due_date: string | null
          payment_instructions: string | null
          payment_method_notes: string | null
          payment_terms: string | null
          pdf_document_id: string | null
          pdf_template: string
          quote_number: string | null
          recipient_email: string | null
          recurring_total_annual: number | null
          recurring_total_monthly: number | null
          ref: string
          rejected_at: string | null
          rejected_by: string | null
          requested_timing: string | null
          revised_from_quote_id: string | null
          revision_reason: string | null
          route_summary: string | null
          sent_at: string | null
          service_scope: string | null
          show_aircraft_block: boolean
          show_deposit_block: boolean
          show_line_item_details: boolean
          show_mission_block: boolean
          show_route_block: boolean
          show_tax_line: boolean
          status: string
          subtotal: number
          superseded_by_quote_id: string | null
          tail_number: string | null
          tax_total: number
          total: number
          updated_at: string
          version_number: number
        }
        Insert: {
          aircraft_summary?: string | null
          approved_at?: string | null
          approved_by?: string | null
          balance_due_timing?: string | null
          billing_contact_company?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          cc_emails?: string[] | null
          client_id?: string | null
          client_notes?: string | null
          closing_note?: string | null
          converted_invoice_id?: string | null
          converted_subscription_id?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          deposit_due_date?: string | null
          deposit_percent?: number | null
          deposit_required?: boolean
          deposit_terms?: string | null
          discount_total?: number
          expires_at?: string | null
          footer_note?: string | null
          group_line_items_by_category?: boolean
          id?: string
          internal_notes?: string | null
          manual_client_company?: string | null
          manual_client_email?: string | null
          manual_client_name?: string | null
          manual_client_phone?: string | null
          mission_id?: string | null
          opening_note?: string | null
          payment_due_date?: string | null
          payment_instructions?: string | null
          payment_method_notes?: string | null
          payment_terms?: string | null
          pdf_document_id?: string | null
          pdf_template?: string
          quote_number?: string | null
          recipient_email?: string | null
          recurring_total_annual?: number | null
          recurring_total_monthly?: number | null
          ref?: string
          rejected_at?: string | null
          rejected_by?: string | null
          requested_timing?: string | null
          revised_from_quote_id?: string | null
          revision_reason?: string | null
          route_summary?: string | null
          sent_at?: string | null
          service_scope?: string | null
          show_aircraft_block?: boolean
          show_deposit_block?: boolean
          show_line_item_details?: boolean
          show_mission_block?: boolean
          show_route_block?: boolean
          show_tax_line?: boolean
          status?: string
          subtotal?: number
          superseded_by_quote_id?: string | null
          tail_number?: string | null
          tax_total?: number
          total?: number
          updated_at?: string
          version_number?: number
        }
        Update: {
          aircraft_summary?: string | null
          approved_at?: string | null
          approved_by?: string | null
          balance_due_timing?: string | null
          billing_contact_company?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          cc_emails?: string[] | null
          client_id?: string | null
          client_notes?: string | null
          closing_note?: string | null
          converted_invoice_id?: string | null
          converted_subscription_id?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          deposit_due_date?: string | null
          deposit_percent?: number | null
          deposit_required?: boolean
          deposit_terms?: string | null
          discount_total?: number
          expires_at?: string | null
          footer_note?: string | null
          group_line_items_by_category?: boolean
          id?: string
          internal_notes?: string | null
          manual_client_company?: string | null
          manual_client_email?: string | null
          manual_client_name?: string | null
          manual_client_phone?: string | null
          mission_id?: string | null
          opening_note?: string | null
          payment_due_date?: string | null
          payment_instructions?: string | null
          payment_method_notes?: string | null
          payment_terms?: string | null
          pdf_document_id?: string | null
          pdf_template?: string
          quote_number?: string | null
          recipient_email?: string | null
          recurring_total_annual?: number | null
          recurring_total_monthly?: number | null
          ref?: string
          rejected_at?: string | null
          rejected_by?: string | null
          requested_timing?: string | null
          revised_from_quote_id?: string | null
          revision_reason?: string | null
          route_summary?: string | null
          sent_at?: string | null
          service_scope?: string | null
          show_aircraft_block?: boolean
          show_deposit_block?: boolean
          show_line_item_details?: boolean
          show_mission_block?: boolean
          show_route_block?: boolean
          show_tax_line?: boolean
          status?: string
          subtotal?: number
          superseded_by_quote_id?: string | null
          tail_number?: string | null
          tax_total?: number
          total?: number
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_invoice_id_fkey"
            columns: ["converted_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_subscription_id_fkey"
            columns: ["converted_subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_pdf_document_id_fkey"
            columns: ["pdf_document_id"]
            isOneToOne: false
            referencedRelation: "billing_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_revised_from_quote_id_fkey"
            columns: ["revised_from_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_superseded_by_quote_id_fkey"
            columns: ["superseded_by_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_add: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module: string
          role: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          can_add?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module: string
          role: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          can_add?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module?: string
          role?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_emails: {
        Row: {
          body: string
          created_at: string
          created_by: string
          failure_reason: string | null
          id: string
          lead_id: string | null
          recipient_email: string
          send_at: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          failure_reason?: string | null
          id?: string
          lead_id?: string | null
          recipient_email: string
          send_at: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          failure_reason?: string | null
          id?: string
          lead_id?: string | null
          recipient_email?: string
          send_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      service_attachments: {
        Row: {
          attachment_mode: string
          child_service_id: string
          created_at: string
          id: string
          parent_service_id: string
          price_override: number | null
          quantity: number
          sort_order: number | null
        }
        Insert: {
          attachment_mode?: string
          child_service_id: string
          created_at?: string
          id?: string
          parent_service_id: string
          price_override?: number | null
          quantity?: number
          sort_order?: number | null
        }
        Update: {
          attachment_mode?: string
          child_service_id?: string
          created_at?: string
          id?: string
          parent_service_id?: string
          price_override?: number | null
          quantity?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_attachments_child_service_id_fkey"
            columns: ["child_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_attachments_parent_service_id_fkey"
            columns: ["parent_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_price_variants: {
        Row: {
          aircraft_band: string | null
          aircraft_category: string | null
          annual_price: number | null
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          label: string | null
          plan_tier_match: string | null
          service_id: string
          sort_order: number | null
          stripe_price_id_live: string | null
          stripe_price_id_test: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          aircraft_band?: string | null
          aircraft_category?: string | null
          annual_price?: number | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          label?: string | null
          plan_tier_match?: string | null
          service_id: string
          sort_order?: number | null
          stripe_price_id_live?: string | null
          stripe_price_id_test?: string | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          aircraft_band?: string | null
          aircraft_category?: string | null
          annual_price?: number | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          label?: string | null
          plan_tier_match?: string | null
          service_id?: string
          sort_order?: number | null
          stripe_price_id_live?: string | null
          stripe_price_id_test?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_price_variants_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_variables: {
        Row: {
          created_at: string
          default_value: string | null
          id: string
          input_type: string
          key: string
          label: string
          max_value: number | null
          min_value: number | null
          options: Json | null
          required: boolean
          role: string
          service_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          id?: string
          input_type?: string
          key: string
          label: string
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          required?: boolean
          role?: string
          service_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_value?: string | null
          id?: string
          input_type?: string
          key?: string
          label?: string
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          required?: boolean
          role?: string
          service_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_variables_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          billable: boolean
          category: string | null
          client_description: string | null
          client_visible: boolean
          code: string
          cost_type: string
          created_at: string
          created_by: string | null
          default_unit_price: number | null
          description: string | null
          frequency: string
          id: string
          linked_plan_tier_id: string | null
          max_quantity: number | null
          min_quantity: number | null
          name: string
          notes_internal: string | null
          pricing_model: string
          recurring_interval: string | null
          recurring_interval_count: number | null
          requires_deposit_percent: number | null
          sort_order: number | null
          status: string
          stripe_product_id_live: string | null
          stripe_product_id_test: string | null
          stripe_sync_error: string | null
          stripe_sync_status: string
          taxable: boolean
          unit: string | null
          updated_at: string
        }
        Insert: {
          billable?: boolean
          category?: string | null
          client_description?: string | null
          client_visible?: boolean
          code: string
          cost_type: string
          created_at?: string
          created_by?: string | null
          default_unit_price?: number | null
          description?: string | null
          frequency?: string
          id?: string
          linked_plan_tier_id?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name: string
          notes_internal?: string | null
          pricing_model?: string
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          requires_deposit_percent?: number | null
          sort_order?: number | null
          status?: string
          stripe_product_id_live?: string | null
          stripe_product_id_test?: string | null
          stripe_sync_error?: string | null
          stripe_sync_status?: string
          taxable?: boolean
          unit?: string | null
          updated_at?: string
        }
        Update: {
          billable?: boolean
          category?: string | null
          client_description?: string | null
          client_visible?: boolean
          code?: string
          cost_type?: string
          created_at?: string
          created_by?: string | null
          default_unit_price?: number | null
          description?: string | null
          frequency?: string
          id?: string
          linked_plan_tier_id?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string
          notes_internal?: string | null
          pricing_model?: string
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          requires_deposit_percent?: number | null
          sort_order?: number | null
          status?: string
          stripe_product_id_live?: string | null
          stripe_product_id_test?: string | null
          stripe_sync_error?: string | null
          stripe_sync_status?: string
          taxable?: boolean
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_linked_plan_tier_id_fkey"
            columns: ["linked_plan_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_plan_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string | null
          id: string
          portal_subscription_id: string | null
          processed_at: string | null
          received_at: string
          status: string
          stripe_customer_id: string | null
          stripe_event_id: string
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type?: string | null
          id?: string
          portal_subscription_id?: string | null
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_event_id: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string | null
          id?: string
          portal_subscription_id?: string | null
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_event_id?: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_portal_subscription_id_fkey"
            columns: ["portal_subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_billing_invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          client_id: string | null
          created_at: string
          currency: string
          hosted_invoice_url: string | null
          id: string
          invoice_pdf_url: string | null
          paid_at: string | null
          payment_status: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_invoice_id: string
          stripe_invoice_number: string | null
          stripe_subscription_id: string | null
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf_url?: string | null
          paid_at?: string | null
          payment_status?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id: string
          stripe_invoice_number?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf_url?: string | null
          paid_at?: string | null
          payment_status?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string
          stripe_invoice_number?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_billing_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_credits: {
        Row: {
          amount: number
          applied_to_invoice_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          source_type: string
          subscription_id: string
        }
        Insert: {
          amount?: number
          applied_to_invoice_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          source_type?: string
          subscription_id: string
        }
        Update: {
          amount?: number
          applied_to_invoice_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          source_type?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_credits_applied_to_invoice_id_fkey"
            columns: ["applied_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_credits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_credits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_credits_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plan_tiers: {
        Row: {
          annual_price: number
          created_at: string
          crew_day_rate: number | null
          id: string
          included_admin_hours: number
          included_flights: number
          included_mx_repositions: number
          lodging_policy: string | null
          monthly_price: number
          name: string
          plan_id: string
          priority_level: string | null
          sort_order: number
          stripe_annual_price_id: string | null
          stripe_live_annual_price_id: string | null
          stripe_live_monthly_price_id: string | null
          stripe_live_product_id: string | null
          stripe_monthly_price_id: string | null
          stripe_product_id: string | null
          stripe_test_annual_price_id: string | null
          stripe_test_monthly_price_id: string | null
          stripe_test_product_id: string | null
          travel_policy: string | null
          updated_at: string
        }
        Insert: {
          annual_price?: number
          created_at?: string
          crew_day_rate?: number | null
          id?: string
          included_admin_hours?: number
          included_flights?: number
          included_mx_repositions?: number
          lodging_policy?: string | null
          monthly_price?: number
          name: string
          plan_id: string
          priority_level?: string | null
          sort_order?: number
          stripe_annual_price_id?: string | null
          stripe_live_annual_price_id?: string | null
          stripe_live_monthly_price_id?: string | null
          stripe_live_product_id?: string | null
          stripe_monthly_price_id?: string | null
          stripe_product_id?: string | null
          stripe_test_annual_price_id?: string | null
          stripe_test_monthly_price_id?: string | null
          stripe_test_product_id?: string | null
          travel_policy?: string | null
          updated_at?: string
        }
        Update: {
          annual_price?: number
          created_at?: string
          crew_day_rate?: number | null
          id?: string
          included_admin_hours?: number
          included_flights?: number
          included_mx_repositions?: number
          lodging_policy?: string | null
          monthly_price?: number
          name?: string
          plan_id?: string
          priority_level?: string | null
          sort_order?: number
          stripe_annual_price_id?: string | null
          stripe_live_annual_price_id?: string | null
          stripe_live_monthly_price_id?: string | null
          stripe_live_product_id?: string | null
          stripe_monthly_price_id?: string | null
          stripe_product_id?: string | null
          stripe_test_annual_price_id?: string | null
          stripe_test_monthly_price_id?: string | null
          stripe_test_product_id?: string | null
          travel_policy?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plan_tiers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          aircraft_category: string | null
          annual_discount_percent: number
          base_admin_fee_annual: number
          base_admin_fee_monthly: number
          billing_cadence_supported: string[]
          created_at: string
          default_terms: string | null
          description: string | null
          id: string
          name: string
          plan_code: string | null
          status: string
          stripe_live_product_id: string | null
          stripe_product_id: string | null
          stripe_test_product_id: string | null
          updated_at: string
        }
        Insert: {
          aircraft_category?: string | null
          annual_discount_percent?: number
          base_admin_fee_annual?: number
          base_admin_fee_monthly?: number
          billing_cadence_supported?: string[]
          created_at?: string
          default_terms?: string | null
          description?: string | null
          id?: string
          name: string
          plan_code?: string | null
          status?: string
          stripe_live_product_id?: string | null
          stripe_product_id?: string | null
          stripe_test_product_id?: string | null
          updated_at?: string
        }
        Update: {
          aircraft_category?: string | null
          annual_discount_percent?: number
          base_admin_fee_annual?: number
          base_admin_fee_monthly?: number
          billing_cadence_supported?: string[]
          created_at?: string
          default_terms?: string | null
          description?: string | null
          id?: string
          name?: string
          plan_code?: string | null
          status?: string
          stripe_live_product_id?: string | null
          stripe_product_id?: string | null
          stripe_test_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_usage_events: {
        Row: {
          client_id: string
          covered_amount: number
          covered_quantity: number
          created_at: string
          created_by: string | null
          id: string
          mission_id: string | null
          notes: string | null
          overage_amount: number
          overage_quantity: number
          quantity: number
          subscription_id: string
          unit: string | null
          unit_rate: number
          usage_type: string
        }
        Insert: {
          client_id: string
          covered_amount?: number
          covered_quantity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          mission_id?: string | null
          notes?: string | null
          overage_amount?: number
          overage_quantity?: number
          quantity?: number
          subscription_id: string
          unit?: string | null
          unit_rate?: number
          usage_type?: string
        }
        Update: {
          client_id?: string
          covered_amount?: number
          covered_quantity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          mission_id?: string | null
          notes?: string | null
          overage_amount?: number
          overage_quantity?: number
          quantity?: number
          subscription_id?: string
          unit?: string | null
          unit_rate?: number
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_members: {
        Row: {
          profile_id: string
          thread_id: string
        }
        Insert: {
          profile_id: string
          thread_id: string
        }
        Update: {
          profile_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          home_airport: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          home_airport?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          home_airport?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      vendor_invoice_lines: {
        Row: {
          amount: number
          description: string
          id: string
          invoice_id: string
          position: number
          quantity: number
          unit_amount: number
        }
        Insert: {
          amount?: number
          description: string
          id?: string
          invoice_id: string
          position?: number
          quantity?: number
          unit_amount?: number
        }
        Update: {
          amount?: number
          description?: string
          id?: string
          invoice_id?: string
          position?: number
          quantity?: number
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "vendor_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_invoices: {
        Row: {
          bill_from_address: string | null
          bill_from_company: string | null
          bill_from_email: string | null
          bill_from_name: string
          bill_from_phone: string | null
          bill_from_tax_id: string | null
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          mission_id: string | null
          notes: string | null
          paid_at: string | null
          payment_instructions: string | null
          payment_reference: string | null
          ref: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitter_id: string
          submitter_role: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          bill_from_address?: string | null
          bill_from_company?: string | null
          bill_from_email?: string | null
          bill_from_name: string
          bill_from_phone?: string | null
          bill_from_tax_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          mission_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          payment_reference?: string | null
          ref: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitter_id: string
          submitter_role: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          bill_from_address?: string | null
          bill_from_company?: string | null
          bill_from_email?: string | null
          bill_from_name?: string
          bill_from_phone?: string | null
          bill_from_tax_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          mission_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          payment_reference?: string | null
          ref?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitter_id?: string
          submitter_role?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_invoices_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invoices_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invoices_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_receipts: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          id: string
          invoice_id: string | null
          mime_type: string | null
          mission_id: string | null
          storage_bucket: string
          storage_path: string
          uploader_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          invoice_id?: string | null
          mime_type?: string | null
          mission_id?: string | null
          storage_bucket?: string
          storage_path: string
          uploader_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          invoice_id?: string | null
          mime_type?: string | null
          mission_id?: string | null
          storage_bucket?: string
          storage_path?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "vendor_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_receipts_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_receipts_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      website_content_drafts: {
        Row: {
          base_git_sha: string | null
          branch_name: string | null
          content_json: Json
          created_at: string
          created_by: string | null
          id: string
          last_preview_url: string | null
          notes: string | null
          page_slug: string
          pull_request_url: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_git_sha?: string | null
          branch_name?: string | null
          content_json: Json
          created_at?: string
          created_by?: string | null
          id?: string
          last_preview_url?: string | null
          notes?: string | null
          page_slug: string
          pull_request_url?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_git_sha?: string | null
          branch_name?: string | null
          content_json?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          last_preview_url?: string | null
          notes?: string | null
          page_slug?: string
          pull_request_url?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      website_publish_events: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          draft_id: string | null
          error_message: string | null
          github_branch: string | null
          github_commit_sha: string | null
          github_pr_url: string | null
          id: string
          page_slug: string
          result: string | null
          vercel_preview_url: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          draft_id?: string | null
          error_message?: string | null
          github_branch?: string | null
          github_commit_sha?: string | null
          github_pr_url?: string | null
          id?: string
          page_slug: string
          result?: string | null
          vercel_preview_url?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          draft_id?: string | null
          error_message?: string | null
          github_branch?: string | null
          github_commit_sha?: string | null
          github_pr_url?: string | null
          id?: string
          page_slug?: string
          result?: string | null
          vercel_preview_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_publish_events_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "website_content_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_access_request: {
        Args: { p_admin_notes?: string; p_request_id: string }
        Returns: undefined
      }
      assign_crew_to_trip: {
        Args: { p_crew_user_id: string; p_trip_id: string }
        Returns: string
      }
      fn_broadcast_presence_change: { Args: never; Returns: undefined }
      fn_crew_can_go_active: { Args: { p_crew: string }; Returns: boolean }
      fn_crew_go_active_blockers: {
        Args: { p_crew: string }
        Returns: string[]
      }
      fn_crew_has_current_medical: {
        Args: { p_crew: string }
        Returns: boolean
      }
      fn_expire_presence: { Args: never; Returns: undefined }
      fn_restore_availability: {
        Args: { p_crew: string; p_prior: string }
        Returns: undefined
      }
      get_my_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_amg_admin: { Args: never; Returns: boolean }
      is_approved_admin: { Args: never; Returns: boolean }
      is_approved_portal_user: { Args: never; Returns: boolean }
      is_approved_super_admin: { Args: never; Returns: boolean }
      is_crew_on_mission: { Args: { p_mission: string }; Returns: boolean }
      is_partner_on_mission: { Args: { p_mission: string }; Returns: boolean }
      next_billing_document_number: {
        Args: { p_document_type: string }
        Returns: string
      }
      reject_access_request: {
        Args: { p_admin_notes?: string; p_request_id: string }
        Returns: undefined
      }
      rpc_crew_go_active: {
        Args: { p_airport: string; p_duration_minutes: number }
        Returns: {
          airport_code: string
          created_at: string
          crew_id: string
          duration_minutes: number
          ended_at: string | null
          ended_reason: string | null
          expires_at: string
          id: string
          latitude: number
          longitude: number
          prior_availability_status: string | null
          started_at: string
        }
        SetofOptions: {
          from: "*"
          to: "crew_presence_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crew_go_offline: { Args: never; Returns: undefined }
      rpc_crew_map_admin_stats: { Args: never; Returns: Json }
      rpc_crew_map_crew_stats: { Args: never; Returns: Json }
      rpc_map_admin: {
        Args: never
        Returns: {
          airport_code: string
          airport_name: string
          availability_status: string
          avatar_path: string
          city: string
          crew_id: string
          desired_day_rate: number
          email: string
          expires_at: string
          full_name: string
          latitude: number
          longitude: number
          phone: string
          started_at: string
          state: string
          total_time: number
          type_ratings: string[]
        }[]
      }
      rpc_map_client: {
        Args: never
        Returns: {
          by_state: Json
          online_count: number
          total_online_hours: number
          type_ratings_online: string[]
        }[]
      }
      rpc_map_crew: {
        Args: never
        Returns: {
          active_count: number
          airport_code: string
          city: string
          latitude: number
          longitude: number
          name: string
          state: string
        }[]
      }
      update_trip_status: {
        Args: { p_admin_notes?: string; p_status: string; p_trip_id: string }
        Returns: undefined
      }
      upsert_crew_availability: {
        Args: {
          p_availability_status: string
          p_available_date: string
          p_notes?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      access_request_stage: "submitted" | "in_review" | "decision"
      approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "disabled"
        | "pending_approval"
        | "denied"
        | "waitlisted"
        | "suspended"
        | "deleted"
      assignment_status:
        | "offered"
        | "accepted"
        | "declined"
        | "completed"
        | "cancelled"
      network_application_status:
        | "awaiting_review"
        | "in_review"
        | "additional_information_needed"
        | "approved"
        | "denied"
        | "waitlist"
        | "other"
      review_status: "pending_review" | "approved" | "rejected" | "expired"
      trip_status:
        | "requested"
        | "pending_amg_review"
        | "crew_assigned"
        | "scheduled"
        | "completed"
        | "cancelled"
      trip_type:
        | "owner_trip"
        | "ferry"
        | "maintenance_flight"
        | "repositioning"
        | "contract_pilot"
        | "delivery_flight"
        | "other"
      user_role:
        | "client_owner"
        | "crew_pilot"
        | "maintenance_center"
        | "broker"
        | "amg_operations"
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
      access_request_stage: ["submitted", "in_review", "decision"],
      approval_status: [
        "pending",
        "approved",
        "rejected",
        "disabled",
        "pending_approval",
        "denied",
        "waitlisted",
        "suspended",
        "deleted",
      ],
      assignment_status: [
        "offered",
        "accepted",
        "declined",
        "completed",
        "cancelled",
      ],
      network_application_status: [
        "awaiting_review",
        "in_review",
        "additional_information_needed",
        "approved",
        "denied",
        "waitlist",
        "other",
      ],
      review_status: ["pending_review", "approved", "rejected", "expired"],
      trip_status: [
        "requested",
        "pending_amg_review",
        "crew_assigned",
        "scheduled",
        "completed",
        "cancelled",
      ],
      trip_type: [
        "owner_trip",
        "ferry",
        "maintenance_flight",
        "repositioning",
        "contract_pilot",
        "delivery_flight",
        "other",
      ],
      user_role: [
        "client_owner",
        "crew_pilot",
        "maintenance_center",
        "broker",
        "amg_operations",
      ],
    },
  },
} as const
