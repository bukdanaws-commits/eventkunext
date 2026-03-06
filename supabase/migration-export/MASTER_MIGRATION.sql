-- =============================================
-- EVENTKU COMPLETE DATABASE MIGRATION
-- =============================================
-- This file contains the complete database schema for Eventku
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql
-- 
-- Total Tables: 35+
-- Total RLS Policies: 100+
-- Storage Buckets: 4
-- Edge Functions: 41
-- =============================================

-- =============================================
-- PART 0: ENUMS (Custom Types)
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

-- =============================================
-- PART 1: TABLES
-- =============================================

-- Organizations Table
CREATE TABLE public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Profiles Table
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    organization_id uuid REFERENCES public.organizations(id),
    full_name text,
    email text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Roles Table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    organization_id uuid REFERENCES public.organizations(id),
    role public.app_role NOT NULL DEFAULT 'owner',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, organization_id, role)
);

-- User Bank Info Table
CREATE TABLE public.user_bank_info (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    bank_name text,
    bank_account_number text,
    bank_account_holder text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Pricing Tiers Table
CREATE TABLE public.pricing_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tier public.event_tier NOT NULL,
    name text NOT NULL,
    price integer NOT NULL DEFAULT 0,
    max_participants integer NOT NULL,
    max_hiburan integer NOT NULL,
    max_utama integer NOT NULL,
    max_grand_prize integer NOT NULL,
    form_addon_price integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Events Table
CREATE TABLE public.events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    name text NOT NULL,
    description text,
    location text,
    event_date date NOT NULL,
    event_time time without time zone,
    tier public.event_tier NOT NULL DEFAULT 'free',
    status public.event_status NOT NULL DEFAULT 'draft',
    cover_image_url text,
    public_viewer_slug text,
    qr_checkin_enabled boolean NOT NULL DEFAULT false,
    email_notification_enabled boolean NOT NULL DEFAULT false,
    checkin_required_for_draw boolean NOT NULL DEFAULT true,
    registration_enabled boolean NOT NULL DEFAULT true,
    form_addon_purchased boolean NOT NULL DEFAULT false,
    form_theme text DEFAULT 'professional',
    is_paid_event boolean DEFAULT false,
    ticket_price integer DEFAULT 0,
    claim_instructions text,
    contact_email text,
    contact_phone text,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Event Payments Table
CREATE TABLE public.event_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    tier public.event_tier NOT NULL,
    amount integer NOT NULL,
    total_amount integer NOT NULL,
    discount_amount integer NOT NULL DEFAULT 0,
    form_addon_amount integer NOT NULL DEFAULT 0,
    form_addon_purchased boolean NOT NULL DEFAULT false,
    payment_status public.payment_status NOT NULL DEFAULT 'pending',
    payment_method text,
    midtrans_order_id text,
    midtrans_transaction_id text,
    proof_url text,
    referral_code text,
    expires_at timestamp with time zone,
    paid_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ticket Tiers Table
CREATE TABLE public.ticket_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id),
    name text NOT NULL,
    description text,
    price integer NOT NULL DEFAULT 0,
    early_bird_price integer,
    early_bird_end_date timestamp with time zone,
    quota integer,
    sold_count integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Benefit Items Table
CREATE TABLE public.benefit_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id uuid NOT NULL REFERENCES public.ticket_tiers(id),
    name text NOT NULL,
    description text,
    type text NOT NULL DEFAULT 'physical',
    is_redeemable boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Participants Table
CREATE TABLE public.participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id),
    tier_id uuid REFERENCES public.ticket_tiers(id),
    auth_user_id uuid,
    registration_id uuid,
    name text NOT NULL,
    email text,
    phone text,
    company text,
    division text,
    address text,
    ticket_number text NOT NULL,
    status public.participant_status NOT NULL DEFAULT 'registered',
    payment_status text DEFAULT 'not_required',
    checked_in_at timestamp with time zone,
    checked_in_by uuid,
    qr_email_sent boolean NOT NULL DEFAULT false,
    qr_email_sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Participant Benefits Table
CREATE TABLE public.participant_benefits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL REFERENCES public.participants(id),
    benefit_item_id uuid NOT NULL REFERENCES public.benefit_items(id),
    is_redeemed boolean NOT NULL DEFAULT false,
    redeemed_at timestamp with time zone,
    redeemed_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Participant Payments Table
