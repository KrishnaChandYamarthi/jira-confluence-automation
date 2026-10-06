import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { registerPlaceholderRoutes } from "./routes/index.js";

const app = express();

app.disable("x-powered-by");
app.use(requestIdMiddleware);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

registerPlaceholderRoutes(app);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
