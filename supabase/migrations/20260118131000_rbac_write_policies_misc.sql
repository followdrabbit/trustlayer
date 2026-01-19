-- Restrict write policies to non-viewer roles for user-scoped tables

-- assessment_meta writes
DROP POLICY IF EXISTS "Users can insert own assessment meta" ON public.assessment_meta;
DROP POLICY IF EXISTS "Users can update own assessment meta" ON public.assessment_meta;
DROP POLICY IF EXISTS "Users can delete own assessment meta" ON public.assessment_meta;

CREATE POLICY "Users can insert own assessment meta"
ON public.assessment_meta
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

CREATE POLICY "Users can update own assessment meta"
ON public.assessment_meta
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

CREATE POLICY "Users can delete own assessment meta"
ON public.assessment_meta
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

-- custom_frameworks writes
DROP POLICY IF EXISTS "Users can insert own custom frameworks" ON public.custom_frameworks;
DROP POLICY IF EXISTS "Users can update own custom frameworks" ON public.custom_frameworks;
DROP POLICY IF EXISTS "Users can delete own custom frameworks" ON public.custom_frameworks;

CREATE POLICY "Users can insert own custom frameworks"
ON public.custom_frameworks
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

CREATE POLICY "Users can update own custom frameworks"
ON public.custom_frameworks
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

CREATE POLICY "Users can delete own custom frameworks"
ON public.custom_frameworks
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

-- custom_questions writes
DROP POLICY IF EXISTS "Users can insert own custom questions" ON public.custom_questions;
DROP POLICY IF EXISTS "Users can update own custom questions" ON public.custom_questions;
DROP POLICY IF EXISTS "Users can delete own custom questions" ON public.custom_questions;

CREATE POLICY "Users can insert own custom questions"
ON public.custom_questions
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

CREATE POLICY "Users can update own custom questions"
ON public.custom_questions
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

CREATE POLICY "Users can delete own custom questions"
ON public.custom_questions
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

-- disabled_frameworks writes
DROP POLICY IF EXISTS "Users can insert own disabled frameworks" ON public.disabled_frameworks;
DROP POLICY IF EXISTS "Users can delete own disabled frameworks" ON public.disabled_frameworks;

CREATE POLICY "Users can insert own disabled frameworks"
ON public.disabled_frameworks
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

CREATE POLICY "Users can delete own disabled frameworks"
ON public.disabled_frameworks
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

-- disabled_questions writes
DROP POLICY IF EXISTS "Users can insert own disabled questions" ON public.disabled_questions;
DROP POLICY IF EXISTS "Users can delete own disabled questions" ON public.disabled_questions;

CREATE POLICY "Users can insert own disabled questions"
ON public.disabled_questions
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

CREATE POLICY "Users can delete own disabled questions"
ON public.disabled_questions
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

-- chart_annotations writes
DROP POLICY IF EXISTS "Users can insert own annotations" ON public.chart_annotations;
DROP POLICY IF EXISTS "Users can update own annotations" ON public.chart_annotations;
DROP POLICY IF EXISTS "Users can delete own annotations" ON public.chart_annotations;

CREATE POLICY "Users can insert own annotations"
ON public.chart_annotations
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

CREATE POLICY "Users can update own annotations"
ON public.chart_annotations
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

CREATE POLICY "Users can delete own annotations"
ON public.chart_annotations
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

-- maturity_snapshots writes
DROP POLICY IF EXISTS "Users can insert own maturity snapshots" ON public.maturity_snapshots;
DROP POLICY IF EXISTS "Users can update own maturity snapshots" ON public.maturity_snapshots;
DROP POLICY IF EXISTS "Users can delete own maturity snapshots" ON public.maturity_snapshots;

CREATE POLICY "Users can insert own maturity snapshots"
ON public.maturity_snapshots
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

CREATE POLICY "Users can update own maturity snapshots"
ON public.maturity_snapshots
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

CREATE POLICY "Users can delete own maturity snapshots"
ON public.maturity_snapshots
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

-- question_versions writes
DROP POLICY IF EXISTS "Users can insert own question versions" ON public.question_versions;
DROP POLICY IF EXISTS "Users can update own question versions" ON public.question_versions;
DROP POLICY IF EXISTS "Users can delete own question versions" ON public.question_versions;

CREATE POLICY "Users can insert own question versions"
ON public.question_versions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = changed_by
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'analyst', 'user')
  )
);

CREATE POLICY "Users can update own question versions"
ON public.question_versions
FOR UPDATE
TO authenticated
USING (
  auth.uid()::text = changed_by
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'analyst', 'user')
  )
)
WITH CHECK (
  auth.uid()::text = changed_by
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'analyst', 'user')
  )
);

CREATE POLICY "Users can delete own question versions"
ON public.question_versions
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = changed_by
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'analyst', 'user')
  )
);
