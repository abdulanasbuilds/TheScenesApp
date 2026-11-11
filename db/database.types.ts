
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "categories": {
                  Row: {
                    "accent_hue": number,"blurb": string,"created_at": string,"id": string,"name": string,"slug": string,"sort_order": number,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accent_hue": number,"blurb": string,"created_at"?: string,"id"?: string,"name": string,"slug": string,"sort_order"?: number,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "accent_hue"?: number,"blurb"?: string,"created_at"?: string,"id"?: string,"name"?: string,"slug"?: string,"sort_order"?: number,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"communities": {
                  Row: {
                    "accent_hue": number,"created_at": string,"description": string,"discoverability": string,"id": string,"join_policy": string,"languages": (string)[],"name": string,"privacy": string,"published_at": string | null,"slug": string,"status": string,"tagline": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accent_hue": number,"created_at"?: string,"description": string,"discoverability"?: string,"id"?: string,"join_policy": string,"languages": (string)[],"name": string,"privacy": string,"published_at"?: string | null,"slug": string,"status": string,"tagline": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "accent_hue"?: number,"created_at"?: string,"description"?: string,"discoverability"?: string,"id"?: string,"join_policy"?: string,"languages"?: (string)[],"name"?: string,"privacy"?: string,"published_at"?: string | null,"slug"?: string,"status"?: string,"tagline"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "communities_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"community_categories": {
                  Row: {
                    "category_id": string,"community_id": string,"is_primary": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"community_id": string,"is_primary"?: boolean
                  }
                  Update: {
                    "category_id"?: string,"community_id"?: string,"is_primary"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_categories_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_categories_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    }
                  ]
                },"community_memberships": {
                  Row: {
                    "community_id": string,"created_at": string,"id": string,"joined_at": string | null,"role": string,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "community_id": string,"created_at"?: string,"id"?: string,"joined_at"?: string | null,"role"?: string,"status": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "community_id"?: string,"created_at"?: string,"id"?: string,"joined_at"?: string | null,"role"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_memberships_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"course_enrollments": {
                  Row: {
                    "course_id": string,"created_at": string,"enrolled_at": string,"id": string,"source": string,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"enrolled_at"?: string,"id"?: string,"source": string,"status"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"enrolled_at"?: string,"id"?: string,"source"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_enrollments_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_enrollments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"course_modules": {
                  Row: {
                    "course_id": string,"id": string,"position": number,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"id"?: string,"position": number,"title": string
                  }
                  Update: {
                    "course_id"?: string,"id"?: string,"position"?: number,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_modules_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"course_outcomes": {
                  Row: {
                    "body": string,"course_id": string,"id": string,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"course_id": string,"id"?: string,"position": number
                  }
                  Update: {
                    "body"?: string,"course_id"?: string,"id"?: string,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_outcomes_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"courses": {
                  Row: {
                    "access": string,"category_id": string | null,"community_id": string,"created_at": string,"description": string,"id": string,"instructor_id": string,"level": string,"published_at": string | null,"slug": string,"status": string,"subtitle": string,"title": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "access": string,"category_id"?: string | null,"community_id": string,"created_at"?: string,"description": string,"id"?: string,"instructor_id": string,"level": string,"published_at"?: string | null,"slug": string,"status": string,"subtitle": string,"title": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "access"?: string,"category_id"?: string | null,"community_id"?: string,"created_at"?: string,"description"?: string,"id"?: string,"instructor_id"?: string,"level"?: string,"published_at"?: string | null,"slug"?: string,"status"?: string,"subtitle"?: string,"title"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "courses_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "courses_community_workspace_fk"
      columns: ["community_id","workspace_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "courses_instructor_id_fkey"
      columns: ["instructor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "courses_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_completions": {
                  Row: {
                    "completed_at": string,"course_id": string,"created_at": string,"enrollment_id": string,"id": string,"lesson_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string,"course_id": string,"created_at"?: string,"enrollment_id": string,"id"?: string,"lesson_id": string
                  }
                  Update: {
                    "completed_at"?: string,"course_id"?: string,"created_at"?: string,"enrollment_id"?: string,"id"?: string,"lesson_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_completions_enrollment_course_fk"
      columns: ["enrollment_id","course_id"]
isOneToOne: false
      referencedRelation: "course_enrollments"
      referencedColumns: ["id","course_id"]
    },{
      foreignKeyName: "lesson_completions_lesson_course_fk"
      columns: ["lesson_id","course_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id","course_id"]
    }
                  ]
                },"lesson_contents": {
                  Row: {
                    "body": NonNullable<Json>,"body_version": number,"created_at": string,"lesson_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": NonNullable<Json>,"body_version"?: number,"created_at"?: string,"lesson_id": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"body_version"?: number,"created_at"?: string,"lesson_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_contents_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: true
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_resources": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"label": string,"lesson_id": string,"position": number,"updated_at": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"label": string,"lesson_id": string,"position": number,"updated_at"?: string,"url": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"label"?: string,"lesson_id"?: string,"position"?: number,"updated_at"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_resources_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "course_id": string,"created_at": string,"duration_minutes": number,"id": string,"is_preview": boolean,"kind": string,"module_id": string,"position": number,"slug": string,"summary": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"duration_minutes": number,"id"?: string,"is_preview"?: boolean,"kind": string,"module_id": string,"position": number,"slug": string,"summary": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"duration_minutes"?: number,"id"?: string,"is_preview"?: boolean,"kind"?: string,"module_id"?: string,"position"?: number,"slug"?: string,"summary"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lessons_module_course_fk"
      columns: ["course_id","module_id"]
isOneToOne: false
      referencedRelation: "course_modules"
      referencedColumns: ["course_id","id"]
    }
                  ]
                },"notification_preferences": {
                  Row: {
                    "created_at": string,"email_community": boolean,"email_learning": boolean,"email_product": boolean,"in_app_community": boolean,"in_app_learning": boolean,"in_app_product": boolean,"push_community": boolean,"push_learning": boolean,"push_product": boolean,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email_community"?: boolean,"email_learning"?: boolean,"email_product"?: boolean,"in_app_community"?: boolean,"in_app_learning"?: boolean,"in_app_product"?: boolean,"push_community"?: boolean,"push_learning"?: boolean,"push_product"?: boolean,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"email_community"?: boolean,"email_learning"?: boolean,"email_product"?: boolean,"in_app_community"?: boolean,"in_app_learning"?: boolean,"in_app_product"?: boolean,"push_community"?: boolean,"push_learning"?: boolean,"push_product"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"notifications": {
                  Row: {
                    "body": string,"created_at": string,"dedupe_key": string,"href": string | null,"id": string,"read_at": string | null,"title": string,"type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"dedupe_key": string,"href"?: string | null,"id"?: string,"read_at"?: string | null,"title": string,"type": string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"dedupe_key"?: string,"href"?: string | null,"id"?: string,"read_at"?: string | null,"title"?: string,"type"?: string,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"profiles": {
                  Row: {
                    "bio": string | null,"created_at": string,"display_name": string,"handle": string,"headline": string | null,"id": string,"location": string | null,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bio"?: string | null,"created_at"?: string,"display_name": string,"handle": string,"headline"?: string | null,"id": string,"location"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "bio"?: string | null,"created_at"?: string,"display_name"?: string,"handle"?: string,"headline"?: string | null,"id"?: string,"location"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"workspace_memberships": {
                  Row: {
                    "created_at": string,"id": string,"role": string,"status": string,"updated_at": string,"user_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"role": string,"status"?: string,"updated_at"?: string,"user_id": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"role"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workspace_memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workspace_memberships_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"workspaces": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"kind": string,"name": string,"slug": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"id"?: string,"kind": string,"name": string,"slug": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"kind"?: string,"name"?: string,"slug"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workspaces_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "complete_lesson":
{ Args: { "p_lesson_id": string,"p_request_id": string }; Returns: Json
                           },
"enrol_in_course":
{ Args: { "p_course_id": string,"p_request_id": string }; Returns: Json
                           },
"join_community":
{ Args: { "p_community_id": string,"p_request_id": string }; Returns: Json
                           },
"leave_community":
{ Args: { "p_community_id": string,"p_request_id": string }; Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {

          }
        }
} as const
