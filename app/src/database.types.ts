export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Assets: {
        Row: {
          beat_id: number | null
          content: Json | null
          created_at: string
          id: number
          type: string | null
        }
        Insert: {
          beat_id?: number | null
          content?: Json | null
          created_at?: string
          id?: number
          type?: string | null
        }
        Update: {
          beat_id?: number | null
          content?: Json | null
          created_at?: string
          id?: number
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Assets_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "Beats"
            referencedColumns: ["id"]
          }
        ]
      }
      Beats: {
        Row: {
          audio_content: string | null
          created_at: string
          id: number
          name: string | null
          order: number | null
          scene_id: number | null
        }
        Insert: {
          audio_content?: string | null
          created_at?: string
          id?: number
          name?: string | null
          order?: number | null
          scene_id?: number | null
        }
        Update: {
          audio_content?: string | null
          created_at?: string
          id?: number
          name?: string | null
          order?: number | null
          scene_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Beats_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "Scenes"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      Scenes: {
        Row: {
          created_at: string
          id: number
          name: string | null
          order: number | null
          script_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
          order?: number | null
          script_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
          order?: number | null
          script_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Scenes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "Scripts"
            referencedColumns: ["id"]
          }
        ]
      }
      Scripts: {
        Row: {
          created_at: string
          description: string | null
          id: number
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
