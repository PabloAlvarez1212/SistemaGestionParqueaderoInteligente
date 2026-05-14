const { Router } = require('express');
const {
  listarTarifas, obtenerTarifa, actualizarTarifa,
  listarTiposVehiculo, listarTiposUsuario, listarMetodosPago,
  listarRoles, actualizarTarifaValidators,
} = require('../controllers/tarifas.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/roles.middleware');

const router = Router();

router.use(authMiddleware);

// Catálogos: acceso para todos los usuarios autenticados
router.get('/tipos-vehiculo', listarTiposVehiculo);
router.get('/tipos-usuario',  listarTiposUsuario);
router.get('/metodos-pago',   listarMetodosPago);
router.get('/roles',          listarRoles);

// Tarifas: lectura para todos, escritura solo admin
router.get('/',     listarTarifas);
router.get('/:id',  obtenerTarifa);
router.put('/:id',  requireAdmin, actualizarTarifaValidators, actualizarTarifa);

module.exports = router;
