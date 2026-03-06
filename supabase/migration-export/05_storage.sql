-- =============================================
-- PART 6: STORAGE BUCKETS
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('prize-images', 'prize-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-logos', 'certificate-logos', true);

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Prize Images Policies
CREATE POLICY "Anyone can view prize images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'prize-images');

CREATE POLICY "Authenticated users can upload prize images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'prize-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their prize images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'prize-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their prize images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'prize-images' AND auth.role() = 'authenticated');

-- Event Images Policies
CREATE POLICY "Anyone can view event images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their event images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their event images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- Payment Proofs Policies
CREATE POLICY "Anyone can view payment proofs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can upload payment proofs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

-- Certificate Logos Policies
CREATE POLICY "Anyone can view certificate logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'certificate-logos');

CREATE POLICY "Authenticated users can upload certificate logos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'certificate-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their certificate logos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'certificate-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their certificate logos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'certificate-logos' AND auth.role() = 'authenticated');
