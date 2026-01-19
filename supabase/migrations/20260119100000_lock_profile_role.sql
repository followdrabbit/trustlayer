-- Prevent role escalation via profile updates/inserts from authenticated users
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NOT NULL
       AND NEW.role <> 'user'
       AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'Profile role inserts are restricted';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'Profile role updates are restricted';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_change ON public.profiles;
CREATE TRIGGER prevent_profile_role_change
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_change();
