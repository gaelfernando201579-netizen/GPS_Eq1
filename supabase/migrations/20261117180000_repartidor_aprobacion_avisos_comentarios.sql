CREATE TABLE IF NOT EXISTS public.solicitudes_repartidor (
  id_solicitud BIGSERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  numero_control VARCHAR(30) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  zonas VARCHAR(250) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Aprobada','Rechazada')),
  comentario_revision VARCHAR(500),
  id_moderador INTEGER REFERENCES public.usuarios(id_usuario),
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_revision TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_solicitudes_repartidor_pendientes ON public.solicitudes_repartidor(estado,fecha_solicitud);
CREATE TABLE IF NOT EXISTS public.avisos_productos_descartados (
  id_usuario INTEGER NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES public.productos(id_producto) ON DELETE CASCADE,
  fecha_descarte TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id_usuario,id_producto)
);
CREATE TABLE IF NOT EXISTS public.reparto_reasignaciones (
  id_reasignacion BIGSERIAL PRIMARY KEY,
  id_pedido INTEGER NOT NULL REFERENCES public.pedidos(id_pedido) ON DELETE CASCADE,
  id_repartidor_anterior INTEGER NOT NULL REFERENCES public.usuarios(id_usuario),
  id_vendedor INTEGER NOT NULL REFERENCES public.usuarios(id_usuario),
  motivo VARCHAR(500) NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reasignacion_por_pedido ON public.reparto_reasignaciones(id_pedido,id_repartidor_anterior);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS comentario_entrega_comprador TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS comentario_entrega_vendedor TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS comentario_entrega_repartidor TEXT;
REVOKE ALL ON public.solicitudes_repartidor,public.avisos_productos_descartados,public.reparto_reasignaciones FROM anon,authenticated;
