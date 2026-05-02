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
      ai_insights: {
        Row: {
          created_at: string
          daily_priority: Json
          generated_at: string
          goal_diagnoses: Json
          id: string
          patterns: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_priority?: Json
          generated_at?: string
          goal_diagnoses?: Json
          id?: string
          patterns?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_priority?: Json
          generated_at?: string
          goal_diagnoses?: Json
          id?: string
          patterns?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          status: Database["public"]["Enums"]["goal_status"]
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed: boolean
          created_at: string
          habit_id: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          habit_id: string
          id?: string
          log_date: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          break_penalty: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          tier: Database["public"]["Enums"]["habit_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          break_penalty?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          tier?: Database["public"]["Enums"]["habit_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          break_penalty?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          tier?: Database["public"]["Enums"]["habit_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content_md: string
          created_at: string
          entry_date: string
          id: string
          key_takeaways: string | null
          sentiment: Database["public"]["Enums"]["sentiment"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_md?: string
          created_at?: string
          entry_date: string
          id?: string
          key_takeaways?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_md?: string
          created_at?: string
          entry_date?: string
          id?: string
          key_takeaways?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      key_result_items: {
        Row: {
          created_at: string
          done: boolean
          id: string
          key_result_id: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          key_result_id: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          key_result_id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "key_result_items_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          created_at: string
          current_value: number | null
          goal_id: string
          id: string
          kind: Database["public"]["Enums"]["kr_kind"]
          sort_order: number
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          goal_id: string
          id?: string
          kind?: Database["public"]["Enums"]["kr_kind"]
          sort_order?: number
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          goal_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["kr_kind"]
          sort_order?: number
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          intro_seen: boolean
          tutorial_dismissed: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          intro_seen?: boolean
          tutorial_dismissed?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          intro_seen?: boolean
          tutorial_dismissed?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      user_owns_goal: { Args: { _goal_id: string }; Returns: boolean }
      user_owns_key_result: { Args: { _kr_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "moderator" | "super_admin"
      goal_status: "active" | "paused" | "achieved" | "archived"
      habit_tier: "keystone" | "core" | "supporting"
      kr_kind: "numeric" | "checklist"
      sentiment: "focused" | "steady" | "drifting" | "depleted" | "energized"
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
      app_role: ["user", "moderator", "super_admin"],
      goal_status: ["active", "paused", "achieved", "archived"],
      habit_tier: ["keystone", "core", "supporting"],
      kr_kind: ["numeric", "checklist"],
      sentiment: ["focused", "steady", "drifting", "depleted", "energized"],
    },
  },
} as const