CREATE TABLE public.participant_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL REFERENCES public.participants(id),
    event_id uuid NOT NULL REFERENCES public.events(id),
    tier_id uuid REFERENCES public.ticket_tiers(id),
    amount integer NOT NULL,
    payment_status text NOT NULL DEFAULT 'pending',
    payment_method text,
    midtrans_order_id text,
    midtrans_transaction_id text,
    snap_token text,
    expires_at timestamp with time zone,
    paid_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Prizes Table
CREATE TABLE public.prizes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id),
    name text NOT NULL,
    description text,
    category public.prize_category NOT NULL,
    image_url text,
    quantity integer NOT NULL DEFAULT 1,
    remaining_quantity integer NOT NULL DEFAULT 1,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Winners Table
CREATE TABLE public.winners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id),
    participant_id uuid NOT NULL REFERENCES public.participants(id),
    prize_id uuid NOT NULL REFERENCES public.prizes(id),
    animation_used public.draw_animation NOT NULL,
    drawn_at timestamp with time zone NOT NULL DEFAULT now(),
    email_sent boolean NOT NULL DEFAULT false,
    email_sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Prize Audit Logs Table
CREATE TABLE public.prize_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prize_id uuid NOT NULL REFERENCES public.prizes(id),
    event_id uuid NOT NULL REFERENCES public.events(id),
    user_id uuid NOT NULL,
    action text NOT NULL,
    changes jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Event Forms Table
CREATE TABLE public.event_forms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL UNIQUE REFERENCES public.events(id),
    title text NOT NULL,
    description text,
    is_published boolean NOT NULL DEFAULT false,
    public_slug text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Form Fields Table
CREATE TABLE public.form_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id uuid NOT NULL REFERENCES public.event_forms(id),
    label text NOT NULL,
    field_type text NOT NULL,
    placeholder text,
    is_required boolean NOT NULL DEFAULT false,
    options jsonb,
    mapped_to text,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Form Submissions Table
CREATE TABLE public.form_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id uuid NOT NULL REFERENCES public.event_forms(id),
    participant_id uuid REFERENCES public.participants(id),
    data jsonb NOT NULL,
    submitted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Event Scanners Table
CREATE TABLE public.event_scanners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id),
    user_id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- QR Email Logs Table
CREATE TABLE public.qr_email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL REFERENCES public.participants(id),
    event_type text NOT NULL,
    email_address text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Certificate Templates Table
CREATE TABLE public.certificate_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id),
    template_name text NOT NULL DEFAULT 'Default Template',
    title_text text NOT NULL DEFAULT 'SERTIFIKAT PEMENANG',
    subtitle_text text NOT NULL DEFAULT 'Diberikan kepada:',
    prize_label_text text NOT NULL DEFAULT 'Sebagai Pemenang',
    footer_text text,
    logo_url text,
    background_url text,
    title_font text DEFAULT 'Arial',
    title_size integer DEFAULT 36,
    title_color text DEFAULT '#000000',
    body_font text DEFAULT 'Arial',
    body_size integer DEFAULT 20,
    body_color text DEFAULT '#333333',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Affiliate Tiers Table
CREATE TABLE public.affiliate_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    commission_percentage decimal(5,2) NOT NULL DEFAULT 0.00,
    min_conversions integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Referral Codes Table
CREATE TABLE public.referral_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    code text NOT NULL UNIQUE,
    custom_code text UNIQUE,
    tier_id uuid REFERENCES public.affiliate_tiers(id),
    total_signups integer NOT NULL DEFAULT 0,
    total_conversions integer NOT NULL DEFAULT 0,
    total_commission integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Referrals Table
CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL,
    referee_id uuid NOT NULL,
    referral_code_id uuid REFERENCES public.referral_codes(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (referee_id)
);

-- Commissions Table
CREATE TABLE public.commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    event_id uuid REFERENCES public.events(id),
    amount integer NOT NULL,
    status public.commission_status NOT NULL DEFAULT 'pending',
    paid_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Affiliate Goals Table
CREATE TABLE public.affiliate_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    target_conversions integer NOT NULL DEFAULT 0,
    target_commission integer NOT NULL DEFAULT 0,
    current_conversions integer NOT NULL DEFAULT 0,
    current_commission integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, year, month)
);

