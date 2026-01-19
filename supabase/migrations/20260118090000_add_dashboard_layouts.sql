-- Dashboard layouts for modular dashboards
CREATE TABLE public.dashboard_layouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_key text NOT NULL,
  layout jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX dashboard_layouts_dashboard_key_idx
  ON public.dashboard_layouts (dashboard_key);

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dashboard layouts are readable"
ON public.dashboard_layouts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert dashboard layouts"
ON public.dashboard_layouts
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

CREATE POLICY "Admins can update dashboard layouts"
ON public.dashboard_layouts
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

CREATE POLICY "Admins can delete dashboard layouts"
ON public.dashboard_layouts
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

CREATE TRIGGER update_dashboard_layouts_updated_at
BEFORE UPDATE ON public.dashboard_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
