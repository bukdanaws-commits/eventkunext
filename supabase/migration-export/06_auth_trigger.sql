-- =============================================
-- PART 7: AUTH TRIGGER (Run in Supabase SQL Editor)
-- =============================================

-- IMPORTANT: This trigger must be created on auth.users table
-- You need to run this in Supabase SQL Editor with proper permissions

-- Create trigger to handle new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ENABLE REALTIME FOR SPECIFIC TABLES
-- =============================================

-- Enable realtime for winners table (for live draw)
ALTER PUBLICATION supabase_realtime ADD TABLE public.winners;

-- Enable realtime for participants table (for live check-in)
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;

-- Enable realtime for prizes table (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.prizes;
