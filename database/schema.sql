-- ============================================================
-- SCHEMA: Sistema de Gestión de Parqueadero - ParkingTech S.A.S
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id   SERIAL PRIMARY KEY,
  nombre      VARCHAR(50)  NOT NULL UNIQUE,
  descripcion TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TIPOS DE USUARIO  (para los vehículos que ingresan)
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_usuario (
  id   SERIAL PRIMARY KEY,
  nombre      VARCHAR(50)  NOT NULL UNIQUE,
  descripcion TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TIPOS DE VEHÍCULO
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_vehiculo (
  id   SERIAL PRIMARY KEY,
  nombre      VARCHAR(50)  NOT NULL UNIQUE,
  descripcion TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- USUARIOS  (empleados y administradores del sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id        INTEGER      NOT NULL REFERENCES roles(id),
  activo        BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- MÉTODOS DE PAGO
-- ============================================================
CREATE TABLE IF NOT EXISTS metodos_pago (
  id     SERIAL      PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  activo BOOLEAN     DEFAULT TRUE
);

-- ============================================================
-- TARIFAS  (una fila por combinación tipo_vehiculo + tipo_usuario)
-- ============================================================
CREATE TABLE IF NOT EXISTS tarifas (
  id                    SERIAL       PRIMARY KEY,
  tipo_vehiculo_id      INTEGER      NOT NULL REFERENCES tipos_vehiculo(id),
  tipo_usuario_id       INTEGER      NOT NULL REFERENCES tipos_usuario(id),
  tarifa_hora           DECIMAL(10,2) NOT NULL DEFAULT 0,
  tarifa_minuto         DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento_porcentaje  DECIMAL(5,2)  DEFAULT 0,   -- % descuento VIP
  tarifa_especial_fija  DECIMAL(10,2) DEFAULT 0,   -- tarifa fija estudiante
  hora_inicio_especial  TIME,                       -- ej: 17:00:00
  hora_fin_especial     TIME,                       -- ej: 22:00:00
  tiempo_gracia_minutos INTEGER       DEFAULT 10,
  activo                BOOLEAN       DEFAULT TRUE,
  updated_at            TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(tipo_vehiculo_id, tipo_usuario_id)
);

-- ============================================================
-- VEHÍCULOS
-- ============================================================
CREATE TABLE IF NOT EXISTS vehiculos (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  placa            VARCHAR(20)  NOT NULL,
  tipo_vehiculo_id INTEGER      NOT NULL REFERENCES tipos_vehiculo(id),
  tipo_usuario_id  INTEGER      NOT NULL REFERENCES tipos_usuario(id),
  propietario      VARCHAR(100),
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON vehiculos(placa);

-- ============================================================
-- MOVIMIENTOS DE PARQUEADERO
-- ============================================================
CREATE TABLE IF NOT EXISTS movimientos_parqueadero (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id         UUID         NOT NULL REFERENCES vehiculos(id),
  empleado_ingreso_id UUID         NOT NULL REFERENCES usuarios(id),
  empleado_salida_id  UUID         REFERENCES usuarios(id),
  hora_ingreso        TIMESTAMPTZ  DEFAULT NOW(),
  hora_salida         TIMESTAMPTZ,
  tiempo_total_minutos INTEGER,
  tarifa_id           INTEGER      REFERENCES tarifas(id),
  valor_base          DECIMAL(10,2),
  descuento_aplicado  DECIMAL(10,2) DEFAULT 0,
  valor_total         DECIMAL(10,2),
  metodo_pago_id      INTEGER      REFERENCES metodos_pago(id),
  tipo_cobro          VARCHAR(50),   -- normal | vip | estudiante | gracia
  detalle_cobro       TEXT,
  estado              VARCHAR(20)   DEFAULT 'activo'
                        CHECK (estado IN ('activo', 'completado')),
  observaciones       TEXT,
  created_at          TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_estado       ON movimientos_parqueadero(estado);
CREATE INDEX IF NOT EXISTS idx_mov_hora_ingreso ON movimientos_parqueadero(hora_ingreso);
CREATE INDEX IF NOT EXISTS idx_mov_vehiculo     ON movimientos_parqueadero(vehiculo_id);
