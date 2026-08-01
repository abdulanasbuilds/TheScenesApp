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
      access_records: {
        Row: {
          accessed_at: number
          community_id: number | null
          id: number
          resource_id: number | null
          resource_title: string | null
          resource_type: string | null
          user_email: string | null
        }
        Insert: {
          accessed_at: number
          community_id?: number | null
          id: number
          resource_id?: number | null
          resource_title?: string | null
          resource_type?: string | null
          user_email?: string | null
        }
        Update: {
          accessed_at?: number
          community_id?: number | null
          id?: number
          resource_id?: number | null
          resource_title?: string | null
          resource_type?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author: string | null
          author_email: string | null
          avatar: string | null
          body: string
          created_at: number
          id: number
          post_id: number | null
        }
        Insert: {
          author?: string | null
          author_email?: string | null
          avatar?: string | null
          body: string
          created_at: number
          id: number
          post_id?: number | null
        }
        Update: {
          author?: string | null
          author_email?: string | null
          avatar?: string | null
          body?: string
          created_at?: number
          id?: number
          post_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar: string | null
          banner: string | null
          category: string | null
          color: string | null
          cover_image_url: string | null
          created_at: number
          creator: string | null
          creator_email: string
          discovery_keywords: string[]
          icon_url: string | null
          id: number
          is_private: boolean
          members: number
          pinned_post_id: number | null
          price: string | null
          price_model: string
          required_action: string | null
          screening_questions: string[]
          summary: string | null
          tag: string
          title: string
          welcome_message: string | null
        }
        Insert: {
          avatar?: string | null
          banner?: string | null
          category?: string | null
          color?: string | null
          cover_image_url?: string | null
          created_at: number
          creator?: string | null
          creator_email: string
          discovery_keywords?: string[]
          icon_url?: string | null
          id: number
          is_private?: boolean
          members?: number
          pinned_post_id?: number | null
          price?: string | null
          price_model?: string
          required_action?: string | null
          screening_questions?: string[]
          summary?: string | null
          tag?: string
          title: string
          welcome_message?: string | null
        }
        Update: {
          avatar?: string | null
          banner?: string | null
          category?: string | null
          color?: string | null
          cover_image_url?: string | null
          created_at?: number
          creator?: string | null
          creator_email?: string
          discovery_keywords?: string[]
          icon_url?: string | null
          id?: number
          is_private?: boolean
          members?: number
          pinned_post_id?: number | null
          price?: string | null
          price_model?: string
          required_action?: string | null
          screening_questions?: string[]
          summary?: string | null
          tag?: string
          title?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      community_access: {
        Row: {
          access_type: string
          community_id: number
          expires_at: string | null
          granted_at: string
          id: string
          transaction_id: string | null
          user_email: string
        }
        Insert: {
          access_type?: string
          community_id: number
          expires_at?: string | null
          granted_at?: string
          id: string
          transaction_id?: string | null
          user_email: string
        }
        Update: {
          access_type?: string
          community_id?: number
          expires_at?: string | null
          granted_at?: string
          id?: string
          transaction_id?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_access_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_access_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_announcements: {
        Row: {
          body: string
          community_id: number
          creator_email: string
          id: number
          sent_at: string
          title: string
        }
        Insert: {
          body: string
          community_id: number
          creator_email: string
          id: number
          sent_at?: string
          title: string
        }
        Update: {
          body?: string
          community_id?: number
          creator_email?: string
          id?: number
          sent_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_announcements_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          community_id: number | null
          created_at: number
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          host_platform: string
          id: number
          location: string | null
          meeting_url: string | null
          recurrence: string
          remind_1d: boolean
          title: string
          type: string
          visibility: string
        }
        Insert: {
          community_id?: number | null
          created_at: number
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          host_platform?: string
          id: number
          location?: string | null
          meeting_url?: string | null
          recurrence?: string
          remind_1d?: boolean
          title: string
          type?: string
          visibility?: string
        }
        Update: {
          community_id?: number | null
          created_at?: number
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          host_platform?: string
          id?: number
          location?: string | null
          meeting_url?: string | null
          recurrence?: string
          remind_1d?: boolean
          title?: string
          type?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_levels: {
        Row: {
          community_id: number
          id: number
          level_number: number
          name: string
          points_required: number
          reward: string | null
          unlock_course_id: number | null
        }
        Insert: {
          community_id: number
          id: number
          level_number: number
          name: string
          points_required?: number
          reward?: string | null
          unlock_course_id?: number | null
        }
        Update: {
          community_id?: number
          id?: number
          level_number?: number
          name?: string
          points_required?: number
          reward?: string | null
          unlock_course_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_levels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_resources: {
        Row: {
          added_at: number
          community_id: number | null
          id: number
          source: string | null
          title: string
          url: string
        }
        Insert: {
          added_at: number
          community_id?: number | null
          id: number
          source?: string | null
          title: string
          url: string
        }
        Update: {
          added_at?: number
          community_id?: number | null
          id?: number
          source?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_resources_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      course_access: {
        Row: {
          access_type: string
          course_id: number
          expires_at: string | null
          granted_at: string
          id: string
          transaction_id: string | null
          user_email: string
        }
        Insert: {
          access_type?: string
          course_id: number
          expires_at?: string | null
          granted_at?: string
          id: string
          transaction_id?: string | null
          user_email: string
        }
        Update: {
          access_type?: string
          course_id?: number
          expires_at?: string | null
          granted_at?: string
          id?: string
          transaction_id?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_access_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          community_id: number | null
          cover_image_url: string | null
          created_at: number
          creator_email: string
          description: string | null
          enrollment_count: number
          id: number
          price: string | null
          published: boolean
          published_at: string | null
          thumbnail: string | null
          title: string
        }
        Insert: {
          community_id?: number | null
          cover_image_url?: string | null
          created_at: number
          creator_email: string
          description?: string | null
          enrollment_count?: number
          id: number
          price?: string | null
          published?: boolean
          published_at?: string | null
          thumbnail?: string | null
          title: string
        }
        Update: {
          community_id?: number | null
          cover_image_url?: string | null
          created_at?: number
          creator_email?: string
          description?: string | null
          enrollment_count?: number
          id?: number
          price?: string | null
          published?: boolean
          published_at?: string | null
          thumbnail?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_subscriptions: {
        Row: {
          creator_email: string
          current_period_end: string | null
          current_period_start: string
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          plan_id: string
          status: string
          updated_at: string
        }
        Insert: {
          creator_email: string
          current_period_end?: string | null
          current_period_start?: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          creator_email?: string
          current_period_end?: string | null
          current_period_start?: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          body: string
          created_at: number
          from_email: string
          id: number
          read: boolean
          to_email: string
        }
        Insert: {
          body: string
          created_at: number
          from_email: string
          id: number
          read?: boolean
          to_email: string
        }
        Update: {
          body?: string
          created_at?: number
          from_email?: string
          id?: number
          read?: boolean
          to_email?: string
        }
        Relationships: []
      }
      earnings_ledger: {
        Row: {
          amount_cents: number
          balance_after_cents: number
          created_at: string
          creator_email: string
          currency: string
          description: string | null
          entry_type: string
          id: string
          transaction_id: string | null
        }
        Insert: {
          amount_cents: number
          balance_after_cents?: number
          created_at?: string
          creator_email: string
          currency?: string
          description?: string | null
          entry_type: string
          id: string
          transaction_id?: string | null
        }
        Update: {
          amount_cents?: number
          balance_after_cents?: number
          created_at?: string
          creator_email?: string
          currency?: string
          description?: string | null
          entry_type?: string
          id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "earnings_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_lesson_ids: number[]
          course_id: number
          enrolled_at: number
          user_email: string
        }
        Insert: {
          completed_lesson_ids?: number[]
          course_id: number
          enrolled_at: number
          user_email: string
        }
        Update: {
          completed_lesson_ids?: number[]
          course_id?: number
          enrolled_at?: number
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      joined_communities: {
        Row: {
          community_id: number
          joined_at: string
          user_email: string
        }
        Insert: {
          community_id: number
          joined_at?: string
          user_email: string
        }
        Update: {
          community_id?: number
          joined_at?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "joined_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          added_at: number
          id: number
          lesson_id: number | null
          source: string | null
          title: string
          url: string
        }
        Insert: {
          added_at: number
          id: number
          lesson_id?: number | null
          source?: string | null
          title: string
          url: string
        }
        Update: {
          added_at?: number
          id?: number
          lesson_id?: number | null
          source?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          body: string | null
          course_id: number | null
          description: string | null
          drip_days: number
          id: number
          module_id: number | null
          published: boolean
          sort_order: number
          title: string
          video_url: string | null
        }
        Insert: {
          body?: string | null
          course_id?: number | null
          description?: string | null
          drip_days?: number
          id: number
          module_id?: number | null
          published?: boolean
          sort_order?: number
          title: string
          video_url?: string | null
        }
        Update: {
          body?: string | null
          course_id?: number | null
          description?: string | null
          drip_days?: number
          id?: number
          module_id?: number | null
          published?: boolean
          sort_order?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      liked_posts: {
        Row: {
          post_id: number
          user_email: string
        }
        Insert: {
          post_id: number
          user_email: string
        }
        Update: {
          post_id?: number
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      member_points: {
        Row: {
          community_id: number
          points: number
          updated_at: string
          user_email: string
        }
        Insert: {
          community_id: number
          points?: number
          updated_at?: string
          user_email: string
        }
        Update: {
          community_id?: number
          points?: number
          updated_at?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_points_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: number | null
          id: number
          sort_order: number
          title: string
        }
        Insert: {
          course_id?: number | null
          id: number
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: number | null
          id?: number
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          enabled: boolean
          notif_type: string
          user_email: string
        }
        Insert: {
          enabled?: boolean
          notif_type: string
          user_email: string
        }
        Update: {
          enabled?: boolean
          notif_type?: string
          user_email?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_name: string | null
          created_at: number
          dedup_key: string | null
          id: number
          link: string | null
          notif_type: string
          read: boolean
          text: string
          time: string | null
          user_email: string
        }
        Insert: {
          actor_name?: string | null
          created_at: number
          dedup_key?: string | null
          id: number
          link?: string | null
          notif_type?: string
          read?: boolean
          text: string
          time?: string | null
          user_email: string
        }
        Update: {
          actor_name?: string | null
          created_at?: number
          dedup_key?: string | null
          id?: number
          link?: string | null
          notif_type?: string
          read?: boolean
          text?: string
          time?: string | null
          user_email?: string
        }
        Relationships: []
      }
      onboarding_states: {
        Row: {
          completed: boolean
          completed_at: string | null
          goals: string[]
          interests: string[]
          role: string | null
          skill_level: string | null
          step: number
          updated_at: string
          user_email: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          goals?: string[]
          interests?: string[]
          role?: string | null
          skill_level?: string | null
          step?: number
          updated_at?: string
          user_email: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          goals?: string[]
          interests?: string[]
          role?: string | null
          skill_level?: string | null
          step?: number
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          created_at: string
          currency: string
          from_email: string
          gross_amount_cents: number
          id: string
          metadata: Json
          net_amount_cents: number
          payment_type: string
          paystack_reference: string
          platform_fee_cents: number
          provider: string
          resource_id: number | null
          resource_type: string | null
          status: string
          to_email: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          from_email: string
          gross_amount_cents: number
          id: string
          metadata?: Json
          net_amount_cents: number
          payment_type: string
          paystack_reference: string
          platform_fee_cents?: number
          provider?: string
          resource_id?: number | null
          resource_type?: string | null
          status?: string
          to_email?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          from_email?: string
          gross_amount_cents?: number
          id?: string
          metadata?: Json
          net_amount_cents?: number
          payment_type?: string
          paystack_reference?: string
          platform_fee_cents?: number
          provider?: string
          resource_id?: number | null
          resource_type?: string | null
          status?: string
          to_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payout_accounts: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_code: string | null
          bank_name: string | null
          country: string
          created_at: string
          creator_email: string
          currency: string
          default_withdrawal_type: string
          is_payout_ready: boolean
          method: string
          mobile_money_network: string | null
          mobile_money_number: string | null
          payout_notifications: boolean
          provider: string
          recipient_code: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          country?: string
          created_at?: string
          creator_email: string
          currency?: string
          default_withdrawal_type?: string
          is_payout_ready?: boolean
          method?: string
          mobile_money_network?: string | null
          mobile_money_number?: string | null
          payout_notifications?: boolean
          provider?: string
          recipient_code?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          country?: string
          created_at?: string
          creator_email?: string
          currency?: string
          default_withdrawal_type?: string
          is_payout_ready?: boolean
          method?: string
          mobile_money_network?: string | null
          mobile_money_number?: string | null
          payout_notifications?: boolean
          provider?: string
          recipient_code?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author: string | null
          author_email: string | null
          avatar: string | null
          body: string
          category: string | null
          channel: string
          comments: number
          community_id: number | null
          created_at: number
          id: number
          likes: number
          pinned: boolean
          role: string | null
          title: string | null
        }
        Insert: {
          author?: string | null
          author_email?: string | null
          avatar?: string | null
          body: string
          category?: string | null
          channel?: string
          comments?: number
          community_id?: number | null
          created_at: number
          id: number
          likes?: number
          pinned?: boolean
          role?: string | null
          title?: string | null
        }
        Update: {
          author?: string | null
          author_email?: string | null
          avatar?: string | null
          body?: string
          category?: string | null
          channel?: string
          comments?: number
          community_id?: number | null
          created_at?: number
          id?: number
          likes?: number
          pinned?: boolean
          role?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string
          email: string
          id: string
          location: string | null
          name: string
          photo_url: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          email: string
          id: string
          location?: string | null
          name?: string
          photo_url?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          name?: string
          photo_url?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          emoji: string
          post_id: number
          user_email: string
        }
        Insert: {
          emoji: string
          post_id: number
          user_email: string
        }
        Update: {
          emoji?: string
          post_id?: number
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_usage: {
        Row: {
          creator_email: string
          quota_bytes: number
          updated_at: string
          used_bytes: number
        }
        Insert: {
          creator_email: string
          quota_bytes?: number
          updated_at?: string
          used_bytes?: number
        }
        Update: {
          creator_email?: string
          quota_bytes?: number
          updated_at?: string
          used_bytes?: number
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          features: Json
          id: string
          instant_withdrawal_allowed: boolean
          name: string
          platform_fee_bps: number
          price_usd_cents: number
          storage_bytes: number
        }
        Insert: {
          features?: Json
          id: string
          instant_withdrawal_allowed?: boolean
          name: string
          platform_fee_bps?: number
          price_usd_cents?: number
          storage_bytes?: number
        }
        Update: {
          features?: Json
          id?: string
          instant_withdrawal_allowed?: boolean
          name?: string
          platform_fee_bps?: number
          price_usd_cents?: number
          storage_bytes?: number
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          processed: boolean
          processed_at: string | null
          provider: string
          raw_payload: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id: string
          processed?: boolean
          processed_at?: string | null
          provider?: string
          raw_payload: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          provider?: string
          raw_payload?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount_cents: number
          bank_account_name: string | null
          bank_account_number: string | null
          bank_code: string | null
          creator_email: string
          currency: string
          failure_reason: string | null
          fee_cents: number
          id: string
          net_amount_cents: number
          paystack_transfer_code: string | null
          processed_at: string | null
          requested_at: string
          status: string
          updated_at: string
          withdrawal_type: string
        }
        Insert: {
          amount_cents: number
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          creator_email: string
          currency?: string
          failure_reason?: string | null
          fee_cents?: number
          id: string
          net_amount_cents: number
          paystack_transfer_code?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          withdrawal_type?: string
        }
        Update: {
          amount_cents?: number
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          creator_email?: string
          currency?: string
          failure_reason?: string | null
          fee_cents?: number
          id?: string
          net_amount_cents?: number
          paystack_transfer_code?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          withdrawal_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      creator_wallet: {
        Row: {
          balance_cents: number | null
          creator_email: string | null
          currency: string | null
          gross_earned_cents: number | null
          last_transaction_at: string | null
          total_fees_cents: number | null
          total_withdrawn_cents: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
