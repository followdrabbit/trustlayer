-- Remove demo-only policies and data artifacts for enterprise builds

DROP POLICY IF EXISTS "Allow public read access to maturity snapshots" ON public.maturity_snapshots;
DROP POLICY IF EXISTS "Allow public insert to maturity snapshots" ON public.maturity_snapshots;

DO $$
DECLARE demo_id uuid;
BEGIN
  SELECT id INTO demo_id FROM auth.users WHERE email = 'demo@aiassess.app';
  IF demo_id IS NOT NULL THEN
    UPDATE public.maturity_snapshots
    SET user_id = NULL
    WHERE user_id = demo_id;

    DELETE FROM public.profiles
    WHERE user_id = demo_id OR email = 'demo@aiassess.app';

    DELETE FROM auth.users
    WHERE id = demo_id;
  END IF;
END $$;
