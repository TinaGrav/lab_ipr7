/**
 * metrics.js — определение всех метрик Prometheus
 *
 * Импортируй этот файл в server.js и вызывай нужные функции
 * в обработчиках маршрутов.
 */

'use strict';

const client = require('prom-client');

// Включаем стандартные метрики Node.js:
// process_cpu_seconds_total, process_resident_memory_bytes, nodejs_heap_size_total и др.
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ─── HTTP-метрики ────────────────────────────────────────────────────────────

/**
 * Счётчик HTTP-запросов.
 * Лейблы:
 *   method      — GET, POST, PATCH, DELETE
 *   route       — ШАБЛОН маршрута (/api/todos, /api/todos/:id), НЕ реальный path с ID!
 *   status_code — 200, 201, 400, 404, 500 …
 */
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Гистограмма времени обработки HTTP-запроса (в секундах).
 * Позволяет считать p50, p90, p99 латентности.
 */
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  // Бакеты: 1мс, 5мс, 10мс, 25мс, 50мс, 100мс, 250мс, 500мс, 1с, 2.5с
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

// ─── Бизнес-метрики ──────────────────────────────────────────────────────────

/**
 * Счётчик созданных задач (todo).
 * Бизнес-метрика: показывает активность пользователей.
 */
const todosCreatedTotal = new client.Counter({
  name: 'todos_created_total',
  help: 'Total number of todo items created',
  registers: [register],
});

/**
 * Счётчик удалённых задач.
 */
const todosDeletedTotal = new client.Counter({
  name: 'todos_deleted_total',
  help: 'Total number of todo items deleted',
  registers: [register],
});

/**
 * Счётчик переключений статуса задачи (completed/uncompleted).
 */
const todosStatusChangedTotal = new client.Counter({
  name: 'todos_status_changed_total',
  help: 'Total number of todo status toggles (completed/uncompleted)',
  labelNames: ['completed'],   // 'true' или 'false'
  registers: [register],
});

/**
 * Gauge — текущее количество задач в БД.
 * Gauge может как расти, так и убывать (в отличие от Counter).
 */
const todosActiveGauge = new client.Gauge({
  name: 'todos_active_total',
  help: 'Current number of todos in the database',
  registers: [register],
});

// ─── Middleware для автоматического измерения всех запросов ──────────────────

/**
 * Express middleware: вешай ПЕРВЫМ через app.use(metricsMiddleware).
 * Автоматически считает httpRequestsTotal и httpRequestDurationSeconds
 * для КАЖДОГО запроса, используя route-шаблон Express (req.route.path),
 * а не реальный URL с ID.
 */
function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    // req.route.path = '/api/todos/:id'  — шаблон без реального ID
    // Для запросов без route (404) используем 'unknown'
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = String(res.statusCode);

    // Время в секундах из nanoseconds
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    httpRequestDurationSeconds.observe({ method, route }, durationSec);
  });

  next();
}

module.exports = {
  register,
  // Метрики (для инкрементации в роутах)
  todosCreatedTotal,
  todosDeletedTotal,
  todosStatusChangedTotal,
  todosActiveGauge,
  // Middleware
  metricsMiddleware,
};