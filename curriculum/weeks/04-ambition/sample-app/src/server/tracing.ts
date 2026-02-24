import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

// Note: "otel-lgtm" is the service name from docker-compose.yml — Docker's internal
// DNS resolves it to the container's IP on the private network. This URL is
// only reachable from other containers in the same Compose stack, not the public internet.
const sdk = new NodeSDK({
  serviceName: "my-app",
  traceExporter: new OTLPTraceExporter({
    url: "http://otel-lgtm:4318/v1/traces",
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: "http://otel-lgtm:4318/v1/metrics",
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
