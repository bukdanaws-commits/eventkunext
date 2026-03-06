-- =============================================
-- PART 5: ROW LEVEL SECURITY (RLS) POLICIES
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

-- =============================================
-- ORGANIZATIONS POLICIES
-- =============================================
CREATE POLICY "Users can view their organization"
    ON public.organizations FOR SELECT
    USING (user_belongs_to_org(auth.uid(), id));

CREATE POLICY "Owners can update their organization"
    ON public.organizations FOR UPDATE
    USING (has_org_role(auth.uid(), id, 'owner'));

-- =============================================
-- USER PROFILES POLICIES
-- =============================================
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- USER ROLES POLICIES
-- =============================================
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- USER BANK INFO POLICIES
-- =============================================
CREATE POLICY "Users can view their own bank info"
    ON public.user_bank_info FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bank info"
    ON public.user_bank_info FOR ALL
    USING (auth.uid() = user_id);

-- =============================================
-- EVENTS POLICIES
-- =============================================
CREATE POLICY "Users can view events in their organization"
    ON public.events FOR SELECT
    USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can create events in their organization"
    ON public.events FOR INSERT
    WITH CHECK (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Owners can update events"
    ON public.events FOR UPDATE
    USING (has_org_role(auth.uid(), organization_id, 'owner'));

CREATE POLICY "Owners can delete events"
    ON public.events FOR DELETE
    USING (has_org_role(auth.uid(), organization_id, 'owner'));

CREATE POLICY "Admins can view all events"
    ON public.events FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create events for any organization"
    ON public.events FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all events"
    ON public.events FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all events"
    ON public.events FOR DELETE
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view events by slug"
    ON public.events FOR SELECT
    USING (public_viewer_slug IS NOT NULL);

CREATE POLICY "Scanners can view assigned events"
    ON public.events FOR SELECT
    USING (is_event_scanner(auth.uid(), id));

-- =============================================
-- PRICING TIERS POLICIES
-- =============================================
CREATE POLICY "Anyone can view pricing tiers"
    ON public.pricing_tiers FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert pricing tiers"
    ON public.pricing_tiers FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pricing tiers"
    ON public.pricing_tiers FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pricing tiers"
    ON public.pricing_tiers FOR DELETE
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- EVENT PAYMENTS POLICIES
-- =============================================
CREATE POLICY "Users can view payments in their organization"
    ON public.event_payments FOR SELECT
    USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can create payments"
    ON public.event_payments FOR INSERT
    WITH CHECK (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can update payments in their organization"
    ON public.event_payments FOR UPDATE
    USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can view all payments"
    ON public.event_payments FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all payments"
    ON public.event_payments FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- TICKET TIERS POLICIES
-- =============================================
CREATE POLICY "Users can manage tiers in their events"
    ON public.ticket_tiers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = ticket_tiers.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Public can view active tiers for public events"
    ON public.ticket_tiers FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = ticket_tiers.event_id
        AND is_active = true
        AND (e.public_viewer_slug IS NOT NULL OR e.form_addon_purchased = true)
    ));

-- =============================================
-- BENEFIT ITEMS POLICIES
-- =============================================
CREATE POLICY "Users can manage benefits in their events"
    ON public.benefit_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM ticket_tiers tt
        JOIN events e ON e.id = tt.event_id
        WHERE tt.id = benefit_items.tier_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Public can view benefits for public tiers"
    ON public.benefit_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM ticket_tiers tt
        JOIN events e ON e.id = tt.event_id
        WHERE tt.id = benefit_items.tier_id
        AND tt.is_active = true
        AND (e.public_viewer_slug IS NOT NULL OR e.form_addon_purchased = true)
    ));

-- =============================================
-- PARTICIPANTS POLICIES
-- =============================================
CREATE POLICY "Users can view participants in their events"
    ON public.participants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = participants.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Users can manage participants in their events"
    ON public.participants FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = participants.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Public form submissions can create participants"
    ON public.participants FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM events e
        JOIN event_forms ef ON ef.event_id = e.id
        WHERE e.id = ef.event_id
        AND e.form_addon_purchased = true
        AND ef.is_published = true
    ));

CREATE POLICY "Scanners can view participants in assigned events"
    ON public.participants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM event_scanners es
        WHERE es.event_id = participants.event_id
        AND es.user_id = auth.uid()
        AND es.is_active = true
    ));

CREATE POLICY "Scanners can check-in participants"
    ON public.participants FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM event_scanners es
        WHERE es.event_id = participants.event_id
        AND es.user_id = auth.uid()
        AND es.is_active = true
    ));

-- =============================================
-- PARTICIPANT BENEFITS POLICIES
-- =============================================
CREATE POLICY "Event owners can manage participant benefits"
    ON public.participant_benefits FOR ALL
    USING (EXISTS (
        SELECT 1 FROM participants p
        JOIN events e ON e.id = p.event_id
        WHERE p.id = participant_benefits.participant_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Participants can view their own benefits"
    ON public.participant_benefits FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM participants p
        WHERE p.id = participant_benefits.participant_id
        AND p.auth_user_id = auth.uid()
    ));

