const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl   = require('../controllers/notesController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

router.use(protect);

router.get('/',        ctrl.listNotes);
router.get('/trash',   ctrl.listTrash);
router.get('/:id', [param('id').isMongoId()], validate, ctrl.getNote);

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('encryptedContent').notEmpty().withMessage('Encrypted content is required'),
  body('iv').isLength({ min:32, max:32 }).withMessage('Valid IV required'),
], validate, ctrl.createNote);

router.patch('/:id',            [param('id').isMongoId()], validate, ctrl.updateNote);
router.patch('/:id/restore',    [param('id').isMongoId()], validate, ctrl.restoreNote);
router.delete('/:id',           [param('id').isMongoId()], validate, ctrl.deleteNote);
router.delete('/:id/permanent', [param('id').isMongoId()], validate, ctrl.hardDeleteNote);
router.delete('/trash/empty',   ctrl.emptyTrash);
router.post('/:id/verify-passcode', [param('id').isMongoId()], validate, ctrl.verifyNotePasscode);

module.exports = router;
