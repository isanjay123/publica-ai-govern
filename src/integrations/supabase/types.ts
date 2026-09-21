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
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          language: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          model: string | null
          role: string
          sources: Json
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          sources?: Json
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          sources?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          doc_type: string | null
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          doc_type?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          doc_type?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          action: string
          actor_label: string
          application_id: string
          comment: string | null
          created_at: string
          department_id: string | null
          id: string
          stage: string
        }
        Insert: {
          action: string
          actor_label?: string
          application_id: string
          comment?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          stage: string
        }
        Update: {
          action?: string
          actor_label?: string
          application_id?: string
          comment?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_status_history_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_confidence: number | null
          ai_recommendation: string | null
          applicant_name: string | null
          assigned_officer_id: string | null
          citizen_id: string | null
          completed_at: string | null
          created_at: string
          current_stage: string
          decision_reason: string | null
          delay_flag: Database["public"]["Enums"]["delay_flag"]
          department_id: string
          district: string | null
          expected_completion_at: string | null
          form_data: Json
          human_decision: string | null
          id: string
          is_demo: boolean
          officer_code: string | null
          reference_id: string
          service_id: string
          sla_deadline: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_recommendation?: string | null
          applicant_name?: string | null
          assigned_officer_id?: string | null
          citizen_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_stage?: string
          decision_reason?: string | null
          delay_flag?: Database["public"]["Enums"]["delay_flag"]
          department_id: string
          district?: string | null
          expected_completion_at?: string | null
          form_data?: Json
          human_decision?: string | null
          id?: string
          is_demo?: boolean
          officer_code?: string | null
          reference_id: string
          service_id: string
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_recommendation?: string | null
          applicant_name?: string | null
          assigned_officer_id?: string | null
          citizen_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_stage?: string
          decision_reason?: string | null
          delay_flag?: Database["public"]["Enums"]["delay_flag"]
          department_id?: string
          district?: string | null
          expected_completion_at?: string | null
          form_data?: Json
          human_decision?: string | null
          id?: string
          is_demo?: boolean
          officer_code?: string | null
          reference_id?: string
          service_id?: string
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          application_id: string | null
          audit_id: string
          current_hash: string | null
          department_id: string | null
          id: number
          occurred_at: string
          payload: Json
          previous_hash: string | null
          reason: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          application_id?: string | null
          audit_id?: string
          current_hash?: string | null
          department_id?: string | null
          id?: number
          occurred_at?: string
          payload?: Json
          previous_hash?: string | null
          reason?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          application_id?: string | null
          audit_id?: string
          current_hash?: string | null
          department_id?: string | null
          id?: number
          occurred_at?: string
          payload?: Json
          previous_hash?: string | null
          reason?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_verification_results: {
        Row: {
          application_id: string
          checks: Json
          confidence: number | null
          created_at: string
          detected_type: string | null
          document_id: string
          explanation: string | null
          extracted_fields: Json
          human_review_status: string
          id: string
          model: string | null
          prompt_version: string | null
          result: string
          reviewed_by: string | null
        }
        Insert: {
          application_id: string
          checks?: Json
          confidence?: number | null
          created_at?: string
          detected_type?: string | null
          document_id: string
          explanation?: string | null
          extracted_fields?: Json
          human_review_status?: string
          id?: string
          model?: string | null
          prompt_version?: string | null
          result?: string
          reviewed_by?: string | null
        }
        Update: {
          application_id?: string
          checks?: Json
          confidence?: number | null
          created_at?: string
          detected_type?: string | null
          document_id?: string
          explanation?: string | null
          extracted_fields?: Json
          human_review_status?: string
          id?: string
          model?: string | null
          prompt_version?: string | null
          result?: string
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_verification_results_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_verification_results_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "application_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      government_rules: {
        Row: {
          citation: string | null
          created_at: string
          department_id: string | null
          id: string
          rule_text: string
          service_code: string | null
          title: string
        }
        Insert: {
          citation?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          rule_text: string
          service_code?: string | null
          title: string
        }
        Update: {
          citation?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          rule_text?: string
          service_code?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "government_rules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      grievances: {
        Row: {
          application_id: string | null
          assigned_to: string | null
          category: string
          citizen_id: string | null
          created_at: string
          department_id: string | null
          description: string
          id: string
          is_demo: boolean
          reference_id: string
          response: string | null
          status: Database["public"]["Enums"]["grievance_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          assigned_to?: string | null
          category: string
          citizen_id?: string | null
          created_at?: string
          department_id?: string | null
          description: string
          id?: string
          is_demo?: boolean
          reference_id: string
          response?: string | null
          status?: Database["public"]["Enums"]["grievance_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          assigned_to?: string | null
          category?: string
          citizen_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          is_demo?: boolean
          reference_id?: string
          response?: string | null
          status?: Database["public"]["Enums"]["grievance_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grievances_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grievances_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      integrity_reports: {
        Row: {
          access_code_hash: string
          application_reference: string | null
          category: string
          contact_info: string | null
          created_at: string
          department_id: string | null
          description: string
          id: string
          incident_at: string | null
          is_demo: boolean
          oversight_notes: string | null
          reference_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          access_code_hash: string
          application_reference?: string | null
          category: string
          contact_info?: string | null
          created_at?: string
          department_id?: string | null
          description: string
          id?: string
          incident_at?: string | null
          is_demo?: boolean
          oversight_notes?: string | null
          reference_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          access_code_hash?: string
          application_reference?: string | null
          category?: string
          contact_info?: string | null
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          incident_at?: string | null
          is_demo?: boolean
          oversight_notes?: string | null
          reference_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrity_reports_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          source: string
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          source?: string
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          source?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          district: string | null
          email: string | null
          full_name: string
          id: string
          identity_verified: boolean
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          district?: string | null
          email?: string | null
          full_name?: string
          id: string
          identity_verified?: boolean
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          district?: string | null
          email?: string | null
          full_name?: string
          id?: string
          identity_verified?: boolean
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          code: string
          created_at: string
          department_id: string
          description: string
          eligibility: string
          fee_amount: number
          id: string
          is_active: boolean
          name: string
          required_documents: string[]
          sla_days: number
          stages: string[]
        }
        Insert: {
          code: string
          created_at?: string
          department_id: string
          description?: string
          eligibility?: string
          fee_amount?: number
          id?: string
          is_active?: boolean
          name: string
          required_documents?: string[]
          sla_days?: number
          stages?: string[]
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string
          description?: string
          eligibility?: string
          fee_amount?: number
          id?: string
          is_active?: boolean
          name?: string
          required_documents?: string[]
          sla_days?: number
          stages?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "services_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_configurations: {
        Row: {
          created_at: string
          id: string
          max_days: number
          service_id: string
          stage: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_days: number
          service_id: string
          stage: string
        }
        Update: {
          created_at?: string
          id?: string
          max_days?: number
          service_id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_configurations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "citizen"
        | "officer"
        | "dept_admin"
        | "oversight"
        | "super_admin"
      application_status:
        | "submitted"
        | "document_verification"
        | "officer_review"
        | "department_approval"
        | "certificate_generation"
        | "completed"
        | "rejected"
        | "additional_documents_required"
      delay_flag:
        | "normal"
        | "approaching_sla"
        | "delayed"
        | "highly_delayed"
        | "anomalous"
      grievance_status:
        | "submitted"
        | "acknowledged"
        | "assigned"
        | "under_review"
        | "response_prepared"
        | "resolved"
      report_status:
        | "received"
        | "under_assessment"
        | "investigating"
        | "action_taken"
        | "closed"
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
    Enums: {
      app_role: [
        "citizen",
        "officer",
        "dept_admin",
        "oversight",
        "super_admin",
      ],
      application_status: [
        "submitted",
        "document_verification",
        "officer_review",
        "department_approval",
        "certificate_generation",
        "completed",
        "rejected",
        "additional_documents_required",
      ],
      delay_flag: [
        "normal",
        "approaching_sla",
        "delayed",
        "highly_delayed",
        "anomalous",
      ],
      grievance_status: [
        "submitted",
        "acknowledged",
        "assigned",
        "under_review",
        "response_prepared",
        "resolved",
      ],
      report_status: [
        "received",
        "under_assessment",
        "investigating",
        "action_taken",
        "closed",
      ],
    },
  },
} as const
