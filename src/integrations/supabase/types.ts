export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          bike_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          bike_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          bike_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "bikes"
            referencedColumns: ["id"]
          },
        ]
      }
      bikes: {
        Row: {
          archived: boolean | null
          created_at: string | null
          id: string
          image: string | null
          last_maintenance_date: string | null
          name: string
          next_check_date: string | null
          next_check_notes: string | null
          strava_id: string | null
          total_distance: number | null
          type: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          id?: string
          image?: string | null
          last_maintenance_date?: string | null
          name: string
          next_check_date?: string | null
          next_check_notes?: string | null
          strava_id?: string | null
          total_distance?: number | null
          type: string
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          id?: string
          image?: string | null
          last_maintenance_date?: string | null
          name?: string
          next_check_date?: string | null
          next_check_notes?: string | null
          strava_id?: string | null
          total_distance?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      maintenance: {
        Row: {
          bike_id: string
          cost: number
          created_at: string | null
          date: string
          distance_at_maintenance: number | null
          has_receipt: boolean | null
          id: string
          labor_cost: number | null
          materials_cost: number | null
          notes: string | null
          receipt_image: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bike_id: string
          cost: number
          created_at?: string | null
          date: string
          distance_at_maintenance?: number | null
          has_receipt?: boolean | null
          id?: string
          labor_cost?: number | null
          materials_cost?: number | null
          notes?: string | null
          receipt_image?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bike_id?: string
          cost?: number
          created_at?: string | null
          date?: string
          distance_at_maintenance?: number | null
          has_receipt?: boolean | null
          id?: string
          labor_cost?: number | null
          materials_cost?: number | null
          notes?: string | null
          receipt_image?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "bikes"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_types: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          fcm_token: string | null
          full_name: string | null
          id: string
          strava_access_token: string | null
          strava_connected: boolean | null
          strava_refresh_token: string | null
          strava_token_expires_at: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          fcm_token?: string | null
          full_name?: string | null
          id: string
          strava_access_token?: string | null
          strava_connected?: boolean | null
          strava_refresh_token?: string | null
          strava_token_expires_at?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          fcm_token?: string | null
          full_name?: string | null
          id?: string
          strava_access_token?: string | null
          strava_connected?: boolean | null
          strava_refresh_token?: string | null
          strava_token_expires_at?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          is_premium: boolean
          last_verified_at: string | null
          premium_until: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_premium?: boolean
          last_verified_at?: string | null
          premium_until?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_premium?: boolean
          last_verified_at?: string | null
          premium_until?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_user_premium: {
        Args: { user_uuid: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
