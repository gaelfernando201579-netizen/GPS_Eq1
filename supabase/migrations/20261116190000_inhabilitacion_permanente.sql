ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS inhabilitado_permanente BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fecha_inhabilitacion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_inhabilitacion TEXT,
  ADD COLUMN IF NOT EXISTS origen_inhabilitacion VARCHAR(30),
  ADD COLUMN IF NOT EXISTS id_usuario_inhabilitacion INTEGER REFERENCES public.usuarios(id_usuario);

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS oculto_por_retiro_vendedor BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_productos_visibles_campy
  ON public.productos(id_vendedor, id_producto)
  WHERE inhabilitado_permanente = FALSE;

CREATE INDEX IF NOT EXISTS idx_pedidos_visibles_campy
  ON public.pedidos(id_vendedor, id_comprador)
  WHERE oculto_por_retiro_vendedor = FALSE;

CREATE OR REPLACE FUNCTION public.impedir_reactivar_publicacion_campy()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.inhabilitado_permanente AND NOT NEW.inhabilitado_permanente THEN
    RAISE EXCEPTION 'Esta publicación quedó inhabilitada permanentemente';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_impedir_reactivar_publicacion_campy ON public.productos;
CREATE TRIGGER trg_impedir_reactivar_publicacion_campy
BEFORE UPDATE ON public.productos
FOR EACH ROW EXECUTE FUNCTION public.impedir_reactivar_publicacion_campy();

CREATE OR REPLACE FUNCTION public.impedir_mostrar_pedido_archivado_campy()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.oculto_por_retiro_vendedor AND NOT NEW.oculto_por_retiro_vendedor THEN
    RAISE EXCEPTION 'Este pedido quedó archivado por retiro del vendedor';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_impedir_mostrar_pedido_archivado_campy ON public.pedidos;
CREATE TRIGGER trg_impedir_mostrar_pedido_archivado_campy
BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.impedir_mostrar_pedido_archivado_campy();