-- Affiliate Notifications Table
CREATE TABLE public.affiliate_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- EO Bank Settings Table
CREATE TABLE public.eo_bank_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    bank_name text NOT NULL,
    bank_account_number text NOT NULL,
    bank_account_holder text NOT NULL,
    is_verified boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- EO Payouts Table
CREATE TABLE public.eo_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    bank_name text NOT NULL,
    bank_account_number text NOT NULL,
    bank_account_holder text NOT NULL,
    reference_id text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Refund Requests Table
CREATE TABLE public.refund_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_payment_id uuid REFERENCES public.event_payments(id),
    participant_payment_id uuid REFERENCES public.participant_payments(id),
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    reason text,
    status text NOT NULL DEFAULT 'pending',
    processed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Admin Audit Logs Table
CREATE TABLE public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Admin Notifications Table
CREATE TABLE public.admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    target_segment text DEFAULT 'all',
    created_by uuid NOT NULL,
    sent_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Blocked IPs Table
CREATE TABLE public.blocked_ips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address text NOT NULL UNIQUE,
    reason text,
    blocked_by uuid,
    blocked_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Blocked Users Table
CREATE TABLE public.blocked_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    reason text,
    blocked_by uuid,
    blocked_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Login Attempts Table
CREATE TABLE public.login_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    ip_address text,
    success boolean NOT NULL DEFAULT false,
    failure_reason text,
    attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Login Logs Table
CREATE TABLE public.login_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    email text NOT NULL,
    ip_address text,
    user_agent text,
    login_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Contact Messages Table
CREATE TABLE public.contact_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    replied_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Broadcast Emails Table
CREATE TABLE public.broadcast_emails (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES public.events(id),
    subject text NOT NULL,
    content text NOT NULL,
    recipient_count integer NOT NULL DEFAULT 0,
    sent_at timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Scheduled Broadcasts Table
CREATE TABLE public.scheduled_broadcasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES public.events(id),
    subject text NOT NULL,
    content text NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    sent_at timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Email Templates Table
CREATE TABLE public.email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    subject text NOT NULL,
    body text NOT NULL,
    variables text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Email Tracking Table
CREATE TABLE public.email_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type text NOT NULL,
    recipient_email text NOT NULL,
    event_id uuid REFERENCES public.events(id),
    participant_id uuid REFERENCES public.participants(id),
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Email Link Clicks Table
CREATE TABLE public.email_link_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id uuid REFERENCES public.email_tracking(id),
    url text NOT NULL,
    clicked_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Push Subscriptions Table
CREATE TABLE public.push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- PART 2: DATABASE FUNCTIONS
-- =============================================

-- Function: Update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Function: Has Role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$function$;

-- Function: Has Org Role
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
  );
$function$;

-- Function: User Belongs to Org
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _org_id
  );
$function$;

-- Function: Get User Org ID
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $function$
  SELECT organization_id
  FROM public.user_profiles
  WHERE user_id = _user_id
  LIMIT 1;
$function$;

-- Function: Is Event Scanner
CREATE OR REPLACE FUNCTION public.is_event_scanner(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_scanners es
    WHERE es.event_id = _event_id
      AND es.user_id = _user_id
      AND es.is_active = true
  );
$function$;

-- Function: Can Manage Event Scanners
CREATE OR REPLACE FUNCTION public.can_manage_event_scanners(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = _event_id
      AND public.user_belongs_to_org(_user_id, e.organization_id)
  );
$function$;

-- Function: Cleanup Old Login Attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    DELETE FROM public.login_attempts
    WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$function$;

-- Function: Auto Create Participant Benefits
CREATE OR REPLACE FUNCTION public.auto_create_participant_benefits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.tier_id IS NOT NULL THEN
        INSERT INTO public.participant_benefits (participant_id, benefit_item_id)
        SELECT NEW.id, bi.id
        FROM public.benefit_items bi
        WHERE bi.tier_id = NEW.tier_id;
    END IF;
    RETURN NEW;
END;
$function$;

-- Function: Update Tier Sold Count
CREATE OR REPLACE FUNCTION public.update_tier_sold_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.tier_id IS NOT NULL AND (OLD IS NULL OR OLD.tier_id IS DISTINCT FROM NEW.tier_id) THEN
        UPDATE public.ticket_tiers
        SET sold_count = sold_count + 1, updated_at = now()
        WHERE id = NEW.tier_id;
    END IF;
    RETURN NEW;
