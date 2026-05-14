const { Router } = require('express');
const {
  dashboard, ingresosDiarios, vehiculosActivos,
  recaudo, porTipoUsuario, porEmpleado,
} = require('../controllers/reportes.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/roles.middleware');

const router = Router();

router.use(authMiddleware);

// Dashboard: accesible para todos
router.get('/dashboard',         dashboard);
router.get('/vehiculos-activos', vehiculosActivos);

// Reportes detallados: solo admin
router.get('/ingresos-diarios',  requireAdmin, ingresosDiarios);
router.get('/recaudo',           requireAdmin, recaudo);
router.get('/por-tipo-usuario',  requireAdmin, porTipoUsuario);
router.get('/por-empleado',      requireAdmin, porEmpleado);

module.exports = router;