CREATE POLICY "Scanners can view and redeem benefits"
    ON public.participant_benefits FOR ALL
    USING (EXISTS (
        SELECT 1 FROM participants p
        JOIN event_scanners es ON es.event_id = p.event_id
        WHERE p.id = participant_benefits.participant_id
        AND es.user_id = auth.uid()
        AND es.is_active = true
    ));

-- =============================================
-- PARTICIPANT PAYMENTS POLICIES
-- =============================================
CREATE POLICY "Event owners can manage payments"
    ON public.participant_payments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events e
        JOIN user_roles ur ON ur.organization_id = e.organization_id
        WHERE e.id = participant_payments.event_id
        AND ur.user_id = auth.uid()
    ));

CREATE POLICY "Participants can view own payments"
    ON public.participant_payments FOR SELECT
    USING (
        participant_id IN (
            SELECT id FROM participants WHERE auth_user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM events e
            JOIN user_roles ur ON ur.organization_id = e.organization_id
            WHERE e.id = participant_payments.event_id
            AND ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create payment during registration"
    ON public.participant_payments FOR INSERT
    WITH CHECK (true);

-- =============================================
-- PRIZES POLICIES
-- =============================================
CREATE POLICY "Users can manage prizes in their events"
    ON public.prizes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = prizes.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Public can view prizes for public events"
    ON public.prizes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = prizes.event_id
        AND e.public_viewer_slug IS NOT NULL
    ));

-- =============================================
-- WINNERS POLICIES
-- =============================================
CREATE POLICY "Users can manage winners in their events"
    ON public.winners FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = winners.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Public can view winners for public events"
    ON public.winners FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = winners.event_id
        AND e.public_viewer_slug IS NOT NULL
    ));

CREATE POLICY "Admins can view all winners"
    ON public.winners FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- PRIZE AUDIT LOGS POLICIES
-- =============================================
CREATE POLICY "Users can view prize audit logs in their events"
    ON public.prize_audit_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = prize_audit_logs.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Users can insert prize audit logs"
    ON public.prize_audit_logs FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = prize_audit_logs.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

-- =============================================
-- EVENT FORMS POLICIES
-- =============================================
CREATE POLICY "Users can view forms in their events"
    ON public.event_forms FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_forms.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Users can manage forms in their events"
    ON public.event_forms FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_forms.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Public can view published forms"
    ON public.event_forms FOR SELECT
    USING (is_published = true);

-- =============================================
-- FORM FIELDS POLICIES
-- =============================================
CREATE POLICY "Users can view form fields"
    ON public.form_fields FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM event_forms ef
        JOIN events e ON e.id = ef.event_id
        WHERE ef.id = form_fields.form_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Users can manage form fields"
    ON public.form_fields FOR ALL
    USING (EXISTS (
        SELECT 1 FROM event_forms ef
        JOIN events e ON e.id = ef.event_id
        WHERE ef.id = form_fields.form_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Public can view fields of published forms"
    ON public.form_fields FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM event_forms ef
        WHERE ef.id = form_fields.form_id
        AND ef.is_published = true
    ));

-- =============================================
-- FORM SUBMISSIONS POLICIES
-- =============================================
CREATE POLICY "Users can view submissions in their events"
    ON public.form_submissions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM event_forms ef
        JOIN events e ON e.id = ef.event_id
        WHERE ef.id = form_submissions.form_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Public can submit to published forms"
    ON public.form_submissions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM event_forms ef
        WHERE ef.id = form_submissions.form_id
        AND ef.is_published = true
    ));

-- =============================================
-- EVENT SCANNERS POLICIES
-- =============================================
CREATE POLICY "Users can manage scanners in their events"
    ON public.event_scanners FOR ALL
    USING (can_manage_event_scanners(auth.uid(), event_id))
    WITH CHECK (can_manage_event_scanners(auth.uid(), event_id));

CREATE POLICY "Scanners can view their own assignment"
    ON public.event_scanners FOR SELECT
    USING (user_id = auth.uid());

-- =============================================
-- QR EMAIL LOGS POLICIES
-- =============================================
CREATE POLICY "Users can manage qr email logs"
    ON public.qr_email_logs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM participants p
        JOIN events e ON e.id = p.event_id
        WHERE p.id = qr_email_logs.participant_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

-- =============================================
-- CERTIFICATE TEMPLATES POLICIES
-- =============================================
CREATE POLICY "Users can view templates in their events"
    ON public.certificate_templates FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = certificate_templates.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Users can manage templates in their events"
    ON public.certificate_templates FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = certificate_templates.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Admins can manage all templates"
    ON public.certificate_templates FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- REFERRAL CODES POLICIES
-- =============================================
CREATE POLICY "Users can view their own referral codes"
    ON public.referral_codes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes"
    ON public.referral_codes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view referral codes for validation"
    ON public.referral_codes FOR SELECT
    USING (true);

