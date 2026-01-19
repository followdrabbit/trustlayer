-- Restrict answer writes to non-viewer roles
DROP POLICY IF EXISTS "Users can insert own answers" ON public.answers;
DROP POLICY IF EXISTS "Users can update own answers" ON public.answers;
DROP POLICY IF EXISTS "Users can delete own answers" ON public.answers;

CREATE POLICY "Users can insert own answers"
ON public.answers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'analyst', 'user')
  )
);

CREATE POLICY "Users can update own answers"
ON public.answers
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'analyst', 'user')
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'analyst', 'user')
  )
);

CREATE POLICY "Users can delete own answers"
ON public.answers
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'analyst', 'user')
  )
);
