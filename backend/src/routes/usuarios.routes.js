const { Router } = require('express');
const {
  listarUsuarios, obtenerUsuario, crearUsuario,
  actualizarUsuario, eliminarUsuario, cambiarPassword,
  crearUsuarioValidators, actualizarUsuarioValidators,
} = require('../controllers/usuarios.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/roles.middleware');

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get('/',              listarUsuarios);
router.get('/:id',           obtenerUsuario);
router.post('/',             crearUsuarioValidators, crearUsuario);
router.put('/:id',           actualizarUsuarioValidators, actualizarUsuario);
router.delete('/:id',        eliminarUsuario);
router.put('/:id/password',  cambiarPassword);

module.exports = router;
