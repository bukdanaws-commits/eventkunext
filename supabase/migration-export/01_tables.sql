-- =============================================
-- PART 2: TABLES
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
    background_color text NOT NULL DEFAULT '#FFFFFF',
    border_color text NOT NULL DEFAULT '#D4AF37',
    border_width integer NOT NULL DEFAULT 3,
    title_color text NOT NULL DEFAULT '#D4AF37',
    title_font_size integer NOT NULL DEFAULT 48,
    subtitle_color text NOT NULL DEFAULT '#666666',
    subtitle_font_size integer NOT NULL DEFAULT 18,
    name_color text NOT NULL DEFAULT '#1a1a1a',
    name_font_size integer NOT NULL DEFAULT 36,
    prize_color text NOT NULL DEFAULT '#333333',
    prize_font_size integer NOT NULL DEFAULT 24,
    footer_color text NOT NULL DEFAULT '#888888',
    footer_font_size integer NOT NULL DEFAULT 14,
    show_ticket_number boolean NOT NULL DEFAULT true,
    show_category boolean NOT NULL DEFAULT true,
    show_event_date boolean NOT NULL DEFAULT true,
    show_decorations boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Referral Codes Table
CREATE TABLE public.referral_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    code text NOT NULL UNIQUE,
    custom_code text UNIQUE,
    tier_id uuid,
    total_clicks integer NOT NULL DEFAULT 0,
    total_signups integer NOT NULL DEFAULT 0,
    total_conversions integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Referrals Table
CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL,
    referee_id uuid NOT NULL,
    referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id),
    converted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Affiliate Tiers Table
CREATE TABLE public.affiliate_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    commission_percentage numeric NOT NULL DEFAULT 10.00,
    min_conversions integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Affiliate Goals Table
CREATE TABLE public.affiliate_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    target_conversions integer NOT NULL DEFAULT 10,
    target_commission numeric NOT NULL DEFAULT 1000000,
    current_conversions integer NOT NULL DEFAULT 0,
    current_commission numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, year, month)
);

-- Affiliate Notifications Table
CREATE TABLE public.affiliate_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'info',
    link text,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Commissions Table
CREATE TABLE public.commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL,
    referee_id uuid NOT NULL,
    payment_id uuid NOT NULL REFERENCES public.event_payments(id),
    amount integer NOT NULL,
    status public.commission_status NOT NULL DEFAULT 'pending',
    payout_reference text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- EO Bank Settings Table
CREATE TABLE public.eo_bank_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id),
    bank_name text NOT NULL,
    bank_code text NOT NULL,
    account_number text NOT NULL,
    account_holder_name text NOT NULL,
    is_verified boolean NOT NULL DEFAULT false,
    verified_at timestamp with time zone,
    verified_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- EO Payouts Table
CREATE TABLE public.eo_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    event_id uuid NOT NULL REFERENCES public.events(id),
    participant_payment_id uuid NOT NULL REFERENCES public.participant_payments(id),
    gross_amount integer NOT NULL,
    platform_fee integer NOT NULL,
    platform_fee_percentage numeric NOT NULL DEFAULT 10,
    net_amount integer NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    iris_reference_no text,
    iris_status text,
    notes text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Refund Requests Table
CREATE TABLE public.refund_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_payment_id uuid NOT NULL REFERENCES public.participant_payments(id),
    participant_id uuid NOT NULL REFERENCES public.participants(id),
    event_id uuid NOT NULL REFERENCES public.events(id),
    amount integer NOT NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    refund_reference text,
    rejection_reason text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    requested_at timestamp with time zone NOT NULL DEFAULT now(),
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
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'info',
    target_segment text NOT NULL DEFAULT 'all',
    sent_count integer NOT NULL DEFAULT 0,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Blocked IPs Table
CREATE TABLE public.blocked_ips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address text NOT NULL,
    reason text NOT NULL,
    notes text,
    expires_at timestamp with time zone,
    is_active boolean NOT NULL DEFAULT true,
    blocked_by uuid NOT NULL,
    blocked_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Blocked Users Table
CREATE TABLE public.blocked_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    reason text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    blocked_by uuid NOT NULL,
    blocked_at timestamp with time zone NOT NULL DEFAULT now(),
    unblocked_at timestamp with time zone
);

-- Login Attempts Table
CREATE TABLE public.login_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address text NOT NULL,
    email text,
    success boolean NOT NULL DEFAULT false,
    user_agent text,
    attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Login Logs Table
CREATE TABLE public.login_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    email text NOT NULL,
    ip_address text,
    user_agent text,
    city text,
    country text,
    latitude numeric,
    longitude numeric,
    login_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Contact Messages Table
CREATE TABLE public.contact_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Broadcast Emails Table
CREATE TABLE public.broadcast_emails (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject text NOT NULL,
    content text NOT NULL,
    segment text NOT NULL DEFAULT 'all',
    status text NOT NULL DEFAULT 'pending',
    is_ab_test boolean NOT NULL DEFAULT false,
    subject_variant_a text,
    subject_variant_b text,
    variant_a_sent integer NOT NULL DEFAULT 0,
    variant_b_sent integer NOT NULL DEFAULT 0,
    variant_a_opened integer NOT NULL DEFAULT 0,
    variant_b_opened integer NOT NULL DEFAULT 0,
    winner_variant text,
    winner_determined_at timestamp with time zone,
    determination_period_hours integer DEFAULT 24,
    total_recipients integer NOT NULL DEFAULT 0,
    delivered_count integer NOT NULL DEFAULT 0,
    opened_count integer NOT NULL DEFAULT 0,
    failed_count integer NOT NULL DEFAULT 0,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Scheduled Broadcasts Table
CREATE TABLE public.scheduled_broadcasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject text NOT NULL,
    content text NOT NULL,
    segment text NOT NULL DEFAULT 'all',
    recipient_ids text[] NOT NULL DEFAULT '{}',
    scheduled_for timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    broadcast_id uuid REFERENCES public.broadcast_emails(id),
    processed_at timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Email Templates Table
CREATE TABLE public.email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Email Tracking Table
CREATE TABLE public.email_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id uuid NOT NULL REFERENCES public.broadcast_emails(id),
    recipient_email text NOT NULL,
    variant text,
    opened_at timestamp with time zone,
    open_count integer NOT NULL DEFAULT 0,
    ip_address text,
    user_agent text,
    city text,
    country text,
    latitude numeric,
    longitude numeric,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Email Link Clicks Table
CREATE TABLE public.email_link_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id uuid NOT NULL REFERENCES public.broadcast_emails(id),
    tracking_id uuid REFERENCES public.email_tracking(id),
    recipient_email text NOT NULL,
    original_url text NOT NULL,
    ip_address text,
    user_agent text,
    city text,
    country text,
    latitude numeric,
    longitude numeric,
    clicked_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Push Subscriptions Table
CREATE TABLE public.push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key for referral_codes to affiliate_tiers
ALTER TABLE public.referral_codes
ADD CONSTRAINT referral_codes_tier_id_fkey
FOREIGN KEY (tier_id) REFERENCES public.affiliate_tiers(id);