-- =============================================
-- REFERRALS POLICIES
-- =============================================
CREATE POLICY "Users can view their referrals"
    ON public.referrals FOR SELECT
    USING (referrer_id = auth.uid() OR referee_id = auth.uid());

-- =============================================
-- AFFILIATE TIERS POLICIES
-- =============================================
CREATE POLICY "Anyone can view affiliate tiers"
    ON public.affiliate_tiers FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert affiliate tiers"
    ON public.affiliate_tiers FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update affiliate tiers"
    ON public.affiliate_tiers FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete affiliate tiers"
    ON public.affiliate_tiers FOR DELETE
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- AFFILIATE GOALS POLICIES
-- =============================================
CREATE POLICY "Users can view their own goals"
    ON public.affiliate_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
    ON public.affiliate_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON public.affiliate_goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all goals"
    ON public.affiliate_goals FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all goals"
    ON public.affiliate_goals FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- AFFILIATE NOTIFICATIONS POLICIES
-- =============================================
CREATE POLICY "Users can view their own notifications"
    ON public.affiliate_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.affiliate_notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
    ON public.affiliate_notifications FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all notifications"
    ON public.affiliate_notifications FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- COMMISSIONS POLICIES
-- =============================================
CREATE POLICY "Users can view their commissions"
    ON public.commissions FOR SELECT
    USING (referrer_id = auth.uid());

CREATE POLICY "Admins can view all commissions"
    ON public.commissions FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update commissions"
    ON public.commissions FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete commissions"
    ON public.commissions FOR DELETE
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- EO BANK SETTINGS POLICIES
-- =============================================
CREATE POLICY "Users can view their org bank settings"
    ON public.eo_bank_settings FOR SELECT
    USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can manage their org bank settings"
    ON public.eo_bank_settings FOR ALL
    USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage all bank settings"
    ON public.eo_bank_settings FOR ALL
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can verify bank settings"
    ON public.eo_bank_settings FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- EO PAYOUTS POLICIES
-- =============================================
CREATE POLICY "Users can view payouts for their org"
    ON public.eo_payouts FOR SELECT
    USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage all payouts"
    ON public.eo_payouts FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- REFUND REQUESTS POLICIES
-- =============================================
CREATE POLICY "Event owners can manage refund requests"
    ON public.refund_requests FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = refund_requests.event_id
        AND user_belongs_to_org(auth.uid(), e.organization_id)
    ));

CREATE POLICY "Admins can manage all refund requests"
    ON public.refund_requests FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- ADMIN AUDIT LOGS POLICIES
-- =============================================
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'));

-- =============================================
-- ADMIN NOTIFICATIONS POLICIES
-- =============================================
CREATE POLICY "Admins can view notifications"
    ON public.admin_notifications FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage notifications"
    ON public.admin_notifications FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- BLOCKED IPS POLICIES
-- =============================================
CREATE POLICY "Admins can view blocked IPs"
    ON public.blocked_ips FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert blocked IPs"
    ON public.blocked_ips FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blocked IPs"
    ON public.blocked_ips FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blocked IPs"
    ON public.blocked_ips FOR DELETE
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- BLOCKED USERS POLICIES
-- =============================================
CREATE POLICY "Admins can view blocked users"
    ON public.blocked_users FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage blocked users"
    ON public.blocked_users FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- LOGIN ATTEMPTS POLICIES
-- =============================================
CREATE POLICY "Service can insert login attempts"
    ON public.login_attempts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view login attempts"
    ON public.login_attempts FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- LOGIN LOGS POLICIES
-- =============================================
CREATE POLICY "Allow insert login logs"
    ON public.login_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view own login logs"
    ON public.login_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login logs"
    ON public.login_logs FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- CONTACT MESSAGES POLICIES
-- =============================================
CREATE POLICY "Anyone can submit contact messages"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
    ON public.contact_messages FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contact messages"
    ON public.contact_messages FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contact messages"
    ON public.contact_messages FOR DELETE
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- BROADCAST EMAILS POLICIES
-- =============================================
CREATE POLICY "Admins can view broadcast emails"
    ON public.broadcast_emails FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage broadcast emails"
    ON public.broadcast_emails FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- SCHEDULED BROADCASTS POLICIES
-- =============================================
CREATE POLICY "Admins can manage scheduled broadcasts"
    ON public.scheduled_broadcasts FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- EMAIL TEMPLATES POLICIES
-- =============================================
CREATE POLICY "Admins can view email templates"
    ON public.email_templates FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email templates"
    ON public.email_templates FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- EMAIL TRACKING POLICIES
-- =============================================
CREATE POLICY "Admins can view email tracking"
    ON public.email_tracking FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- EMAIL LINK CLICKS POLICIES
-- =============================================
CREATE POLICY "Admins can view link clicks"
    ON public.email_link_clicks FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- PUSH SUBSCRIPTIONS POLICIES
-- =============================================
CREATE POLICY "Users can manage their own subscriptions"
    ON public.push_subscriptions FOR ALL
    USING (auth.uid() = user_id);
