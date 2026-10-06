const sensitiveKeyPattern =
  /token|secret|password|authorization|cookie|credential|api[_-]?key|private[_-]?key/i;
const contentKeyPattern =
  /^(body|content|data|description|details|error|errors|error_description|error_message|html|message|request|response|stack|summary|text|title|storage)$/i;
const redactedValue = "[REDACTED]";
const omittedValue = "[OMITTED]";

function safeError(error) {
  const safe = { name: error.name || "Error" };
  if (typeof error.code === "string") safe.code = error.code;
  if (Number.isInteger(error.status)) safe.status = error.status;
  return safe;
}

function redactValue(value, key, seen) {
  if (key && sensitiveKeyPattern.test(key)) return redactedValue;
  if (key && contentKeyPattern.test(key)) return omittedValue;

  if (value instanceof Error) return safeError(value);
  if (value instanceof Date) return value.toISOString();
  if (ArrayBuffer.isView(value)) return omittedValue;
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, "", seen));
  }
  if (value === null || typeof value !== "object") {
    return typeof value === "bigint" ? value.toString() : value;
  }
  if (seen.has(value)) return "[Circular]";

  seen.add(value);
  const sanitized = Object.fromEntries(
    Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      redactValue(childValue, childKey, seen),
    ]),
  );
  seen.delete(value);
  return sanitized;
}

function write(level, event, context) {
  const sanitizedContext = redactValue(context, "", new WeakSet());
  const entry = {
    ...(sanitizedContext && typeof sanitizedContext === "object"
      ? sanitizedContext
      : { context: sanitizedContext }),
    timestamp: new Date().toISOString(),
    level,
    event,
  };

  const writer =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.info;
  writer(JSON.stringify(entry));
}

export const logger = Object.freeze({
  info(event, context = {}) {
    write("info", event, context);
  },
  warn(event, context = {}) {
    write("warn", event, context);
  },
  error(event, context = {}) {
    write("error", event, context);
  },
});
