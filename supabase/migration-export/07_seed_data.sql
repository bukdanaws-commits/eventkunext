-- =============================================
-- PART 8: SEED DATA (Pricing Tiers & Affiliate Tiers)
-- =============================================

-- Insert Pricing Tiers
INSERT INTO public.pricing_tiers (tier, name, price, max_participants, max_hiburan, max_utama, max_grand_prize, form_addon_price)
VALUES 
    ('free', 'Free', 0, 50, 5, 2, 1, 0),
    ('basic', 'Basic', 99000, 200, 15, 5, 2, 49000),
    ('pro', 'Pro', 299000, 500, 30, 10, 5, 99000),
    ('enterprise', 'Enterprise', 799000, 2000, 100, 30, 15, 199000);

-- Insert Affiliate Tiers
INSERT INTO public.affiliate_tiers (name, commission_percentage, min_conversions)
VALUES 
    ('Bronze', 10.00, 0),
    ('Silver', 12.50, 5),
    ('Gold', 15.00, 15),
    ('Platinum', 20.00, 30);
