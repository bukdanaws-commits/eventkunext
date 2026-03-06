-- =============================================
-- EVENTKU DATABASE SCHEMA EXPORT
-- Export Date: 2026-01-11
-- Source: Lovable Cloud
-- Target: Your Supabase Account
-- =============================================

-- =============================================
-- PART 1: ENUMS (Custom Types)
-- =============================================

-- App Role Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'staff');

-- Commission Status Enum
CREATE TYPE public.commission_status AS ENUM ('pending', 'confirmed', 'paid', 'cancelled');

-- Draw Animation Enum
CREATE TYPE public.draw_animation AS ENUM ('spin_wheel', 'slot_machine', 'card_reveal', 'random_number');

-- Event Status Enum
CREATE TYPE public.event_status AS ENUM ('draft', 'pending_payment', 'active', 'completed', 'cancelled');

-- Event Tier Enum
CREATE TYPE public.event_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- Participant Status Enum
CREATE TYPE public.participant_status AS ENUM ('registered', 'checked_in', 'won');

-- Payment Status Enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'expired');

-- Prize Category Enum
CREATE TYPE public.prize_category AS ENUM ('hiburan', 'utama', 'grand_prize');
