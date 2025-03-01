export type Database = {
  _public: {
    _Tables: {
      _users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          displayname: string;
          avatarurl: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          displayname: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          displayname?: string;
          avatar_url?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      health_check: {
        Args: Record<string, never>;
        Returns: { response_time: number };
      };
    };
  };
};
