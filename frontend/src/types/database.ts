// Includes the deployed portal completion migrations.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      administrators: {
        Row: {
          admin_id: string
          name: string
          office_assigned: string
          position: string
        }
        Insert: {
          admin_id: string
          name: string
          office_assigned: string
          position: string
        }
        Update: {
          admin_id?: string
          name?: string
          office_assigned?: string
          position?: string
        }
        Relationships: [
          {
            foreignKeyName: "administrations_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event: {
        Row: {
          archived_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          ends_at: string
          event_id: string
          event_status: string
          event_type_id: string
          org_id: string
          post_caption: string | null
          proposal_id: string | null
          publication_status: string
          published_at: string | null
          registration_capacity: number
          registration_status: string
          rescheduled_at: string | null
          rescheduled_by: string | null
          rescheduled_reason: string | null
          starts_at: string
        }
        Insert: {
          archived_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          ends_at: string
          event_id: string
          event_status: string
          event_type_id: string
          org_id: string
          post_caption?: string | null
          proposal_id?: string | null
          publication_status?: string
          published_at?: string | null
          registration_capacity: number
          registration_status?: string
          rescheduled_at?: string | null
          rescheduled_by?: string | null
          rescheduled_reason?: string | null
          starts_at: string
        }
        Update: {
          archived_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          ends_at?: string
          event_id?: string
          event_status?: string
          event_type_id?: string
          org_id?: string
          post_caption?: string | null
          proposal_id?: string | null
          publication_status?: string
          published_at?: string | null
          registration_capacity?: number
          registration_status?: string
          rescheduled_at?: string | null
          rescheduled_by?: string | null
          rescheduled_reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "event_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_type"
            referencedColumns: ["event_type_id"]
          },
          {
            foreignKeyName: "event_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "student_organization"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "event_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: true
            referencedRelation: "event_proposal"
            referencedColumns: ["proposal_id"]
          },
          {
            foreignKeyName: "event_rescheduled_by_fkey"
            columns: ["rescheduled_by"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["admin_id"]
          },
        ]
      }
      event_proposal: {
        Row: {
          allowed_programs: string[]
          allowed_college: string | null
          approval_status: string
          budget_information: string | null
          collaborating_organization_text: string | null
          description: string
          eligibility_mode: string
          event_name: string
          event_type_id: string
          expected_count_attendees: number
          includes_sponsorship: boolean
          objectives: string
          org_id: string
          proposal_id: string
          resource_requirements: string | null
          submission_date: string
        }
        Insert: {
          allowed_programs?: string[]
          allowed_college?: string | null
          approval_status: string
          budget_information?: string | null
          collaborating_organization_text?: string | null
          description: string
          eligibility_mode: string
          event_name: string
          event_type_id: string
          expected_count_attendees: number
          includes_sponsorship?: boolean
          objectives: string
          org_id: string
          proposal_id: string
          resource_requirements?: string | null
          submission_date: string
        }
        Update: {
          allowed_programs?: string[]
          allowed_college?: string | null
          approval_status?: string
          budget_information?: string | null
          collaborating_organization_text?: string | null
          description?: string
          eligibility_mode?: string
          event_name?: string
          event_type_id?: string
          expected_count_attendees?: number
          includes_sponsorship?: boolean
          objectives?: string
          org_id?: string
          proposal_id?: string
          resource_requirements?: string | null
          submission_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_proposal_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_type"
            referencedColumns: ["event_type_id"]
          },
          {
            foreignKeyName: "event_proposal_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "student_organization"
            referencedColumns: ["org_id"]
          },
        ]
      }
      event_type: {
        Row: {
          description: string
          event_type_id: string
          modality: string
          requires_venue: boolean
        }
        Insert: {
          description: string
          event_type_id: string
          modality: string
          requires_venue: boolean
        }
        Update: {
          description?: string
          event_type_id?: string
          modality?: string
          requires_venue?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          event_id: string | null
          message: string
          notification_id: number
          notification_type: string
          proposal_id: string | null
          read_at: string | null
          recipient_user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          message: string
          notification_id?: number
          notification_type: string
          proposal_id?: string | null
          read_at?: string | null
          recipient_user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          message?: string
          notification_id?: number
          notification_type?: string
          proposal_id?: string | null
          read_at?: string | null
          recipient_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "notifications_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposal"
            referencedColumns: ["proposal_id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      proposal_review: {
        Row: {
          admin_id: string
          admin_remarks: string | null
          proposal_id: string
          review_decision: string
          review_id: string
          reviewed_at: string
        }
        Insert: {
          admin_id: string
          admin_remarks?: string | null
          proposal_id: string
          review_decision: string
          review_id: string
          reviewed_at: string
        }
        Update: {
          admin_id?: string
          admin_remarks?: string | null
          proposal_id?: string
          review_decision?: string
          review_id?: string
          reviewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_review_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "proposal_review_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposal"
            referencedColumns: ["proposal_id"]
          },
        ]
      }
      proposal_schedule: {
        Row: {
          ends_at: string
          proposal_id: string
          schedule_id: string
          schedule_type: string
          starts_at: string
          venue_id: string | null
        }
        Insert: {
          ends_at: string
          proposal_id: string
          schedule_id: string
          schedule_type: string
          starts_at: string
          venue_id?: string | null
        }
        Update: {
          ends_at?: string
          proposal_id?: string
          schedule_id?: string
          schedule_type?: string
          starts_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_schedule_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposal"
            referencedColumns: ["proposal_id"]
          },
          {
            foreignKeyName: "proposal_schedule_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      registration: {
        Row: {
          attendance_marked_at: string | null
          attendance_marked_by: string | null
          attendance_status: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          event_id: string
          reg_date: string
          reg_id: string
          reg_status: string
          student_number: string
        }
        Insert: {
          attendance_marked_at?: string | null
          attendance_marked_by?: string | null
          attendance_status?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          event_id: string
          reg_date?: string
          reg_id: string
          reg_status: string
          student_number: string
        }
        Update: {
          attendance_marked_at?: string | null
          attendance_marked_by?: string | null
          attendance_status?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          event_id?: string
          reg_date?: string
          reg_id?: string
          reg_status?: string
          student_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_attendance_marked_by_fkey"
            columns: ["attendance_marked_by"]
            isOneToOne: false
            referencedRelation: "student_organization"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "registration_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "registration_student_number_fkey"
            columns: ["student_number"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_number"]
          },
        ]
      }
      student_organization: {
        Row: {
          accreditation_status: boolean | null
          acronym: string | null
          college: string | null
          org_id: string
          org_name: string
          org_type: string
        }
        Insert: {
          accreditation_status?: boolean | null
          acronym?: string | null
          college?: string | null
          org_id: string
          org_name: string
          org_type: string
        }
        Update: {
          accreditation_status?: boolean | null
          acronym?: string | null
          college?: string | null
          org_id?: string
          org_name?: string
          org_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_organization_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      students: {
        Row: {
          profile_image_path: string | null
          college: string
          name: string
          program: string
          student_number: string
          year_level: string
        }
        Insert: {
          profile_image_path?: string | null
          college: string
          name: string
          program: string
          student_number: string
          year_level: string
        }
        Update: {
          profile_image_path?: string | null
          college?: string
          name?: string
          program?: string
          student_number?: string
          year_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_student_number_fkey"
            columns: ["student_number"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          password: string | null
          plm_email: string
          role: string
          user_id: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          password?: string | null
          plm_email: string
          role: string
          user_id: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          password?: string | null
          plm_email?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      venue: {
        Row: {
          available_equipment: string | null
          building: string
          floor_number: string | null
          max_capacity: number
          room_number: string | null
          venue_id: string
          venue_name: string
        }
        Insert: {
          available_equipment?: string | null
          building: string
          floor_number?: string | null
          max_capacity: number
          room_number?: string | null
          venue_id: string
          venue_name: string
        }
        Update: {
          available_equipment?: string | null
          building?: string
          floor_number?: string | null
          max_capacity?: number
          room_number?: string | null
          venue_id?: string
          venue_name?: string
        }
        Relationships: []
      }
      venue_booking: {
        Row: {
          authorized_by: string
          booking_id: string
          booking_status: string
          buffer_minutes: number
          change_reason: string | null
          created_at: string
          ends_at: string
          event_id: string
          starts_at: string
          status_changed_at: string | null
          venue_id: string
        }
        Insert: {
          authorized_by: string
          booking_id: string
          booking_status: string
          buffer_minutes?: number
          change_reason?: string | null
          created_at?: string
          ends_at: string
          event_id: string
          starts_at: string
          status_changed_at?: string | null
          venue_id: string
        }
        Update: {
          authorized_by?: string
          booking_id?: string
          booking_status?: string
          buffer_minutes?: number
          change_reason?: string | null
          created_at?: string
          ends_at?: string
          event_id?: string
          starts_at?: string
          status_changed_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_booking_authorized_by_fkey"
            columns: ["authorized_by"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "venue_booking_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "venue_booking_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["venue_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_student_dashboard_events: {Args: never;Returns: Json[]}
      get_student_event_details: {Args:{eid:string};Returns:Json}
      get_student_registration_history: {Args:never;Returns:Json[]}
      get_student_discover_events: {Args:never;Returns:{event_id:string;event_name:string;event_type:string;organization_name:string;eligible_college:string;eligibility_mode:string;starts_at:string;ends_at:string;venue_name:string|null;registration_capacity:number;confirmed_registrations:number}[]}
      submit_proposal: {Args:{proposal:Json;schedule:Json};Returns:string}
      set_student_profile_image: {Args:{path:string|null};Returns:undefined}
      cancel_registration: {
        Args: { reason?: string; rid: string }
        Returns: undefined
      }
      get_my_role: { Args: never; Returns: string }
      mark_attendance: {
        Args: { rid: string; status: string }
        Returns: undefined
      }
      register_event: { Args: { eid: string }; Returns: string }
      review_proposal: {
        Args: { decision: string; pid: string; remarks?: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
