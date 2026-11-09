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
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          path: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          path?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          path?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          is_hidden: boolean
          likes: number
          message: string
          name: string
          reports: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          likes?: number
          message: string
          name: string
          reports?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          likes?: number
          message?: string
          name?: string
          reports?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_state: {
        Row: {
          cron_secret: string
          id: number
          last_sent_at: string | null
          last_song: string | null
        }
        Insert: {
          cron_secret?: string
          id?: number
          last_sent_at?: string | null
          last_song?: string | null
        }
        Update: {
          cron_secret?: string
          id?: number
          last_sent_at?: string | null
          last_song?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          lang: string | null
          last_seen: string
          platform: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          lang?: string | null
          last_seen?: string
          platform?: string
          token: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          lang?: string | null
          last_seen?: string
          platform?: string
          token?: string
        }
        Relationships: []
      }
      recommended_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
          updated_at: string
          youtube_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          youtube_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          youtube_id?: string
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          id: number
          total: number
          updated_at: string
        }
        Insert: {
          id?: number
          total?: number
          updated_at?: string
        }
        Update: {
          id?: number
          total?: number
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
      visit_events: {
        Row: {
          country: string | null
          created_at: string
          id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _is_spam: { Args: { _text: string }; Returns: boolean }
      admin_create_announcement: {
        Args: {
          _body: string
          _image_url?: string
          _path?: string
          _title: string
        }
        Returns: {
          body: string
          created_at: string
          id: string
          image_url: string
          is_published: boolean
          path: string
          title: string
        }[]
      }
      admin_create_video: {
        Args: {
          _description?: string
          _sort_order?: number
          _title: string
          _youtube_id: string
        }
        Returns: {
          created_at: string
          description: string
          id: string
          is_published: boolean
          sort_order: number
          title: string
          youtube_id: string
        }[]
      }
      admin_delete_announcement: { Args: { _id: string }; Returns: boolean }
      admin_delete_video: { Args: { _id: string }; Returns: boolean }
      admin_list_announcements: {
        Args: never
        Returns: {
          body: string
          created_at: string
          id: string
          image_url: string
          is_published: boolean
          path: string
          title: string
        }[]
      }
      admin_list_comments: {
        Args: never
        Returns: {
          client_id: string
          created_at: string
          id: string
          is_hidden: boolean
          likes: number
          message: string
          name: string
          reports: number
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          is_admin: boolean
        }[]
      }
      admin_list_videos: {
        Args: never
        Returns: {
          created_at: string
          description: string
          id: string
          is_published: boolean
          sort_order: number
          title: string
          youtube_id: string
        }[]
      }
      admin_moderate_comment: {
        Args: { _action: string; _id: string }
        Returns: boolean
      }
      admin_set_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      admin_toggle_announcement: {
        Args: { _id: string; _published: boolean }
        Returns: boolean
      }
      admin_toggle_video: {
        Args: { _id: string; _published: boolean }
        Returns: boolean
      }
      admin_visit_stats: { Args: { _hours?: number }; Returns: Json }
      get_visits: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_visits: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      log_visit: { Args: { _country?: string }; Returns: number }
      post_comment: {
        Args: {
          _client_id: string
          _honeypot?: string
          _message: string
          _name: string
        }
        Returns: {
          created_at: string
          id: string
          likes: number
          message: string
          name: string
          reports: number
        }[]
      }
      register_push_token: {
        Args: { _lang?: string; _platform?: string; _token: string }
        Returns: boolean
      }
      report_comment: { Args: { _id: string }; Returns: number }
      toggle_like_comment: {
        Args: { _delta: number; _id: string }
        Returns: number
      }
      unregister_push_token: { Args: { _token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
