ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS clave_creacion VARCHAR(80);
CREATE UNIQUE INDEX IF NOT EXISTS uq_productos_clave_creacion ON public.productos(clave_creacion) WHERE clave_creacion IS NOT NULL;
