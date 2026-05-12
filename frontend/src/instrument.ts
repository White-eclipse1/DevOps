import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://1799ce5fc436c48f933aa922460eb447@o4511113714728960.ingest.us.sentry.io/4511113736224768",
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});