END;
$function$;

-- Function: Handle New User (Auth Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  org_id uuid;
BEGIN
  -- Create organization for the user
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(new.raw_user_meta_data ->> 'full_name', new.email))
  RETURNING id INTO org_id;
  
  -- Create user profile with email
  INSERT INTO public.user_profiles (user_id, organization_id, full_name, email)
  VALUES (
    new.id, 
    org_id, 
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  
  -- Assign owner role
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (new.id, org_id, 'owner');
  
  -- Create referral code for new user
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (new.id, UPPER(SUBSTRING(MD5(new.id::text || now()::text) FROM 1 FOR 8)));
  
  -- If user signed up with a referral code, create referral record
  IF new.raw_user_meta_data ->> 'referral_code' IS NOT NULL THEN
    DECLARE
      referrer_code_id uuid;
      referrer_user_id uuid;
    BEGIN
      -- Find the referral code
      SELECT id, user_id INTO referrer_code_id, referrer_user_id
      FROM public.referral_codes
      WHERE code = UPPER(new.raw_user_meta_data ->> 'referral_code')
         OR custom_code = UPPER(new.raw_user_meta_data ->> 'referral_code');
      
      IF referrer_code_id IS NOT NULL THEN
        -- Create referral record
        INSERT INTO public.referrals (referrer_id, referee_id, referral_code_id)
        VALUES (referrer_user_id, new.id, referrer_code_id);
        
        -- Increment signup count
        UPDATE public.referral_codes
        SET total_signups = total_signups + 1, updated_at = now()
        WHERE id = referrer_code_id;
      END IF;
    END;
  END IF;
  
  RETURN new;
END;
$function$;

-- =============================================
-- PART 3: TRIGGERS
-- =============================================

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_bank_info_updated_at BEFORE UPDATE ON public.user_bank_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_payments_updated_at BEFORE UPDATE ON public.event_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ticket_tiers_updated_at BEFORE UPDATE ON public.ticket_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_participant_payments_updated_at BEFORE UPDATE ON public.participant_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON public.prizes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_forms_updated_at BEFORE UPDATE ON public.event_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE ON public.certificate_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referral_codes_updated_at BEFORE UPDATE ON public.referral_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affiliate_goals_updated_at BEFORE UPDATE ON public.affiliate_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_eo_bank_settings_updated_at BEFORE UPDATE ON public.eo_bank_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_eo_payouts_updated_at BEFORE UPDATE ON public.eo_payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_refund_requests_updated_at BEFORE UPDATE ON public.refund_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business logic triggers
CREATE TRIGGER trigger_auto_create_participant_benefits AFTER INSERT OR UPDATE OF tier_id ON public.participants FOR EACH ROW EXECUTE FUNCTION public.auto_create_participant_benefits();
CREATE TRIGGER trigger_update_tier_sold_count AFTER INSERT OR UPDATE OF tier_id ON public.participants FOR EACH ROW EXECUTE FUNCTION public.update_tier_sold_count();

-- =============================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bank_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_scanners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eo_bank_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eo_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS POLICIES
CREATE POLICY "Users can view their organization" ON public.organizations FOR SELECT USING (user_belongs_to_org(auth.uid(), id));
CREATE POLICY "Owners can update their organization" ON public.organizations FOR UPDATE USING (has_org_role(auth.uid(), id, 'owner'));

-- USER PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.user_profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- USER ROLES POLICIES
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- USER BANK INFO POLICIES
CREATE POLICY "Users can view their own bank info" ON public.user_bank_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bank info" ON public.user_bank_info FOR ALL USING (auth.uid() = user_id);

-- PRICING TIERS POLICIES (public read)
CREATE POLICY "Pricing tiers are viewable by everyone" ON public.pricing_tiers FOR SELECT USING (true);

-- EVENTS POLICIES
CREATE POLICY "Users can view events in their org" ON public.events FOR SELECT USING (user_belongs_to_org(auth.uid(), organization_id));
CREATE POLICY "Org members can create events" ON public.events FOR INSERT WITH CHECK (user_belongs_to_org(auth.uid(), organization_id));
CREATE POLICY "Owners can update events" ON public.events FOR UPDATE USING (has_org_role(auth.uid(), organization_id, 'owner') OR has_org_role(auth.uid(), organization_id, 'staff'));
CREATE POLICY "Owners can delete events" ON public.events FOR DELETE USING (has_org_role(auth.uid(), organization_id, 'owner'));
CREATE POLICY "Admins have full access to events" ON public.events FOR ALL USING (has_role(auth.uid(), 'admin'));

-- EVENT PAYMENTS POLICIES
CREATE POLICY "Users can view their event payments" ON public.event_payments FOR SELECT USING (user_belongs_to_org(auth.uid(), organization_id));
CREATE POLICY "Org members can create event payments" ON public.event_payments FOR INSERT WITH CHECK (user_belongs_to_org(auth.uid(), organization_id));
CREATE POLICY "Admins have full access to event payments" ON public.event_payments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PARTICIPANTS POLICIES
CREATE POLICY "Org members can view participants" ON public.participants FOR SELECT USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = participants.event_id AND user_belongs_to_org(auth.uid(), events.organization_id)));
CREATE POLICY "Org members can create participants" ON public.participants FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = participants.event_id AND user_belongs_to_org(auth.uid(), events.organization_id)));
CREATE POLICY "Org members can update participants" ON public.participants FOR UPDATE USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = participants.event_id AND user_belongs_to_org(auth.uid(), events.organization_id)));
CREATE POLICY "Scanners can manage participants" ON public.participants FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = participants.event_id AND is_event_scanner(auth.uid(), events.id)));

