import express from "express";
import { ApiError } from "../errors/api-error.js";

const PLACEHOLDER_ROUTES = [
  "/api/auth",
  "/api/jira",
  "/api/confluence",
  "/api/connections",
  "/api/operations",
];

export function registerPlaceholderRoutes(app) {
  for (const path of PLACEHOLDER_ROUTES) {
    const router = express.Router();
    router.use((_request, _response, next) => {
      next(
        new ApiError(
          501,
          "not_implemented",
          "This API route is reserved and is not implemented yet.",
        ),
      );
    });
    app.use(path, router);
  }
}
