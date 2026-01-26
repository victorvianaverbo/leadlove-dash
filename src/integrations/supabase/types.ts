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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_spend: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string
          campaign_name: string | null
          checkouts_initiated: number | null
          clicks: number
          cpc: number | null
          cpm: number | null
          created_at: string
          daily_budget: number | null
          date: string
          frequency: number | null
          id: string
          impressions: number
          landing_page_views: number | null
          link_clicks: number | null
          project_id: string
          reach: number | null
          spend: number
          thruplays: number | null
          user_id: string
          video_3s_views: number | null
          video_p100_views: number | null
          video_p25_views: number | null
          video_p50_views: number | null
          video_p75_views: number | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id: string
          campaign_name?: string | null
          checkouts_initiated?: number | null
          clicks?: number
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          daily_budget?: number | null
          date: string
          frequency?: number | null
          id?: string
          impressions?: number
          landing_page_views?: number | null
          link_clicks?: number | null
          project_id: string
          reach?: number | null
          spend?: number
          thruplays?: number | null
          user_id: string
          video_3s_views?: number | null
          video_p100_views?: number | null
          video_p25_views?: number | null
          video_p50_views?: number | null
          video_p75_views?: number | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string
          campaign_name?: string | null
          checkouts_initiated?: number | null
          clicks?: number
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          daily_budget?: number | null
          date?: string
          frequency?: number | null
          id?: string
          impressions?: number
          landing_page_views?: number | null
          link_clicks?: number | null
          project_id?: string
          reach?: number | null
          spend?: number
          thruplays?: number | null
          user_id?: string
          video_3s_views?: number | null
          video_p100_views?: number | null
          video_p25_views?: number | null
          video_p50_views?: number | null
          video_p75_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_spend_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_spend_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_public"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          actions: Json | null
          comparison: Json | null
          created_at: string | null
          id: string
          metrics: Json | null
          project_id: string
          report_date: string
          summary: string
        }
        Insert: {
          actions?: Json | null
          comparison?: Json | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          project_id: string
          report_date: string
          summary: string
        }
        Update: {
          actions?: Json | null
          comparison?: Json | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          project_id?: string
          report_date?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_public"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string
          credentials: Json
          id: string
          is_active: boolean
          project_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          project_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          project_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          account_status: string | null
          ad_type: string | null
          benchmark_checkout_rate: number | null
          benchmark_ctr: number | null
          benchmark_engagement: number | null
          benchmark_lp_rate: number | null
          benchmark_sale_rate: number | null
          campaign_objective: string | null
          class_date: string | null
          created_at: string
          description: string | null
          guru_product_ids: string[] | null
          hotmart_product_ids: string[] | null
          id: string
          investment_value: number | null
          is_public: boolean | null
          kiwify_product_ids: string[] | null
          kiwify_ticket_price: number | null
          last_sync_at: string | null
          meta_campaign_ids: string[] | null
          name: string
          niche: string | null
          share_token: string | null
          slug: string | null
          updated_at: string
          use_gross_for_roas: boolean | null
          user_id: string
        }
        Insert: {
          account_status?: string | null
          ad_type?: string | null
          benchmark_checkout_rate?: number | null
          benchmark_ctr?: number | null
          benchmark_engagement?: number | null
          benchmark_lp_rate?: number | null
          benchmark_sale_rate?: number | null
          campaign_objective?: string | null
          class_date?: string | null
          created_at?: string
          description?: string | null
          guru_product_ids?: string[] | null
          hotmart_product_ids?: string[] | null
          id?: string
          investment_value?: number | null
          is_public?: boolean | null
          kiwify_product_ids?: string[] | null
          kiwify_ticket_price?: number | null
          last_sync_at?: string | null
          meta_campaign_ids?: string[] | null
          name: string
          niche?: string | null
          share_token?: string | null
          slug?: string | null
          updated_at?: string
          use_gross_for_roas?: boolean | null
          user_id: string
        }
        Update: {
          account_status?: string | null
          ad_type?: string | null
          benchmark_checkout_rate?: number | null
          benchmark_ctr?: number | null
          benchmark_engagement?: number | null
          benchmark_lp_rate?: number | null
          benchmark_sale_rate?: number | null
          campaign_objective?: string | null
          class_date?: string | null
          created_at?: string
          description?: string | null
          guru_product_ids?: string[] | null
          hotmart_product_ids?: string[] | null
          id?: string
          investment_value?: number | null
          is_public?: boolean | null
          kiwify_product_ids?: string[] | null
          kiwify_ticket_price?: number | null
          last_sync_at?: string | null
          meta_campaign_ids?: string[] | null
          name?: string
          niche?: string | null
          share_token?: string | null
          slug?: string | null
          updated_at?: string
          use_gross_for_roas?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          created_at: string
          customer_email: string | null
          customer_name: string | null
          gross_amount: number | null
          id: string
          kiwify_sale_id: string
          payment_method: string | null
          product_id: string
          product_name: string | null
          project_id: string
          sale_date: string
          source: string | null
          status: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          gross_amount?: number | null
          id?: string
          kiwify_sale_id: string
          payment_method?: string | null
          product_id: string
          product_name?: string | null
          project_id: string
          sale_date: string
          source?: string | null
          status: string
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          gross_amount?: number | null
          id?: string
          kiwify_sale_id?: string
          payment_method?: string | null
          product_id?: string
          product_name?: string | null
          project_id?: string
          sale_date?: string
          source?: string | null
          status?: string
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_overrides: {
        Row: {
          created_at: string | null
          extra_projects: number | null
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          extra_projects?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          extra_projects?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      projects_public: {
        Row: {
          account_status: string | null
          ad_type: string | null
          benchmark_checkout_rate: number | null
          benchmark_ctr: number | null
          benchmark_engagement: number | null
          benchmark_lp_rate: number | null
          benchmark_sale_rate: number | null
          campaign_objective: string | null
          class_date: string | null
          created_at: string | null
          description: string | null
          id: string | null
          investment_value: number | null
          is_public: boolean | null
          kiwify_product_ids: string[] | null
          last_sync_at: string | null
          meta_campaign_ids: string[] | null
          name: string | null
          share_token: string | null
          slug: string | null
          updated_at: string | null
          use_gross_for_roas: boolean | null
        }
        Insert: {
          account_status?: string | null
          ad_type?: string | null
          benchmark_checkout_rate?: number | null
          benchmark_ctr?: number | null
          benchmark_engagement?: number | null
          benchmark_lp_rate?: number | null
          benchmark_sale_rate?: number | null
          campaign_objective?: string | null
          class_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          investment_value?: number | null
          is_public?: boolean | null
          kiwify_product_ids?: string[] | null
          last_sync_at?: string | null
          meta_campaign_ids?: string[] | null
          name?: string | null
          share_token?: string | null
          slug?: string | null
          updated_at?: string | null
          use_gross_for_roas?: boolean | null
        }
        Update: {
          account_status?: string | null
          ad_type?: string | null
          benchmark_checkout_rate?: number | null
          benchmark_ctr?: number | null
          benchmark_engagement?: number | null
          benchmark_lp_rate?: number | null
          benchmark_sale_rate?: number | null
          campaign_objective?: string | null
          class_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          investment_value?: number | null
          is_public?: boolean | null
          kiwify_product_ids?: string[] | null
          last_sync_at?: string | null
          meta_campaign_ids?: string[] | null
          name?: string | null
          share_token?: string | null
          slug?: string | null
          updated_at?: string | null
          use_gross_for_roas?: boolean | null
        }
        Relationships: []
      }
      sales_public: {
        Row: {
          amount: number | null
          created_at: string | null
          gross_amount: number | null
          id: string | null
          kiwify_sale_id: string | null
          payment_method: string | null
          product_id: string | null
          product_name: string | null
          project_id: string | null
          sale_date: string | null
          status: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          gross_amount?: number | null
          id?: string | null
          kiwify_sale_id?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_name?: string | null
          project_id?: string | null
          sale_date?: string | null
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          gross_amount?: number | null
          id?: string | null
          kiwify_sale_id?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_name?: string | null
          project_id?: string | null
          sale_date?: string | null
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      app_role: ["admin", "user"],
    },
  },
} as const
