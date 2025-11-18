import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mtlomjjlgvsjpudxlspq.supabase.co';

// =================================================================================
// == QUAN TRỌNG: DÁN KHÓA "ANON (PUBLIC)" CỦA BẠN VÀO ĐÂY ĐỂ KÍCH HOẠT ĐĂNG NHẬP ==
// =================================================================================
// Lấy khóa từ: Project Settings > API > Project API Keys > anon / public
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bG9tampsZ3ZzanB1ZHhsc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzAwMjcsImV4cCI6MjA3ODkwNjAyN30.6K-rSAFVJxQPLVjZKdJpBspb5tHE1dZiry4lS6u6JzQ";
// =================================================================================


export const supabase = createClient(supabaseUrl, supabaseKey);

// Biến này giúp giao diện kiểm tra xem khóa đã được cấu hình hay chưa.
export const isSupabaseConfigured = supabaseKey && !supabaseKey.startsWith("DÁN_KHÓA");