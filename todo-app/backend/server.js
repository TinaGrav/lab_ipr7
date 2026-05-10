/**
 * server.js — Todo backend с метриками Prometheus и трейсингом OpenTelemetry
 *
 * Трейсинг подключается ПЕРВЫМ — до любых других require,
 * чтобы OpenTelemetry успел инструментировать express и mongoose.
 */
require('./tracing');   // ← должен быть самым первым импортом

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const {
  register,
  metricsMiddleware,
  todosCreatedTotal,
  todosDeletedTotal,
  todosStatusChangedTotal,
  todosActiveGauge,
} = require('./metrics');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Middleware метрик — ПЕРВЫМ, до роутов ────────────────────────────────────
app.use(metricsMiddleware);

// ─── Healthcheck ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'todo-backend',
  });
});

// ─── Эндпоинт метрик для Prometheus ──────────────────────────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ─── Подключение к MongoDB ────────────────────────────────────────────────────
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://mongodb:27017/todoapp';
mongoose.connect(MONGODB_URL)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    console.log('Database URL:', MONGODB_URL);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

// ─── Модель Todo ──────────────────────────────────────────────────────────────
const Todo = mongoose.model('Todo', {
  text: String,
  completed: Boolean,
});

// ─── Роуты ────────────────────────────────────────────────────────────────────

// GET /api/todos — получить все задачи
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await Todo.find();
    // Обновляем gauge — реальное количество задач в БД
    todosActiveGauge.set(todos.length);
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/todos — создать задачу
app.post('/api/todos', async (req, res) => {
  try {
    const todo = new Todo(req.body);
    await todo.save();

    // Бизнес-метрика: инкрементируем счётчик созданных задач
    todosCreatedTotal.inc();

    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/todos/:id — обновить задачу
app.patch('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    if (req.body.text !== undefined) todo.text = req.body.text;

    if (req.body.completed !== undefined) {
      todo.completed = req.body.completed;
      // Бизнес-метрика: считаем переключения статуса
      todosStatusChangedTotal.inc({ completed: String(req.body.completed) });
    }

    await todo.save();
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/todos/:id — удалить задачу
app.delete('/api/todos/:id', async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);

    // Бизнес-метрика: счётчик удалений
    todosDeletedTotal.inc();

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Запуск ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));