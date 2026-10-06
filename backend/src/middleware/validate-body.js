import { ApiError } from "../errors/api-error.js";

export function validateBody(fields) {
  return (request, _response, next) => {
    const body = request.body;
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      next(
        new ApiError(400, "validation_failed", "Request validation failed.", [
          {
            field: "body",
            code: "must_be_object",
            message: "Request body must be a JSON object.",
          },
        ]),
      );
      return;
    }

    const details = [];
    for (const [field, rule] of Object.entries(fields)) {
      const value = body[field];
      if (rule.required && (value === undefined || value === null || value === "")) {
        details.push({
          field,
          code: "required",
          message: `${field} is required.`,
        });
        continue;
      }

      if (value !== undefined && value !== null && typeof value !== rule.type) {
        details.push({
          field,
          code: "invalid_type",
          message: `${field} must be a ${rule.type}.`,
        });
      }
    }

    if (details.length > 0) {
      next(new ApiError(400, "validation_failed", "Request validation failed.", details));
      return;
    }

    next();
  };
}
