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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          agency_name: string
          approved_by: string | null
          commission_rate: number
          created_at: string
          description: string | null
          id: string
          owner_id: string
          status: string
          total_earnings: number
          updated_at: string
        }
        Insert: {
          agency_name: string
          approved_by?: string | null
          commission_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          owner_id: string
          status?: string
          total_earnings?: number
          updated_at?: string
        }
        Update: {
          agency_name?: string
          approved_by?: string | null
          commission_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          status?: string
          total_earnings?: number
          updated_at?: string
        }
        Relationships: []
      }
      bans: {
        Row: {
          ban_type: string
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string
          user_id: string
        }
        Insert: {
          ban_type?: string
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason: string
          user_id: string
        }
        Update: {
          ban_type?: string
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          event_type: string
          id: string
          rewards: Json | null
          start_date: string
          status: string
          title: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          event_type?: string
          id?: string
          rewards?: Json | null
          start_date: string
          status?: string
          title: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          event_type?: string
          id?: string
          rewards?: Json | null
          start_date?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      gift_transactions: {
        Row: {
          coins_spent: number
          created_at: string
          gift_id: string
          id: string
          quantity: number
          receiver_id: string
          room_id: string | null
          sender_id: string
        }
        Insert: {
          coins_spent: number
          created_at?: string
          gift_id: string
          id?: string
          quantity?: number
          receiver_id: string
          room_id?: string | null
          sender_id: string
        }
        Update: {
          coins_spent?: number
          created_at?: string
          gift_id?: string
          id?: string
          quantity?: number
          receiver_id?: string
          room_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "voice_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          animation_url: string | null
          category: string
          coin_value: number
          created_at: string
          gift_name: string
          icon_url: string | null
          id: string
          is_active: boolean
        }
        Insert: {
          animation_url?: string | null
          category?: string
          coin_value: number
          created_at?: string
          gift_name: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
        }
        Update: {
          animation_url?: string | null
          category?: string
          coin_value?: number
          created_at?: string
          gift_name?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      hosts: {
        Row: {
          agency_id: string | null
          created_at: string
          id: string
          level: number
          monthly_earnings: number
          status: string
          total_earnings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          id?: string
          level?: number
          monthly_earnings?: number
          status?: string
          total_earnings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          id?: string
          level?: number
          monthly_earnings?: number
          status?: string
          total_earnings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coins_balance: number
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_online: boolean
          last_seen: string | null
          level: number
          phone: string | null
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coins_balance?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_online?: boolean
          last_seen?: string | null
          level?: number
          phone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coins_balance?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_online?: boolean
          last_seen?: string | null
          level?: number
          phone?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      recharge_requests: {
        Row: {
          amount: number
          coins_amount: number
          created_at: string
          id: string
          payment_method: string
          payment_reference: string | null
          processed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          coins_amount: number
          created_at?: string
          id?: string
          payment_method: string
          payment_reference?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          coins_amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          payment_reference?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          reported_room_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolution_note: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          reported_room_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          reported_room_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_room_id_fkey"
            columns: ["reported_room_id"]
            isOneToOne: false
            referencedRelation: "voice_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          room_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          room_id: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          room_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "voice_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          hand_raised: boolean
          id: string
          is_speaker: boolean
          joined_at: string
          left_at: string | null
          mic_status: string
          room_id: string
          seat_index: number | null
          user_id: string
        }
        Insert: {
          hand_raised?: boolean
          id?: string
          is_speaker?: boolean
          joined_at?: string
          left_at?: string | null
          mic_status?: string
          room_id: string
          seat_index?: number | null
          user_id: string
        }
        Update: {
          hand_raised?: boolean
          id?: string
          is_speaker?: boolean
          joined_at?: string
          left_at?: string | null
          mic_status?: string
          room_id?: string
          seat_index?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "voice_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_rooms: {
        Row: {
          category: string
          cover_image: string | null
          created_at: string
          description: string | null
          host_id: string
          id: string
          is_live: boolean
          listener_count: number
          max_seats: number
          password_hash: string | null
          privacy_type: string
          room_name: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          host_id: string
          id?: string
          is_live?: boolean
          listener_count?: number
          max_seats?: number
          password_hash?: string | null
          privacy_type?: string
          room_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          host_id?: string
          id?: string
          is_live?: boolean
          listener_count?: number
          max_seats?: number
          password_hash?: string | null
          privacy_type?: string
          room_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_details: Json | null
          payment_method: string
          processed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method: string
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_gift: {
        Args: {
          p_gift_id: string
          p_quantity?: number
          p_receiver_id: string
          p_room_id: string
          p_sender_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "user"
        | "host"
        | "admin"
        | "super_admin"
        | "owner"
        | "manager"
        | "business_dev"
        | "agency_owner"
        | "coins_seller"
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
      app_role: [
        "user",
        "host",
        "admin",
        "super_admin",
        "owner",
        "manager",
        "business_dev",
        "agency_owner",
        "coins_seller",
      ],
    },
  },
} as const