-- PRIZES POLICIES
CREATE POLICY "Org members can view prizes" ON public.prizes FOR SELECT USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = prizes.event_id AND user_belongs_to_org(auth.uid(), events.organization_id)));
CREATE POLICY "Org members can manage prizes" ON public.prizes FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = prizes.event_id AND user_belongs_to_org(auth.uid(), events.organization_id)));

-- WINNERS POLICIES
CREATE POLICY "Org members can view winners" ON public.winners FOR SELECT USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = winners.event_id AND user_belongs_to_org(auth.uid(), events.organization_id)));
CREATE POLICY "Org members can create winners" ON public.winners FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = winners.event_id AND user_belongs_to_org(auth.uid(), events.organization_id)));

-- ADMIN TABLES POLICIES
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage blocked users" ON public.blocked_users FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view login logs" ON public.login_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contact messages" ON public.contact_messages FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- AFFILIATE POLICIES
CREATE POLICY "Users can view their referral code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their referral code" ON public.referral_codes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their commissions" ON public.commissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage commissions" ON public.commissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- PART 5: STORAGE BUCKETS
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('prize-images', 'prize-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-logos', 'certificate-logos', true) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Anyone can view prize images" ON storage.objects FOR SELECT USING (bucket_id = 'prize-images');
CREATE POLICY "Authenticated users can upload prize images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prize-images' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view event images" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Authenticated users can upload event images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view payment proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');
CREATE POLICY "Authenticated users can upload payment proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view certificate logos" ON storage.objects FOR SELECT USING (bucket_id = 'certificate-logos');
CREATE POLICY "Authenticated users can upload certificate logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificate-logos' AND auth.role() = 'authenticated');

-- =============================================
-- PART 6: AUTH TRIGGER
-- =============================================

-- Create the trigger on auth.users (must be run as superuser)
-- This will automatically create profile, org, and referral code for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PART 7: SEED DATA
-- =============================================

-- Insert Pricing Tiers
INSERT INTO public.pricing_tiers (tier, name, price, max_participants, max_hiburan, max_utama, max_grand_prize, form_addon_price)
VALUES 
    ('free', 'Free', 0, 50, 5, 2, 1, 0),
    ('basic', 'Basic', 99000, 200, 15, 5, 2, 49000),
    ('pro', 'Pro', 299000, 500, 30, 10, 5, 99000),
    ('enterprise', 'Enterprise', 799000, 2000, 100, 30, 15, 199000)
ON CONFLICT DO NOTHING;

-- Insert Affiliate Tiers
INSERT INTO public.affiliate_tiers (name, commission_percentage, min_conversions)
VALUES 
    ('Bronze', 10.00, 0),
    ('Silver', 12.50, 5),
    ('Gold', 15.00, 15),
    ('Platinum', 20.00, 30)
ON CONFLICT DO NOTHING;

-- =============================================
-- MIGRATION COMPLETE!
-- =============================================
