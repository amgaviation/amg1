export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aircraft: {
        Row: {
          aircraft_category: string | null
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
        Update: Partial<Database["public"]["Tables"]["aircraft"]["Insert"]>
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
        Update: Partial<Database["public"]["Tables"]["audit_events"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["crew_availability"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["crew_credentials"]["Insert"]>
        Relationships: []
      }
      crew_profiles: {
        Row: {
          availability_status: string
          certificate_level: string | null
          day_rate: number | null
          id: string
          international_experience: boolean
          jet_time: number | null
          max_days_away: number | null
          multi_time: number | null
          ops_notes: string | null
          pic_time: number | null
          preferred_aircraft: string[] | null
          preferred_regions: string[] | null
          short_notice_available: boolean
          sic_time: number | null
          time_in_type: string | null
          total_time: number | null
          turbine_time: number | null
          type_ratings: string[] | null
          updated_at: string
        }
        Insert: {
          availability_status?: string
          certificate_level?: string | null
          day_rate?: number | null
          id: string
          international_experience?: boolean
          jet_time?: number | null
          max_days_away?: number | null
          multi_time?: number | null
          ops_notes?: string | null
          pic_time?: number | null
          preferred_aircraft?: string[] | null
          preferred_regions?: string[] | null
          short_notice_available?: boolean
          sic_time?: number | null
          time_in_type?: string | null
          total_time?: number | null
          turbine_time?: number | null
          type_ratings?: string[] | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["crew_profiles"]["Insert"]>
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          expiration_date: string | null
          id: string
          is_current: boolean
          mission_id: string | null
          name: string
          review_notes: string | null
          reviewed_by: string | null
          scope_id: string | null
          scope_type: string
          status: string
          storage_path: string
          uploaded_by: string | null
          version: number
          visibility: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          expiration_date?: string | null
          id?: string
          is_current?: boolean
          mission_id?: string | null
          name: string
          review_notes?: string | null
          reviewed_by?: string | null
          scope_id?: string | null
          scope_type: string
          status?: string
          storage_path: string
          uploaded_by?: string | null
          version?: number
          visibility?: string
        }
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_amount: number | null
          billable_to_client: boolean
          category: string
          created_at: string
          crew_id: string
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
          currency: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_amount?: number | null
          billable_to_client?: boolean
          category: string
          created_at?: string
          crew_id: string
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
          currency?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_id: string | null
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          expense_id?: string | null
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          unit?: string | null
          unit_price?: number
        }
        Update: Partial<Database["public"]["Tables"]["invoice_line_items"]["Insert"]>
        Relationships: []
      }
      invoices: {
        Row: {
          aircraft_id: string | null
          amount_due: number
          amount_paid: number
          client_id: string | null
          client_notes: string | null
          created_at: string
          created_by: string | null
          currency: string
          discount: number
          due_date: string | null
          id: string
          internal_notes: string | null
          invoice_number: string
          issued_at: string | null
          mission_id: string | null
          paid_at: string | null
          quote_id: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax: number
          terms: string | null
          total: number
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          aircraft_id?: string | null
          amount_due?: number
          amount_paid?: number
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          discount?: number
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          issued_at?: string | null
          mission_id?: string | null
          paid_at?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax?: number
          terms?: string | null
          total?: number
          updated_at?: string
          viewed_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["message_threads"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["mission_crew_assignments"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["mission_partner_assignments"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["mission_passengers"]["Insert"]>
        Relationships: []
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
          ref: string
          requested_arrival: string | null
          requested_departure: string | null
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
          ref?: string
          requested_arrival?: string | null
          requested_departure?: string | null
          special_handling?: string | null
          status?: string
          tail_number?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: Partial<Database["public"]["Tables"]["missions"]["Insert"]>
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
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_id: string
          notes: string | null
          paid_at: string
          payment_method: string | null
          provider: string | null
          provider_payment_id: string | null
          recorded_by: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id: string
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          recorded_by?: string | null
          status?: string
        }
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>
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
        Update: Partial<Database["public"]["Tables"]["notification_deliveries"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>
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
          partner_type?: string | null
          phone?: string | null
          primary_contact?: string | null
          service_area?: string | null
          service_categories?: string[] | null
          service_type?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["partner_profiles"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["passenger_profiles"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          home_base: string | null
          id: string
          invitation_channel: string | null
          invitation_sent_at: string | null
          invitation_status: string | null
          invited_by: string | null
          is_active: boolean
          last_login_at: string | null
          organization_id: string | null
          permissions: string[] | null
          phone: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          home_base?: string | null
          id: string
          invitation_channel?: string | null
          invitation_sent_at?: string | null
          invitation_status?: string | null
          invited_by?: string | null
          is_active?: boolean
          last_login_at?: string | null
          organization_id?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      quote_line_items: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          quantity: number
          quote_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          quantity?: number
          quote_id: string
          sort_order?: number
          unit_price?: number
        }
        Update: Partial<Database["public"]["Tables"]["quote_line_items"]["Insert"]>
        Relationships: []
      }
      quotes: {
        Row: {
          approved_by: string | null
          client_id: string | null
          client_notes: string | null
          created_at: string
          created_by: string | null
          id: string
          internal_notes: string | null
          mission_id: string | null
          ref: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          internal_notes?: string | null
          mission_id?: string | null
          ref?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>
        Relationships: []
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
        Update: Partial<Database["public"]["Tables"]["thread_members"]["Insert"]>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_my_role: { Args: Record<string, never>; Returns: string }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_crew_on_mission: { Args: { p_mission: string }; Returns: boolean }
      is_partner_on_mission: { Args: { p_mission: string }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]
