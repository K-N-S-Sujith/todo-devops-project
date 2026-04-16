const Todo = require('../models/todo.model');
const { redisGet, redisSet, redisDel } = require('../config/redis.config');
const { encryptToString, decryptFromString } = require('../utils/encryption.utils');

const CACHE_TTL = 300; // 5 minutes
const PREMIUM_TODO_LIMIT = Infinity;
const FREE_TODO_LIMIT = 10;

const getCacheKey = (userId) => `todos:${userId}`;

// ─── Get all todos ────────────────────────────────────────────────────────────
const getTodos = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = getCacheKey(userId);

    // Try cache first
    const cached = await redisGet(cacheKey);
    if (cached) {
      const todos = JSON.parse(cached);
      return res.json({ success: true, todos, fromCache: true });
    }

    const todos = await Todo.find({ userId }).sort({ createdAt: -1 });

    // Cache result
    await redisSet(cacheKey, JSON.stringify(todos), CACHE_TTL);

    res.json({ success: true, todos, fromCache: false });
  } catch (err) {
    console.error('getTodos error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch todos' });
  }
};

// ─── Create todo ──────────────────────────────────────────────────────────────
const createTodo = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, description, priority, dueDate, tags, privateNote } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    // Enforce free-tier limit
    if (!req.user.isPremium) {
      const count = await Todo.countDocuments({ userId });
      if (count >= FREE_TODO_LIMIT) {
        return res.status(403).json({
          success: false,
          message: `Free plan limited to ${FREE_TODO_LIMIT} todos. Upgrade to Premium for unlimited!`,
          code: 'LIMIT_REACHED',
        });
      }
    }

    // Encrypt private note (premium feature)
    let encryptedNote = null;
    let encryptedNoteIv = null;
    let isPremiumFeature = false;

    if (privateNote && req.user.isPremium) {
      try {
        const encrypted = encryptToString(privateNote);
        if (encrypted) {
          const parts = encrypted.split(':');
          encryptedNoteIv = `${parts[0]}:${parts[1]}`; // iv:authTag
          encryptedNote = parts[2]; // ciphertext
          isPremiumFeature = true;
        }
      } catch (encErr) {
        console.error('Encryption error:', encErr.message);
        // Continue without encryption
      }
    }

    const todo = await Todo.create({
      userId,
      title: title.trim(),
      description: description?.trim(),
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
      encryptedNote,
      encryptedNoteIv,
      isPremiumFeature,
    });

    // Invalidate cache
    await redisDel(getCacheKey(userId.toString()));

    res.status(201).json({ success: true, todo });
  } catch (err) {
    console.error('createTodo error:', err);
    res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
};

// ─── Update todo ──────────────────────────────────────────────────────────────
const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { title, description, completed, priority, dueDate, tags, privateNote } = req.body;

    const todo = await Todo.findOne({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    if (title !== undefined) todo.title = title.trim();
    if (description !== undefined) todo.description = description.trim();
    if (completed !== undefined) todo.completed = completed;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate;
    if (tags !== undefined) todo.tags = tags;

    // Update encrypted note (premium)
    if (privateNote !== undefined && req.user.isPremium) {
      try {
        if (privateNote === null || privateNote === '') {
          todo.encryptedNote = null;
          todo.encryptedNoteIv = null;
          todo.isPremiumFeature = false;
        } else {
          const encrypted = encryptToString(privateNote);
          if (encrypted) {
            const parts = encrypted.split(':');
            todo.encryptedNoteIv = `${parts[0]}:${parts[1]}`;
            todo.encryptedNote = parts[2];
            todo.isPremiumFeature = true;
          }
        }
      } catch (encErr) {
        console.error('Encryption update error:', encErr.message);
      }
    }

    await todo.save();

    // Invalidate cache
    await redisDel(getCacheKey(userId.toString()));

    res.json({ success: true, todo });
  } catch (err) {
    console.error('updateTodo error:', err);
    res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
};

// ─── Delete todo ──────────────────────────────────────────────────────────────
const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const todo = await Todo.findOneAndDelete({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Invalidate cache
    await redisDel(getCacheKey(userId.toString()));

    res.json({ success: true, message: 'Todo deleted', id });
  } catch (err) {
    console.error('deleteTodo error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
};

// ─── Get single todo with decrypted note ─────────────────────────────────────
const getTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const todo = await Todo.findOne({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    const result = todo.toJSON();

    // Decrypt private note for premium users
    if (todo.encryptedNote && todo.encryptedNoteIv && req.user.isPremium) {
      try {
        const [iv, authTag] = todo.encryptedNoteIv.split(':');
        result.privateNote = decryptFromString(`${iv}:${authTag}:${todo.encryptedNote}`);
      } catch (decErr) {
        console.error('Decryption error:', decErr.message);
        result.privateNote = null;
      }
    }

    res.json({ success: true, todo: result });
  } catch (err) {
    console.error('getTodo error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch todo' });
  }
};

// ─── Toggle complete ──────────────────────────────────────────────────────────
const toggleComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const todo = await Todo.findOne({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    todo.completed = !todo.completed;
    await todo.save();

    await redisDel(getCacheKey(userId.toString()));

    res.json({ success: true, todo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle todo' });
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, getTodo, toggleComplete };