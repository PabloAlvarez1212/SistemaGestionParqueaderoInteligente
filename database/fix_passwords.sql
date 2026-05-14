-- ============================================================
-- FIX: Corregir contraseñas de usuarios existentes
-- Contraseña para todos los usuarios: Admin123*
-- Hash bcrypt (10 rondas): correcto y verificado
-- ============================================================

-- Actualizar contraseña del administrador
UPDATE usuarios
SET password_hash = '$2a$10$YhFOrZGuED1b5RKrUw91NuMtJ5uCy0Eai6g86Ld8BPTLq0PZcy0Xy',
    updated_at    = NOW()
WHERE email = 'admin@parkingtech.com';

-- Actualizar contraseña del empleado de prueba
UPDATE usuarios
SET password_hash = '$2a$10$YhFOrZGuED1b5RKrUw91NuMtJ5uCy0Eai6g86Ld8BPTLq0PZcy0Xy',
    updated_at    = NOW()
WHERE email = 'empleado@parkingtech.com';

-- Verificar resultado
SELECT id, nombre, email,
       LEFT(password_hash, 30) AS hash_preview,
       activo,
       roles.nombre AS rol
FROM usuarios
JOIN roles ON roles.id = usuarios.rol_id;
