import { FastifyInstance } from "fastify";
import { db } from "../database/db";
import { randomUUID } from "crypto";
import {
  registerMockRoute,
  updateMockRoute,
  unregisterMockRoute,
} from "../mockRegistry";

export async function apiRoutes(app: FastifyInstance) {
  // CREATE API
  app.post("/collections/:collectionId/apis", async (req, reply) => {
    const collectionId = (req.params as any).collectionId;
    const {
      method,
      endpoint,
      status_code,
      response_type,
      response_body,
      delay_ms,
    } = req.body as any;

    // Validate required fields
    if (!method || !endpoint || !response_body) {
      return reply.status(400).send({
        error: "Method, endpoint, and response_body are required",
      });
    }

    // Normalize endpoint: ensure it starts with /
    const normalizedEndpoint = endpoint.trim().startsWith("/")
      ? endpoint.trim()
      : `/${endpoint.trim()}`;

    // Validate response_type
    const validResponseTypes = ["application/json", "text/plain", "text/html"];
    const finalResponseType = response_type ?? "application/json";
    if (!validResponseTypes.includes(finalResponseType)) {
      return reply.status(400).send({
        error: `Invalid response_type. Must be one of: ${validResponseTypes.join(", ")}`,
      });
    }

    // Validate delay_ms (must be >= 0)
    const finalDelayMs = delay_ms ?? 0;
    if (finalDelayMs < 0) {
      return reply.status(400).send({
        error: "delay_ms must be >= 0",
      });
    }

    // Verify collection exists
    const collection = db
      .prepare("SELECT id FROM collections WHERE id = ?")
      .get(collectionId);
    if (!collection) {
      return reply.status(404).send({ error: "Collection not found" });
    }

    // Collision detection: Check if another API exists in the same collection
    // with the same method + endpoint (using normalized endpoint from above)
    const normalizedMethod = method.toUpperCase();
    const existingApi = db
      .prepare(
        "SELECT id FROM apis WHERE collection_id = ? AND UPPER(method) = ? AND endpoint = ?"
      )
      .get(collectionId, normalizedMethod, normalizedEndpoint);

    if (existingApi) {
      return reply.status(409).send({
        error: "API collision detected",
        message: `An API with method ${normalizedMethod} and endpoint ${normalizedEndpoint} already exists in this collection`,
      });
    }

    const id = randomUUID();
    const created_at = new Date().toISOString();

    // Set defaults if not provided
    const finalStatusCode = status_code ?? 200;

    const stmt = db.prepare(`
      INSERT INTO apis (
        id,
        collection_id,
        method,
        endpoint,
        status_code,
        response_type,
        response_body,
        delay_ms,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        id,
        collectionId,
        normalizedMethod,
        normalizedEndpoint,
        finalStatusCode,
        finalResponseType,
        response_body,
        finalDelayMs,
        created_at
      );

      // Register the mock route
      const apiRow = {
        id,
        collection_id: collectionId,
        method: normalizedMethod,
        endpoint: normalizedEndpoint,
        status_code: finalStatusCode,
        response_type: finalResponseType,
        response_body,
        delay_ms: finalDelayMs,
        created_at,
        updated_at: null,
      };

      registerMockRoute(app, apiRow);

      return {
        id,
        collection_id: collectionId,
        method: normalizedMethod,
        endpoint: normalizedEndpoint,
        status_code: finalStatusCode,
        response_type: finalResponseType,
        response_body,
        delay_ms: finalDelayMs,
        created_at,
        updated_at: null,
      };
    } catch (err) {
      app.log.error(err, "Failed to create API");
      return reply.status(500).send({ error: "Failed to create API" });
    }
  });

  // GET ALL APIs IN A COLLECTION
  app.get("/collections/:collectionId/apis", async (req, reply) => {
    const collectionId = (req.params as any).collectionId;

    // Verify collection exists
    const collection = db
      .prepare("SELECT id FROM collections WHERE id = ?")
      .get(collectionId);
    if (!collection) {
      return reply.status(404).send({ error: "Collection not found" });
    }

    const rows = db
      .prepare(
        "SELECT * FROM apis WHERE collection_id = ? ORDER BY created_at DESC"
      )
      .all(collectionId);

    return rows;
  });

  // UPDATE API
  app.put("/apis/:id", async (req, reply) => {
    const apiId = (req.params as any).id;
    const {
      method,
      endpoint,
      status_code,
      response_type,
      response_body,
      delay_ms,
    } = req.body as any;

    // Verify API exists
    const existingApi = db
      .prepare("SELECT * FROM apis WHERE id = ?")
      .get(apiId) as any;
    if (!existingApi) {
      return reply.status(404).send({ error: "API not found" });
    }

    // Collision detection: Check if another API exists in the same collection
    // with the same method + endpoint (excluding the current API)
    const normalizedMethod = method
      ? method.toUpperCase()
      : existingApi.method.toUpperCase();
    
    // Normalize endpoint: ensure it starts with /
    const rawEndpoint = endpoint ?? existingApi.endpoint;
    const finalEndpoint = rawEndpoint.trim().startsWith("/")
      ? rawEndpoint.trim()
      : `/${rawEndpoint.trim()}`;

    // Validate response_type if provided
    if (response_type) {
      const validResponseTypes = ["application/json", "text/plain", "text/html"];
      if (!validResponseTypes.includes(response_type)) {
        return reply.status(400).send({
          error: `Invalid response_type. Must be one of: ${validResponseTypes.join(", ")}`,
        });
      }
    }

    // Validate delay_ms if provided (must be >= 0)
    if (delay_ms !== undefined && delay_ms < 0) {
      return reply.status(400).send({
        error: "delay_ms must be >= 0",
      });
    }

    // Only check collision if method or endpoint is being changed
    // Note: We use normalized endpoint for collision detection
    if (method || endpoint) {
      const collisionApi = db
        .prepare(
          "SELECT id FROM apis WHERE collection_id = ? AND UPPER(method) = ? AND endpoint = ? AND id != ?"
        )
        .get(
          existingApi.collection_id,
          normalizedMethod,
          finalEndpoint, // Already normalized above
          apiId
        );

      if (collisionApi) {
        return reply.status(409).send({
          error: "API collision detected",
          message: `An API with method ${normalizedMethod} and endpoint ${finalEndpoint} already exists in this collection`,
        });
      }
    }

    const updated_at = new Date().toISOString();

    // Use provided values or keep existing ones
    const finalMethod = normalizedMethod;
    const finalStatusCode = status_code ?? existingApi.status_code;
    const finalResponseType = response_type ?? existingApi.response_type;
    const finalResponseBody = response_body ?? existingApi.response_body;
    const finalDelayMs = delay_ms ?? existingApi.delay_ms;

    const stmt = db.prepare(`
      UPDATE apis
      SET
        method = ?,
        endpoint = ?,
        status_code = ?,
        response_type = ?,
        response_body = ?,
        delay_ms = ?,
        updated_at = ?
      WHERE id = ?
    `);

    try {
      stmt.run(
        finalMethod,
        finalEndpoint,
        finalStatusCode,
        finalResponseType,
        finalResponseBody,
        finalDelayMs,
        updated_at,
        apiId
      );

      // Update the mock route
      const apiRow = {
        id: apiId,
        collection_id: existingApi.collection_id,
        method: finalMethod,
        endpoint: finalEndpoint,
        status_code: finalStatusCode,
        response_type: finalResponseType,
        response_body: finalResponseBody,
        delay_ms: finalDelayMs,
        created_at: existingApi.created_at,
        updated_at,
      };

      updateMockRoute(app, apiRow);

      return {
        id: apiId,
        collection_id: existingApi.collection_id,
        method: finalMethod,
        endpoint: finalEndpoint,
        status_code: finalStatusCode,
        response_type: finalResponseType,
        response_body: finalResponseBody,
        delay_ms: finalDelayMs,
        created_at: existingApi.created_at,
        updated_at,
      };
    } catch (err) {
      app.log.error(err, "Failed to update API");
      return reply.status(500).send({ error: "Failed to update API" });
    }
  });

  // DELETE API
  app.delete("/apis/:id", async (req, reply) => {
    const apiId = (req.params as any).id;

    // Verify API exists
    const existingApi = db
      .prepare("SELECT id FROM apis WHERE id = ?")
      .get(apiId);
    if (!existingApi) {
      return reply.status(404).send({ error: "API not found" });
    }

    try {
      // Unregister the mock route first
      unregisterMockRoute(app, apiId);

      // Delete from database
      db.prepare("DELETE FROM apis WHERE id = ?").run(apiId);

      return { success: true };
    } catch (err) {
      app.log.error(err, "Failed to delete API");
      return reply.status(500).send({ error: "Failed to delete API" });
    }
  });
}

