-- =============================================
-- PART 3: DATABASE FUNCTIONS
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

-- Function: Has Role (check if user has a specific role)
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

-- Function: Has Org Role (check if user has a specific role in organization)
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
