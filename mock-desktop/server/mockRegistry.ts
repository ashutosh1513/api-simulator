import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "./database/db";
import Handlebars from "handlebars";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { match } from "path-to-regexp";

/**
 * Logs a request to the request_logs table
 */
function logRequest(
  apiId: string | null,
  requestMeta: any,
  requestBody: any,
  responseSent: any
): void {
  const id = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO request_logs (id, api_id, timestamp, request_meta, request_body, response_sent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      apiId,
      timestamp,
      JSON.stringify(requestMeta),
      JSON.stringify(requestBody),
      JSON.stringify(responseSent)
    );
  } catch (err) {
    console.error("Failed to log request:", err);
  }
}

/**
 * Handles all mock requests dynamically by looking up the API definition in the database.
 * URL Pattern: /mock/:projectSlug/:collectionSlug/*
 */
export async function handleMockRequest(req: FastifyRequest, reply: FastifyReply) {
  const url = req.url;

  // Regex to extract projectSlug, collectionSlug, and the actual endpoint path
  // Matches: /mock/project-slug/collection-slug/some/path?query=123
  // We need to be careful with query parameters, req.url includes them in Fastify if not using router params?
  // Actually req.url is the full URL. We should use req.route? No, this is a wildcard handler.
  // Let's parse the path from the URL.

  const urlObj = new URL(url, "http://localhost");
  const path = urlObj.pathname; // /mock/project/collection/users/123

  const matchResult = path.match(/^\/mock\/([^\/]+)\/([^\/]+)(.*)$/);

  if (!matchResult) {
    return reply.status(404).send({ error: "Invalid mock URL format" });
  }

  const [, projectSlug, collectionSlug, endpointPath] = matchResult;
  const method = req.method.toUpperCase();

  console.log(`[MOCK LOOKUP] Project: ${projectSlug}, Collection: ${collectionSlug}, Method: ${method}, Path: ${endpointPath}`);

  // 1. Find the collection ID based on slugs
  const collectionRow = db.prepare(`
    SELECT c.id 
    FROM collections c
    JOIN projects p ON c.project_id = p.id
    WHERE c.slug = ? AND (lower(p.name) = ? OR p.id = ?) -- simplified project slug check
  `).get(collectionSlug, projectSlug.replace(/-/g, " "), projectSlug) as { id: string } | undefined;

  // Note: The project slug logic in the previous code was:
  // slugify(row.project_name || row.id)
  // We might need a more robust way to match project slug back to project.
  // For now, let's try to match by exact slug if we stored it, but we don't store project slug.
  // Let's iterate projects if needed, or just rely on collection slug uniqueness?
  // Actually, collection slug is unique per project.
  // Let's try to find the collection by slug first, then verify project?
  // Or better: Let's fetch the collection by slug and verify the project name matches the slug.

  // Improved query: Find collection by slug, then we check project.
  // Since we don't have project slug in DB, we have to do best effort or change DB.
  // But wait, the previous code generated project slug on the fly.
  // Let's stick to finding collection by slug.

  const collections = db.prepare(`
    SELECT c.id, p.name as project_name
    FROM collections c
    JOIN projects p ON c.project_id = p.id
    WHERE c.slug = ?
  `).all(collectionSlug) as { id: string, project_name: string }[];

  let collectionId: string | null = null;

  // Helper to slugify
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  for (const col of collections) {
    if (slugify(col.project_name) === projectSlug) {
      collectionId = col.id;
      break;
    }
  }

  if (!collectionId) {
    console.warn(`[MOCK 404] Collection not found for slug: ${collectionSlug} in project: ${projectSlug}`);
    return reply.status(404).send({ error: "Project or Collection not found" });
  }

  // 2. Fetch all APIs for this collection
  const apis = db.prepare(`
    SELECT * FROM apis 
    WHERE collection_id = ? AND method = ?
  `).all(collectionId, method) as any[];

  // 3. Match endpoint
  let matchedApi: any = null;
  let pathParams: any = {};

  // Normalize endpoint path (ensure it starts with /)
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;

  for (const api of apis) {
    // api.endpoint might be like "/users/:id"
    // We use path-to-regexp match
    try {
      const matcher = match(api.endpoint, { decode: decodeURIComponent });
      const result = matcher(normalizedPath);

      if (result) {
        matchedApi = api;
        pathParams = result.params;
        break;
      }
    } catch (e) {
      console.warn(`Invalid route pattern for API ${api.id}: ${api.endpoint}`);
    }
  }

  if (!matchedApi) {
    console.warn(`[MOCK 404] No API matched for path: ${normalizedPath} with method: ${method}`);
    console.log(`[MOCK DEBUG] Available endpoints for this collection:`, apis.map(a => a.endpoint));
    return reply.status(404).send({ error: "Mock API not found" });
  }

  // 4. Execute Mock Logic
  try {
    // Extract request data
    const query = req.query || {};
    const headers = req.headers || {};
    const params = { ...pathParams, ...(req.params as any || {}) }; // Merge path params
    const body = req.body || {};

    // Prepare Handlebars template context
    const templateContext = {
      query,
      headers,
      params,
      body,
      now: new Date().toISOString(),
      faker,
    };

    // Compile and render the response body template
    let renderedBody: string;
    try {
      const template = Handlebars.compile(matchedApi.response_body);
      renderedBody = template(templateContext);
    } catch (templateError: any) {
      throw new Error(`Handlebars template compilation failed: ${templateError.message}`);
    }

    // Apply delay
    const delayMs = Math.max(0, matchedApi.delay_ms || 0);
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Process response based on response_type
    let responseData: any = renderedBody;
    const contentType = matchedApi.response_type || "application/json";

    if (contentType === "application/json") {
      try {
        responseData = JSON.parse(renderedBody);
      } catch (parseError) {
        responseData = renderedBody;
      }
      reply.type("application/json");
    } else {
      reply.type(contentType);
    }

    // Set status code
    reply.status(matchedApi.status_code);

    // Log the request
    logRequest(matchedApi.id, { query, headers, params }, body, {
      status_code: matchedApi.status_code,
      response_type: contentType,
      response_body: responseData,
    });

    return reply.send(responseData);

  } catch (error: any) {
    // Log error
    logRequest(matchedApi.id, {
      error: error.message,
      query: req.query || {},
      headers: req.headers || {},
      params: pathParams,
    }, req.body || {}, {
      error: error.message,
      stack: error.stack,
    });

    return reply.status(500).send({
      error: "Failed to process mock request",
      message: error.message,
    });
  }
}
