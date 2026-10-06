import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { registerPlaceholderRoutes } from "./routes/index.js";
import { createMockAuthRouter } from "./auth/mock-auth.js";

export function createApp(mockAuthOptions) {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", createMockAuthRouter(mockAuthOptions));
  registerPlaceholderRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp();
