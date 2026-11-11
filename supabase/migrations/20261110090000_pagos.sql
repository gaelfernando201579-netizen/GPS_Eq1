-- Ejecutar después de contar con public.usuarios, public.pedidos y public.detalle_pedido.
-- No convierte los pedidos históricos en pagos confirmados.
CREATE TABLE public.configuracion_comisiones (
 id BIGSERIAL PRIMARY KEY, comision_fija NUMERIC(12,2) NOT NULL CHECK(comision_fija>=0),
 moneda CHAR(3) NOT NULL DEFAULT 'MXN' CHECK(moneda='MXN'),
 fecha_inicio_vigencia TIMESTAMPTZ NOT NULL DEFAULT now(), activo BOOLEAN NOT NULL DEFAULT true,
 fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX config_comision_unica_activa ON public.configuracion_comisiones(activo) WHERE activo;
INSERT INTO public.configuracion_comisiones(comision_fija) VALUES (2.00);
CREATE TABLE public.pagos (
 id BIGSERIAL PRIMARY KEY,
 pedido_id INTEGER NOT NULL UNIQUE REFERENCES public.pedidos(id_pedido) ON DELETE RESTRICT,
 comprador_id INTEGER NOT NULL REFERENCES public.usuarios(id_usuario),
 monto_esperado NUMERIC(12,2) NOT NULL CHECK(monto_esperado>=0),
 monto_detectado NUMERIC(12,2),
 comision_unitaria NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(comision_unitaria>=0),
 comision_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(comision_total>=0),
 importe_vendedor NUMERIC(12,2) NOT NULL CHECK(importe_vendedor>=0),
 tarifa_entrega NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(tarifa_entrega>=0),
 repartidor_id INTEGER REFERENCES public.usuarios(id_usuario),
 comprobante_clave TEXT,
 comprobante_mime VARCHAR(40), comprobante_sha256 VARCHAR(64),
 clave_rastreo TEXT, banco_emisor TEXT, banco_receptor TEXT, cuenta_beneficiaria_detectada TEXT,
 fecha_transferencia DATE,
 estado VARCHAR(45) NOT NULL DEFAULT 'Pendiente' CHECK(estado IN ('Pendiente','Analizando','En_verificacion','Pendiente_confirmacion_bancaria','Confirmado','Rechazado','Revision_manual')),
 cep_validado BOOLEAN NOT NULL DEFAULT false,
 resultado_ia JSONB, motivo_revision TEXT,
 evidencia_bancaria TEXT, confirmado_por INTEGER REFERENCES public.usuarios(id_usuario),
 fecha_confirmacion TIMESTAMPTZ,
 fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(), fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (importe_vendedor+comision_total+tarifa_entrega=monto_esperado),
 CHECK (estado <> 'Confirmado' OR (evidencia_bancaria IS NOT NULL AND confirmado_por IS NOT NULL))
);
CREATE UNIQUE INDEX pagos_clave_rastreo_unica ON public.pagos (lower(btrim(clave_rastreo))) WHERE clave_rastreo IS NOT NULL AND btrim(clave_rastreo)<>'';
CREATE INDEX pagos_estado_fecha ON public.pagos(estado,fecha_creacion);
CREATE TABLE public.distribuciones_pago (
 id BIGSERIAL PRIMARY KEY, pago_id BIGINT NOT NULL REFERENCES public.pagos(id) ON DELETE RESTRICT,
 destinatario_id INTEGER REFERENCES public.usuarios(id_usuario),
 tipo VARCHAR(20) NOT NULL CHECK(tipo IN ('Vendedor','Repartidor','Campy')),
 importe NUMERIC(12,2) NOT NULL CHECK(importe>=0),
 estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK(estado IN ('Pendiente','Liquidado','Retenido')),
 referencia_liquidacion TEXT, evidencia_liquidacion TEXT,
 fecha_liquidacion TIMESTAMPTZ, liquidado_por INTEGER REFERENCES public.usuarios(id_usuario),
 fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(pago_id,tipo)
);
CREATE INDEX distribuciones_destinatario_estado ON public.distribuciones_pago(destinatario_id,estado);
CREATE TABLE public.pagos_auditoria (
 id BIGSERIAL PRIMARY KEY,pago_id BIGINT NOT NULL REFERENCES public.pagos(id),
 usuario_id INTEGER REFERENCES public.usuarios(id_usuario), accion TEXT NOT NULL,
 estado_anterior TEXT, estado_nuevo TEXT, detalle JSONB,
 fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.comprobantes_intentos (
 id BIGSERIAL PRIMARY KEY,pago_id BIGINT NOT NULL REFERENCES public.pagos(id),
 clave TEXT NOT NULL, mime TEXT NOT NULL, sha256 CHAR(64) NOT NULL,
 fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Protección de los registros vía API backend: no otorgar permisos a anon/authenticated.
REVOKE ALL ON public.pagos,public.distribuciones_pago,public.pagos_auditoria,public.comprobantes_intentos,public.configuracion_comisiones FROM anon,authenticated;
