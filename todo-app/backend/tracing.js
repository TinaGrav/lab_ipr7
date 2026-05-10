/**
 * tracing.js — инициализация OpenTelemetry трейсинга
 *
 * Этот файл подключается ПЕРВЫМ (через --require в server.js или NODE_OPTIONS).
 * Если OTEL_EXPORTER_OTLP_ENDPOINT не задан — трейсинг просто не включается,
 * приложение продолжает работать нормально.
 */

'use strict';

const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (!OTLP_ENDPOINT) {
  console.log('[tracing] OTEL_EXPORTER_OTLP_ENDPOINT not set — tracing disabled');
  module.exports = {};
  return;
}

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');

const exporter = new OTLPTraceExporter({
  url: `${OTLP_ENDPOINT}/v1/traces`,
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'todo-backend',
    [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: exporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Отключаем файловую систему — слишком много шума
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();
console.log(`[tracing] OpenTelemetry started, exporting to ${OTLP_ENDPOINT}`);

// Корректное завершение при остановке контейнера
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('[tracing] SDK shut down'))
    .catch(err => console.error('[tracing] Shutdown error', err));
});

module.exports = sdk;