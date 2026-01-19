-- Admin-only write access for shared catalog tables

-- default_frameworks
DROP POLICY IF EXISTS "Admins can insert default frameworks" ON public.default_frameworks;
DROP POLICY IF EXISTS "Admins can update default frameworks" ON public.default_frameworks;
DROP POLICY IF EXISTS "Admins can delete default frameworks" ON public.default_frameworks;

CREATE POLICY "Admins can insert default frameworks"
ON public.default_frameworks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update default frameworks"
ON public.default_frameworks
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
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete default frameworks"
ON public.default_frameworks
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

-- default_questions
DROP POLICY IF EXISTS "Admins can insert default questions" ON public.default_questions;
DROP POLICY IF EXISTS "Admins can update default questions" ON public.default_questions;
DROP POLICY IF EXISTS "Admins can delete default questions" ON public.default_questions;

CREATE POLICY "Admins can insert default questions"
ON public.default_questions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update default questions"
ON public.default_questions
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
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete default questions"
ON public.default_questions
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

-- domains
DROP POLICY IF EXISTS "Admins can insert domains" ON public.domains;
DROP POLICY IF EXISTS "Admins can update domains" ON public.domains;
DROP POLICY IF EXISTS "Admins can delete domains" ON public.domains;

CREATE POLICY "Admins can insert domains"
ON public.domains
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update domains"
ON public.domains
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
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete domains"
ON public.domains
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

-- subcategories
DROP POLICY IF EXISTS "Admins can insert subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Admins can update subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Admins can delete subcategories" ON public.subcategories;

CREATE POLICY "Admins can insert subcategories"
ON public.subcategories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update subcategories"
ON public.subcategories
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
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete subcategories"
ON public.subcategories
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

-- security_domains
DROP POLICY IF EXISTS "Admins can insert security domains" ON public.security_domains;
DROP POLICY IF EXISTS "Admins can update security domains" ON public.security_domains;
DROP POLICY IF EXISTS "Admins can delete security domains" ON public.security_domains;

CREATE POLICY "Admins can insert security domains"
ON public.security_domains
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update security domains"
ON public.security_domains
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
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete security domains"
ON public.security_domains
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
