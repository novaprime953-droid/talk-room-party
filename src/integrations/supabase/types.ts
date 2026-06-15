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
      badges: {
        Row: {
          auto_assign: boolean
          created_at: string
          image_path: string
          is_active: boolean
          key: string
          name: string
          role: Database["public"]["Enums"]["app_role"] | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          auto_assign?: boolean
          created_at?: string
          image_path: string
          is_active?: boolean
          key: string
          name: string
          role?: Database["public"]["Enums"]["app_role"] | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          auto_assign?: boolean
          created_at?: string
          image_path?: string
          is_active?: boolean
          key?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          redirect_id: string | null
          redirect_type: string
          sort_order: number
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          redirect_id?: string | null
          redirect_type?: string
          sort_order?: number
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          redirect_id?: string | null
          redirect_type?: string
          sort_order?: number
          start_date?: string | null
          title?: string
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
      competition_entries: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          rank: number | null
          reward_amount: number | null
          reward_claimed: boolean
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          rank?: number | null
          reward_amount?: number | null
          reward_claimed?: boolean
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          rank?: number | null
          reward_amount?: number | null
          reward_claimed?: boolean
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_entries_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          banner_url: string | null
          competition_type: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          metric: string
          min_participants: number | null
          rewards: Json | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          competition_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          metric?: string
          min_participants?: number | null
          rewards?: Json | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          competition_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          metric?: string
          min_participants?: number | null
          rewards?: Json | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_logins: {
        Row: {
          created_at: string
          id: string
          login_date: string
          user_id: string
          xp_granted: number
        }
        Insert: {
          created_at?: string
          id?: string
          login_date?: string
          user_id: string
          xp_granted?: number
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          user_id?: string
          xp_granted?: number
        }
        Relationships: []
      }
      event_leaderboard: {
        Row: {
          created_at: string
          event_id: string
          id: string
          rank: number | null
          reward_claimed: boolean
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          rank?: number | null
          reward_claimed?: boolean
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          rank?: number | null
          reward_claimed?: boolean
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_leaderboard_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      families: {
        Row: {
          badge_url: string | null
          created_at: string
          description: string | null
          id: string
          level: number
          max_members: number
          name: string
          owner_id: string
          updated_at: string
          xp: number
        }
        Insert: {
          badge_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          max_members?: number
          name: string
          owner_id: string
          updated_at?: string
          xp?: number
        }
        Update: {
          badge_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          max_members?: number
          name?: string
          owner_id?: string
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      family_members: {
        Row: {
          family_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          family_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          family_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
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
      game_transactions: {
        Row: {
          coins_used: number
          coins_won: number
          created_at: string
          game_name: string
          id: string
          result: string
          user_id: string
        }
        Insert: {
          coins_used?: number
          coins_won?: number
          created_at?: string
          game_name: string
          id?: string
          result?: string
          user_id: string
        }
        Update: {
          coins_used?: number
          coins_won?: number
          created_at?: string
          game_name?: string
          id?: string
          result?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_game_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_view"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "hosts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      id_change_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_id: number
          old_id: number
          user_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_id: number
          old_id: number
          user_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_id?: number
          old_id?: number
          user_id?: string
        }
        Relationships: []
      }
      level_rewards: {
        Row: {
          coins_reward: number
          created_at: string
          description: string | null
          id: string
          level: number
          prop_id: string | null
        }
        Insert: {
          coins_reward?: number
          created_at?: string
          description?: string | null
          id?: string
          level: number
          prop_id?: string | null
        }
        Update: {
          coins_reward?: number
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          prop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "level_rewards_prop_id_fkey"
            columns: ["prop_id"]
            isOneToOne: false
            referencedRelation: "props"
            referencedColumns: ["id"]
          },
        ]
      }
      medals: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          unlock_condition: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          unlock_condition?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          unlock_condition?: Json
        }
        Relationships: []
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
      policies: {
        Row: {
          category: Database["public"]["Enums"]["policy_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["policy_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["policy_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          post_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          post_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string
          reporter_id: string
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean
          is_promoted: boolean
          likes_count: number
          shares_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_promoted?: boolean
          likes_count?: number
          shares_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_promoted?: boolean
          likes_count?: number
          shares_count?: number
          status?: string
          updated_at?: string
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
          equipped_badge_key: string | null
          equipped_frame_user_prop_id: string | null
          equipped_title_id: string | null
          id: string
          is_online: boolean
          last_seen: string | null
          level: number
          phone: string | null
          updated_at: string
          user_id: string
          user_id_number: number | null
          username: string | null
          vip_end: string | null
          vip_level: number
          vip_start: string | null
          vip_xp: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coins_balance?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          equipped_badge_key?: string | null
          equipped_frame_user_prop_id?: string | null
          equipped_title_id?: string | null
          id?: string
          is_online?: boolean
          last_seen?: string | null
          level?: number
          phone?: string | null
          updated_at?: string
          user_id: string
          user_id_number?: number | null
          username?: string | null
          vip_end?: string | null
          vip_level?: number
          vip_start?: string | null
          vip_xp?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coins_balance?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          equipped_badge_key?: string | null
          equipped_frame_user_prop_id?: string | null
          equipped_title_id?: string | null
          id?: string
          is_online?: boolean
          last_seen?: string | null
          level?: number
          phone?: string | null
          updated_at?: string
          user_id?: string
          user_id_number?: number | null
          username?: string | null
          vip_end?: string | null
          vip_level?: number
          vip_start?: string | null
          vip_xp?: number
          xp?: number
        }
        Relationships: []
      }
      props: {
        Row: {
          animation_url: string | null
          category: string
          created_at: string
          duration_days: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          animation_url?: string | null
          category?: string
          created_at?: string
          duration_days?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          animation_url?: string | null
          category?: string
          created_at?: string
          duration_days?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
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
          {
            foreignKeyName: "room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_view"
            referencedColumns: ["user_id"]
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
          {
            foreignKeyName: "room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seat_events: {
        Row: {
          action: string
          created_at: string
          failure_reason: string | null
          id: string
          metadata: Json
          room_id: string
          seat_index: number | null
          success: boolean
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json
          room_id: string
          seat_index?: number | null
          success?: boolean
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json
          room_id?: string
          seat_index?: number | null
          success?: boolean
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seat_takeover_requests: {
        Row: {
          created_at: string
          current_owner_id: string
          expires_at: string
          id: string
          requester_id: string
          room_id: string
          seat_index: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_owner_id: string
          expires_at?: string
          id?: string
          requester_id: string
          room_id: string
          seat_index: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_owner_id?: string
          expires_at?: string
          id?: string
          requester_id?: string
          room_id?: string
          seat_index?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_recharge_requests: {
        Row: {
          coins_amount: number
          created_at: string
          id: string
          note: string | null
          processed_by: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          coins_amount: number
          created_at?: string
          id?: string
          note?: string | null
          processed_by?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          coins_amount?: number
          created_at?: string
          id?: string
          note?: string | null
          processed_by?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      titles: {
        Row: {
          auto_assign: boolean
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["app_role"] | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          auto_assign?: boolean
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          role?: Database["public"]["Enums"]["app_role"] | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          auto_assign?: boolean
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_key: string
          granted_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_key_fkey"
            columns: ["badge_key"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["key"]
          },
        ]
      }
      user_medals: {
        Row: {
          id: string
          medal_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          medal_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          medal_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_medals_medal_id_fkey"
            columns: ["medal_id"]
            isOneToOne: false
            referencedRelation: "medals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_props: {
        Row: {
          expires_at: string | null
          gifted_by: string | null
          id: string
          is_equipped: boolean
          prop_id: string
          purchased_at: string
          status: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          gifted_by?: string | null
          id?: string
          is_equipped?: boolean
          prop_id: string
          purchased_at?: string
          status?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          gifted_by?: string | null
          id?: string
          is_equipped?: boolean
          prop_id?: string
          purchased_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_props_prop_id_fkey"
            columns: ["prop_id"]
            isOneToOne: false
            referencedRelation: "props"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_titles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          title_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          title_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          title_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_titles_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_room_passwords: {
        Row: {
          created_at: string
          password_hash: string
          room_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          password_hash: string
          room_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          password_hash?: string
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_room_passwords_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "voice_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_rooms: {
        Row: {
          background_url: string | null
          category: string
          country: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          host_id: string
          id: string
          is_live: boolean
          listener_count: number
          max_seats: number
          privacy_type: string
          room_name: string
          status: string
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          category?: string
          country?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          host_id: string
          id?: string
          is_live?: boolean
          listener_count?: number
          max_seats?: number
          privacy_type?: string
          room_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          category?: string
          country?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          host_id?: string
          id?: string
          is_live?: boolean
          listener_count?: number
          max_seats?: number
          privacy_type?: string
          room_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "voice_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_view"
            referencedColumns: ["user_id"]
          },
        ]
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
      agencies_public: {
        Row: {
          agency_name: string | null
          created_at: string | null
          description: string | null
          id: string | null
          status: string | null
        }
        Insert: {
          agency_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          status?: string | null
        }
        Update: {
          agency_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      hosts_public: {
        Row: {
          agency_id: string | null
          created_at: string | null
          id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hosts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      public_profiles_view: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          is_online: boolean | null
          last_seen: string | null
          level: number | null
          updated_at: string | null
          user_id: string | null
          user_id_number: number | null
          username: string | null
          vip_level: number | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_online?: boolean | null
          last_seen?: string | null
          level?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_id_number?: number | null
          username?: string | null
          vip_level?: number | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_online?: boolean | null
          last_seen?: string | null
          level?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_id_number?: number | null
          username?: string | null
          vip_level?: number | null
          xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_recharge: { Args: { p_request_id: string }; Returns: Json }
      claim_daily_login: { Args: { p_user_id: string }; Returns: Json }
      claim_seat: {
        Args: { p_room_id: string; p_seat_index: number }
        Returns: Json
      }
      equip_badge: { Args: { p_badge_key: string }; Returns: Json }
      equip_frame_prop: { Args: { p_user_prop_id: string }; Returns: Json }
      equip_title: { Args: { p_title_id: string }; Returns: Json }
      grant_newbie_props: { Args: { p_user_id: string }; Returns: undefined }
      grant_xp: {
        Args: { p_amount: number; p_source?: string; p_user_id: string }
        Returns: Json
      }
      has_any_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      leave_seat: { Args: { p_room_id: string }; Returns: Json }
      owner_grant_badge: {
        Args: { p_badge_key: string; p_user_id: string }
        Returns: Json
      }
      owner_grant_title: {
        Args: { p_title_id: string; p_user_id: string }
        Returns: Json
      }
      owner_revoke_badge: {
        Args: { p_badge_key: string; p_user_id: string }
        Returns: Json
      }
      owner_revoke_title: {
        Args: { p_title_id: string; p_user_id: string }
        Returns: Json
      }
      owner_send_coins: {
        Args: {
          p_amount: number
          p_description?: string
          p_owner_id: string
          p_target_id: string
        }
        Returns: Json
      }
      purchase_prop: {
        Args: { p_prop_id: string; p_user_id: string }
        Returns: Json
      }
      purchase_vip: {
        Args: { p_cost: number; p_user_id: string; p_vip_level: number }
        Returns: Json
      }
      reject_recharge: { Args: { p_request_id: string }; Returns: Json }
      request_seat_takeover: {
        Args: { p_room_id: string; p_seat_index: number }
        Returns: Json
      }
      respond_seat_takeover: {
        Args: { p_accept: boolean; p_request_id: string }
        Returns: Json
      }
      seller_send_coins: {
        Args: {
          p_amount: number
          p_description?: string
          p_seller_id: string
          p_target_id: string
        }
        Returns: Json
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
      set_room_password: {
        Args: { p_password_hash: string; p_room_id: string }
        Returns: Json
      }
      start_game: {
        Args: {
          p_coins_required: number
          p_game_name: string
          p_user_id: string
        }
        Returns: Json
      }
      sync_role_badges: { Args: { p_user_id: string }; Returns: undefined }
      verify_room_password: {
        Args: { p_password_hash: string; p_room_id: string }
        Returns: boolean
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
      policy_category:
        | "agency"
        | "host"
        | "admin"
        | "bd"
        | "super_admin"
        | "salary"
        | "commission"
        | "withdrawal"
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
      policy_category: [
        "agency",
        "host",
        "admin",
        "bd",
        "super_admin",
        "salary",
        "commission",
        "withdrawal",
      ],
    },
  },
} as const
