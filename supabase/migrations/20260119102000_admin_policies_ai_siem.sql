-- Restrict AI provider and SIEM integration writes to admins only

-- ai_providers
DROP POLICY IF EXISTS "Users can create their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can update their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can delete their own AI providers" ON public.ai_providers;

CREATE POLICY "Admins can insert AI providers"
ON public.ai_providers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update AI providers"
ON public.ai_providers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete AI providers"
ON public.ai_providers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- siem_integrations
DROP POLICY IF EXISTS "Users can create their own SIEM integrations" ON public.siem_integrations;
DROP POLICY IF EXISTS "Users can update their own SIEM integrations" ON public.siem_integrations;
DROP POLICY IF EXISTS "Users can delete their own SIEM integrations" ON public.siem_integrations;

CREATE POLICY "Admins can insert SIEM integrations"
ON public.siem_integrations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update SIEM integrations"
ON public.siem_integrations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete SIEM integrations"
ON public.siem_integrations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);
