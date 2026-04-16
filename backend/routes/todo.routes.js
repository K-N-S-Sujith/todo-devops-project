const express = require('express');
const router = express.Router();

const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  getTodo,
  toggleComplete
} = require('../controllers/todo.controller');

const { protect } = require('../middleware/auth.middleware');

// ─── All routes require authentication ────────────────────────────────────────
router.use(protect);

// ─── CRUD Routes ─────────────────────────────────────────────────────────────

// Get all todos (with caching)
router.get('/', getTodos);

// Create new todo
router.post('/', createTodo);

// Get single todo (with decryption if premium)
router.get('/:id', getTodo);

// Update todo
router.put('/:id', updateTodo);

// Delete todo
router.delete('/:id', deleteTodo);

// Toggle complete status
router.patch('/:id/toggle', toggleComplete);

module.exports = router;