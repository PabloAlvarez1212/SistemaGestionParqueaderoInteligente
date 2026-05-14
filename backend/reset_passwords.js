require('dotenv').config();
const supabase = require('./src/config/supabase');
const bcrypt   = require('bcryptjs');

async function resetPasswords() {
  console.log('\n🔧 Restableciendo contraseñas en Supabase...\n');

  const nuevoHash = await bcrypt.hash('Admin123*', 10);
  console.log('   Hash generado:', nuevoHash);

  const emails = ['admin@parkingtech.com', 'empleado@parkingtech.com'];

  for (const email of emails) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ password_hash: nuevoHash, updated_at: new Date().toISOString() })
      .eq('email', email)
      .select('email');

    if (error) {
      console.log(`   ❌ Error actualizando ${email}:`, error.message);
    } else if (data?.length) {
      console.log(`   ✅ Contraseña actualizada: ${email}`);
    } else {
      console.log(`   ⚠️  Usuario no encontrado: ${email}`);
    }
  }

  // Verificar
  const hash = await bcrypt.hash('Admin123*', 10);
  const { data: adminUser } = await supabase
    .from('usuarios').select('email, password_hash').eq('email', 'admin@parkingtech.com').single();

  if (adminUser) {
    const ok = await bcrypt.compare('Admin123*', adminUser.password_hash);
    console.log(`\n   Verificación final: ${ok ? '✅ CONTRASEÑA VÁLIDA' : '❌ HASH AÚN INCORRECTO'}`);
  }

  console.log('\n✅ Proceso completado. Ya puedes iniciar sesión con Admin123*\n');
}

resetPasswords().catch(err => console.error('Error fatal:', err.message));
