-- ============================================================
-- SEED: Datos iniciales - ParkingTech S.A.S
-- IMPORTANTE: Ejecutar DESPUÉS de schema.sql
-- Contraseña admin inicial: Admin123*
-- (bcrypt hash generado con 10 rondas)
-- ============================================================

-- ROLES
INSERT INTO roles (nombre, descripcion) VALUES
  ('admin',    'Administrador con acceso total al sistema'),
  ('empleado', 'Empleado con acceso a operaciones de parqueadero')
ON CONFLICT (nombre) DO NOTHING;

-- TIPOS DE USUARIO (para vehículos que ingresan)
INSERT INTO tipos_usuario (nombre, descripcion) VALUES
  ('normal',     'Usuario con tarifa estándar'),
  ('vip',        'Usuario con descuento especial configurable'),
  ('estudiante', 'Usuario con tarifa fija en horario nocturno')
ON CONFLICT (nombre) DO NOTHING;

-- TIPOS DE VEHÍCULO
INSERT INTO tipos_vehiculo (nombre, descripcion) VALUES
  ('carro',      'Automóvil particular'),
  ('moto',       'Motocicleta'),
  ('bicicleta',  'Bicicleta')
ON CONFLICT (nombre) DO NOTHING;

-- MÉTODOS DE PAGO
INSERT INTO metodos_pago (nombre) VALUES
  ('efectivo'),
  ('tarjeta'),
  ('transferencia')
ON CONFLICT (nombre) DO NOTHING;

-- USUARIO ADMINISTRADOR INICIAL
-- Email: admin@parkingtech.com  |  Contraseña: Admin123*
INSERT INTO usuarios (nombre, email, password_hash, rol_id)
SELECT
  'Administrador ParkingTech',
  'admin@parkingtech.com',
  '$2a$10$YhFOrZGuED1b5RKrUw91NuMtJ5uCy0Eai6g86Ld8BPTLq0PZcy0Xy',
  r.id
FROM roles r WHERE r.nombre = 'admin'
ON CONFLICT (email) DO NOTHING;

-- EMPLEADO DE PRUEBA
-- Email: empleado@parkingtech.com  |  Contraseña: Admin123*
INSERT INTO usuarios (nombre, email, password_hash, rol_id)
SELECT
  'Juan Pérez',
  'empleado@parkingtech.com',
  '$2a$10$YhFOrZGuED1b5RKrUw91NuMtJ5uCy0Eai6g86Ld8BPTLq0PZcy0Xy',
  r.id
FROM roles r WHERE r.nombre = 'empleado'
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- TARIFAS POR DEFECTO (todas configurables desde el panel admin)
-- ============================================================

-- CARRO + NORMAL: $3.000/hora, $60/min, sin descuento, gracia 10 min
INSERT INTO tarifas (tipo_vehiculo_id, tipo_usuario_id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos)
SELECT tv.id, tu.id, 3000, 60, 0, 0, NULL, NULL, 10
FROM tipos_vehiculo tv, tipos_usuario tu
WHERE tv.nombre = 'carro' AND tu.nombre = 'normal'
ON CONFLICT (tipo_vehiculo_id, tipo_usuario_id) DO NOTHING;

-- CARRO + VIP: $3.000/hora, 20% descuento
INSERT INTO tarifas (tipo_vehiculo_id, tipo_usuario_id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos)
SELECT tv.id, tu.id, 3000, 60, 20, 0, NULL, NULL, 10
FROM tipos_vehiculo tv, tipos_usuario tu
WHERE tv.nombre = 'carro' AND tu.nombre = 'vip'
ON CONFLICT (tipo_vehiculo_id, tipo_usuario_id) DO NOTHING;

-- CARRO + ESTUDIANTE: $3.000/hora, tarifa fija $5.000 de 5PM a 10PM
INSERT INTO tarifas (tipo_vehiculo_id, tipo_usuario_id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos)
SELECT tv.id, tu.id, 3000, 60, 0, 5000, '17:00:00', '22:00:00', 10
FROM tipos_vehiculo tv, tipos_usuario tu
WHERE tv.nombre = 'carro' AND tu.nombre = 'estudiante'
ON CONFLICT (tipo_vehiculo_id, tipo_usuario_id) DO NOTHING;

-- MOTO + NORMAL: $2.000/hora, $40/min
INSERT INTO tarifas (tipo_vehiculo_id, tipo_usuario_id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos)
SELECT tv.id, tu.id, 2000, 40, 0, 0, NULL, NULL, 10
FROM tipos_vehiculo tv, tipos_usuario tu
WHERE tv.nombre = 'moto' AND tu.nombre = 'normal'
ON CONFLICT (tipo_vehiculo_id, tipo_usuario_id) DO NOTHING;

-- MOTO + VIP: $2.000/hora, 20% descuento
INSERT INTO tarifas (tipo_vehiculo_id, tipo_usuario_id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos)
SELECT tv.id, tu.id, 2000, 40, 20, 0, NULL, NULL, 10
FROM tipos_vehiculo tv, tipos_usuario tu
WHERE tv.nombre = 'moto' AND tu.nombre = 'vip'
ON CONFLICT (tipo_vehiculo_id, tipo_usuario_id) DO NOTHING;

-- MOTO + ESTUDIANTE: tarifa fija $3.000 de 5PM a 10PM
INSERT INTO tarifas (tipo_vehiculo_id, tipo_usuario_id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos)
SELECT tv.id, tu.id, 2000, 40, 0, 3000, '17:00:00', '22:00:00', 10
FROM tipos_vehiculo tv, tipos_usuario tu
WHERE tv.nombre = 'moto' AND tu.nombre = 'estudiante'
ON CONFLICT (tipo_vehiculo_id, tipo_usuario_id) DO NOTHING;

-- BICICLETA + NORMAL: $1.000/hora, $20/min, gracia 15 min
INSERT INTO tarifas (tipo_vehiculo_id, tipo_usuario_id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos)
SELECT tv.id, tu.id, 1000, 20, 0, 0, NULL, NULL, 15
FROM tipos_vehiculo tv, tipos_usuario tu
WHERE tv.nombre = 'bicicleta' AND tu.nombre = 'normal'
ON CONFLICT (tipo_vehiculo_id, tipo_usuario_id) DO NOTHING;

-- BICICLETA + VIP: $1.000/hora, 20% descuento
INSERT INTO tarifas (tipo_vehiculo_id, tipo_usuario_id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos)
SELECT tv.id, tu.id, 1000, 20, 20, 0, NULL, NULL, 15
FROM tipos_vehiculo tv, tipos_usuario tu
WHERE tv.nombre = 'bicicleta' AND tu.nombre = 'vip'
ON CONFLICT (tipo_vehiculo_id, tipo_usuario_id) DO NOTHING;

-- BICICLETA + ESTUDIANTE: tarifa fija $2.000 de 5PM a 10PM
INSERT INTO tarifas (tipo_vehiculo_id, tipo_usuario_id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos)
SELECT tv.id, tu.id, 1000, 20, 0, 2000, '17:00:00', '22:00:00', 15
FROM tipos_vehiculo tv, tipos_usuario tu
WHERE tv.nombre = 'bicicleta' AND tu.nombre = 'estudiante'
ON CONFLICT (tipo_vehiculo_id, tipo_usuario_id) DO NOTHING;
