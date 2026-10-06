import { ApiError } from "../errors/api-error.js";
import { logger } from "../observability/logger.js";

export function notFoundHandler(_request, _response, next) {
  next(new ApiError(404, "not_found", "The requested resource was not found."));
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  let apiError = error;
  if (error?.type === "entity.parse.failed") {
    apiError = new ApiError(400, "invalid_json", "Request body must contain valid JSON.", [
      {
        field: "body",
        code: "invalid_json",
        message: "Check the request body syntax and send valid JSON.",
      },
    ]);
  } else if (error?.type === "entity.too.large") {
    apiError = new ApiError(
      413,
      "request_too_large",
      "The request body exceeds the allowed size.",
    );
  } else if (!(error instanceof ApiError)) {
    logger.error("request_failed", {
      requestId: request.requestId,
      error,
    });
    apiError = new ApiError(
      500,
      "internal_error",
      "The request could not be completed.",
    );
  }

  const errorBody = {
    code: apiError.code,
    message: apiError.message,
    requestId: request.requestId,
  };
  if (apiError.details.length > 0) {
    errorBody.details = apiError.details;
  }

  response.status(apiError.status).json({ error: errorBody });
}
