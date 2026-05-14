const { Router } = require('express');
const {
  registrarIngreso, registrarSalida, calcularPreview,
  listarActivos, buscarPorPlaca, historial,
  ingresoValidators, salidaValidators,
} = require('../controllers/vehiculos.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireEmpleado } = require('../middlewares/roles.middleware');

const router = Router();

router.use(authMiddleware, requireEmpleado);

router.get('/activos',                         listarActivos);
router.get('/historial',                       historial);
router.get('/buscar/:placa',                   buscarPorPlaca);
router.get('/calcular-cobro/:movimientoId',    calcularPreview);
router.post('/ingreso',                        ingresoValidators, registrarIngreso);
router.post('/salida/:movimientoId',           salidaValidators,  registrarSalida);

module.exports = router;
