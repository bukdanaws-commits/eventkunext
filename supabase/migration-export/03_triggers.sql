-- =============================================
-- PART 4: TRIGGERS
-- =============================================

-- Trigger: Update updated_at for organizations
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for user_bank_info
CREATE TRIGGER update_user_bank_info_updated_at
    BEFORE UPDATE ON public.user_bank_info
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for events
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for event_payments
CREATE TRIGGER update_event_payments_updated_at
    BEFORE UPDATE ON public.event_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for ticket_tiers
CREATE TRIGGER update_ticket_tiers_updated_at
    BEFORE UPDATE ON public.ticket_tiers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for participants
CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON public.participants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for participant_payments
CREATE TRIGGER update_participant_payments_updated_at
    BEFORE UPDATE ON public.participant_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for prizes
CREATE TRIGGER update_prizes_updated_at
    BEFORE UPDATE ON public.prizes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for event_forms
CREATE TRIGGER update_event_forms_updated_at
    BEFORE UPDATE ON public.event_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for certificate_templates
CREATE TRIGGER update_certificate_templates_updated_at
    BEFORE UPDATE ON public.certificate_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for referral_codes
CREATE TRIGGER update_referral_codes_updated_at
    BEFORE UPDATE ON public.referral_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for affiliate_goals
CREATE TRIGGER update_affiliate_goals_updated_at
    BEFORE UPDATE ON public.affiliate_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for commissions
CREATE TRIGGER update_commissions_updated_at
    BEFORE UPDATE ON public.commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for eo_bank_settings
CREATE TRIGGER update_eo_bank_settings_updated_at
    BEFORE UPDATE ON public.eo_bank_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for eo_payouts
CREATE TRIGGER update_eo_payouts_updated_at
    BEFORE UPDATE ON public.eo_payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for refund_requests
CREATE TRIGGER update_refund_requests_updated_at
    BEFORE UPDATE ON public.refund_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for email_templates
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto create participant benefits when tier is assigned
CREATE TRIGGER trigger_auto_create_participant_benefits
    AFTER INSERT OR UPDATE OF tier_id ON public.participants
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_participant_benefits();

-- Trigger: Update tier sold count when participant is created
CREATE TRIGGER trigger_update_tier_sold_count
    AFTER INSERT OR UPDATE OF tier_id ON public.participants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tier_sold_count();

-- Trigger: Handle new user registration (on auth.users)
-- NOTE: This trigger must be created on auth.users table
-- Run this in Supabase SQL Editor:
/*
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
*/
