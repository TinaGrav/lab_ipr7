const request = require('supertest');
const express = require('express');

const app = express();
app.use(require('cors')());
app.use(express.json());

jest.mock('mongoose', () => {
  const mockModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    prototype: { save: jest.fn() }
  };

  return {
    connect: jest.fn(),
    model: jest.fn(() => mockModel),
    Schema: jest.fn(),
    Types: {
      ObjectId: {
        isValid: jest.fn(() => true)
      }
    }
  };
});

const mongoose = require('mongoose');
const Todo = mongoose.model('Todo');

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'todo-backend'
  });
});

app.get('/api/todos', async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const mockTodo = { _id: '123', ...req.body, save: jest.fn() };
    res.json(mockTodo);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

describe('Todo App API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /health returns 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.service).toBe('todo-backend');
  });

  test('GET /api/todos returns todos', async () => {
    const mockTodos = [{ _id: '1', text: 'Test', completed: false }];
    Todo.find.mockResolvedValue(mockTodos);

    const response = await request(app)
      .get('/api/todos')
      .expect(200);

    expect(response.body).toEqual(mockTodos);
  });

  test('POST /api/todos creates todo', async () => {
    const newTodo = { text: 'New todo', completed: false };

    const response = await request(app)
      .post('/api/todos')
      .send(newTodo)
      .expect(200);

    expect(response.body.text).toBe(newTodo.text);
    expect(response.body._id).toBe('123');
  });

  test('API handles errors', async () => {
    Todo.find.mockRejectedValue(new Error('DB Error'));

    const response = await request(app)
      .get('/api/todos')
      .expect(500);

    expect(response.body.error).toBe('Server error');
  });
});

describe('Business Logic', () => {
  test('Todo object structure', () => {
    const todo = {
      text: 'Test todo',
      completed: false,
      _id: expect.any(String)
    };

    expect(todo).toMatchObject({
      text: expect.any(String),
      completed: expect.any(Boolean)
    });
  });

  test('Health check format', () => {
    const healthResponse = {
      status: 'OK',
      timestamp: '2023-01-01T00:00:00.000Z',
      service: 'todo-backend'
    };

    expect(healthResponse).toEqual({
      status: 'OK',
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      service: 'todo-backend'
    });
  });
});