require('dotenv').config();
const supabase = require('./src/config/supabase');
const bcrypt   = require('bcryptjs');

async function diagnosticar() {
  console.log('\n🔍 Diagnóstico del Sistema ParkingTech\n');
  console.log('─'.repeat(45));

  // 1. Conexión a Supabase
  console.log('\n1️⃣  Verificando conexión a Supabase...');
  const { data: roles, error: errRoles } = await supabase.from('roles').select('id, nombre');
  if (errRoles) {
    console.log('   ❌ ERROR:', errRoles.message);
    console.log('   ➜  ¿Ejecutaste schema.sql y seed.sql en Supabase SQL Editor?');
    return;
  }
  console.log('   ✅ Conexión OK. Roles:', roles.map(r => r.nombre).join(', '));

  // 2. Usuarios creados
  console.log('\n2️⃣  Verificando usuarios en BD...');
  const { data: usuarios, error: errU } = await supabase
    .from('usuarios')
    .select('id, nombre, email, password_hash, activo, roles(nombre)');
  if (errU || !usuarios?.length) {
    console.log('   ❌ No se encontraron usuarios. Ejecuta seed.sql en Supabase.');
    return;
  }
  console.log(`   ✅ ${usuarios.length} usuario(s) encontrado(s):`);
  usuarios.forEach(u => console.log(`      - ${u.email} [${u.roles?.nombre}] activo=${u.activo}`));

  // 3. Verificar hash de contraseña
  console.log('\n3️⃣  Verificando hash de contraseña...');
  const admin = usuarios.find(u => u.email === 'admin@parkingtech.com');
  if (!admin) {
    console.log('   ❌ Usuario admin@parkingtech.com no encontrado.');
    return;
  }
  const hashOK = await bcrypt.compare('Admin123*', admin.password_hash);
  if (hashOK) {
    console.log('   ✅ Hash correcto. La contraseña Admin123* es válida.');
  } else {
    console.log('   ❌ Hash INCORRECTO. La contraseña no coincide.');
    console.log('   ➜  Ejecuta fix_passwords.sql en Supabase SQL Editor.');
    const nuevoHash = await bcrypt.hash('Admin123*', 10);
    console.log('   ➜  Nuevo hash correcto:', nuevoHash);
  }

  // 4. Tarifas
  console.log('\n4️⃣  Verificando tarifas...');
  const { data: tarifas } = await supabase.from('tarifas').select('id', { count: 'exact' });
  console.log(`   ${tarifas?.length ? '✅' : '❌'} ${tarifas?.length || 0} tarifa(s) configurada(s)`);

  console.log('\n─'.repeat(45));
  console.log('✅ Diagnóstico completado.\n');
}

diagnosticar().catch(err => console.error('Error fatal:', err.message));
