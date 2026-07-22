import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 앱 전체에서 사용할 수파베이스 클라이언트 객체 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);