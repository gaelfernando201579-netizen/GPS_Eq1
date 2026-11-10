-- Campy: aprobaciones para convertirse en vendedor.
CREATE TABLE IF NOT EXISTS public.solicitudes_vendedor (
    id_solicitud BIGSERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    numero_control VARCHAR(30) NOT NULL,
    nombre_tienda VARCHAR(120) NOT NULL,
    giro VARCHAR(200) NOT NULL,
    ubicacion VARCHAR(200) NOT NULL,
    matriz_horario JSONB NOT NULL DEFAULT '{}'::jsonb,
    horario_resumen TEXT NOT NULL,
    nota_horario TEXT NOT NULL DEFAULT '',
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
      CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada')),
    comentario_revision TEXT,
    id_moderador INTEGER REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_revision TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_vendedor_estado_fecha
  ON public.solicitudes_vendedor (estado, fecha_solicitud);
