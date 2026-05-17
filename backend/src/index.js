require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes     = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const tarifasRoutes  = require('./routes/tarifas.routes');
const vehiculosRoutes= require('./routes/vehiculos.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://sistema-gestion-parqueadero-intelig.vercel.app',
    'https://sistema-gestion-parqueadero-inteligente-lq9lwo8c4.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/usuarios',  usuariosRoutes);
app.use('/api/tarifas',   tarifasRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/reportes',  reportesRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ── Ruta no encontrada ────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// ── Manejo global de errores ──────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`\n🅿️  ParkingTech API corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
