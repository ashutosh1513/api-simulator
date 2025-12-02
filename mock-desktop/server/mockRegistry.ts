import { FastifyInstance } from "fastify";
import { db } from "./database/db";
import Handlebars from "handlebars";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";

/**
 * Type definition for an API row from the database
 */
interface ApiRow {
  id: string;
  collection_id: string;
  method: string;
  endpoint: string;
  status_code: number;
  response_type: string;
  response_body: string;
  delay_ms: number;
  created_at: string;
  updated_at?: string | null;
}

/**
 * Extended API row with project and collection slugs for route construction
 */
interface ApiRowWithSlugs extends ApiRow {
  project_slug: string;
  collection_slug: string;
}

/**
 * Registry entry tracking registered mock routes
 */
interface RegistryEntry {
  apiId: string;
  routeUrl: string;
  method: string;
  isDeleted: boolean;
}

/**
 * In-memory registry of all registered mock routes, keyed by apiId
 */
const mockRouteRegistry = new Map<string, RegistryEntry>();

/**
 * Helper function to generate a URL-friendly slug from a string
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Fetches an API row with project and collection slugs by joining tables
 * IMPORTANT: collection_slug comes from collections.slug column in the database
 */
function getApiRowWithSlugs(apiId: string): ApiRowWithSlugs | null {
  const row = db
    .prepare(`
      SELECT 
        a.id,
        a.collection_id,
        a.method,
        a.endpoint,
        a.status_code,
        a.response_type,
        a.response_body,
        a.delay_ms,
        a.created_at,
        a.updated_at,
        c.slug as collection_slug,
        p.name as project_name
      FROM apis a
      INNER JOIN collections c ON a.collection_id = c.id
      INNER JOIN projects p ON c.project_id = p.id
      WHERE a.id = ?
    `)
    .get(apiId) as any;

  if (!row) {
    return null;
  }

  // Verify collection_slug was retrieved from database
  if (!row.collection_slug) {
    console.error(`Warning: collection_slug is missing for API ${apiId}. Collection may not exist.`);
    return null;
  }

  // Generate project slug from project name (since projects table doesn't have slug)
  const project_slug = slugify(row.project_name || row.id);

  return {
    id: row.id,
    collection_id: row.collection_id,
    method: row.method,
    endpoint: row.endpoint,
    status_code: row.status_code,
    response_type: row.response_type,
    response_body: row.response_body,
    delay_ms: row.delay_ms,
    created_at: row.created_at,
    updated_at: row.updated_at,
    project_slug,
    collection_slug: row.collection_slug, // This comes from collections.slug via JOIN
  };
}

/**
 * Constructs the mock route URL from API row data
 * Format: /mock/<projectSlug>/<collectionSlug><endpoint>
 * 
 * IMPORTANT: collection_slug comes from collections.slug column in the database (via JOIN)
 * NOT a literal string "collection"
 */
function buildMockRouteUrl(apiRow: ApiRowWithSlugs): string {
  // Normalize endpoint: ensure it starts with / and trim whitespace
  const normalizedEndpoint = apiRow.endpoint.trim().startsWith("/")
    ? apiRow.endpoint.trim()
    : `/${apiRow.endpoint.trim()}`;

  // Use actual collection slug from database (collections.slug)
  const collectionSlug = apiRow.collection_slug;
  const projectSlug = apiRow.project_slug;

  return `/mock/${projectSlug}/${collectionSlug}${normalizedEndpoint}`;
}

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
 * Creates a route handler for a mock API endpoint
 */
function createMockHandler(apiRow: ApiRowWithSlugs) {
  return async (req: any, reply: any) => {
    const registryEntry = mockRouteRegistry.get(apiRow.id);

    // Handle deleted routes: Fastify doesn't support removing routes at runtime,
    // so we mark them as deleted and return 410 Gone or 404 Not Found
    if (registryEntry?.isDeleted) {
      return reply.status(410).send({
        error: "This mock API has been deleted",
        message: "The requested endpoint is no longer available",
      });
    }

    try {
      // Extract request data
      const query = req.query || {};
      const headers = req.headers || {};
      const params = req.params || {};
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
      // Wrap in try-catch for better error handling
      let renderedBody: string;
      try {
        const template = Handlebars.compile(apiRow.response_body);
        renderedBody = template(templateContext);
      } catch (templateError: any) {
        throw new Error(`Handlebars template compilation failed: ${templateError.message}`);
      }

      // Apply delay if specified (ensure non-negative)
      const delayMs = Math.max(0, apiRow.delay_ms || 0);
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // Process response based on response_type
      let responseData: any = renderedBody;
      const contentType = apiRow.response_type || "application/json";

      if (contentType === "application/json") {
        try {
          responseData = JSON.parse(renderedBody);
        } catch (parseError) {
          // If JSON parsing fails, send as-is (might be valid JSON string already)
          responseData = renderedBody;
        }
        reply.type("application/json");
      } else if (contentType === "text/plain") {
        reply.type("text/plain");
      } else if (contentType === "text/html") {
        reply.type("text/html");
      } else {
        reply.type(contentType);
      }

      // Set status code
      reply.status(apiRow.status_code);

      // Log the request
      logRequest(apiRow.id, { query, headers, params }, body, {
        status_code: apiRow.status_code,
        response_type: contentType,
        response_body: responseData,
      });

      // Send response
      return reply.send(responseData);
    } catch (error: any) {
      // Log error request with full context
      logRequest(apiRow.id, {
        error: error.message,
        query: req.query || {},
        headers: req.headers || {},
        params: req.params || {},
      }, req.body || {}, {
        error: error.message,
        stack: error.stack,
      });

      reply.status(500).send({
        error: "Failed to process mock request",
        message: error.message,
      });
    }
  };
}

/**
 * Registers a single mock route for an API
 */
export function registerMockRoute(app: FastifyInstance, apiRow: ApiRow): void {
  // Get API row with slugs by joining with collections and projects
  const apiRowWithSlugs = getApiRowWithSlugs(apiRow.id);
  if (!apiRowWithSlugs) {
    console.error(`Failed to register mock route: API ${apiRow.id} not found or missing related data`);
    return;
  }

  // Build the route URL
  const routeUrl = buildMockRouteUrl(apiRowWithSlugs);

  // Normalize HTTP method to uppercase
  const method = apiRowWithSlugs.method.toUpperCase();

  // Check if route already exists and is active (not deleted)
  const existingEntry = mockRouteRegistry.get(apiRow.id);
  if (existingEntry && !existingEntry.isDeleted) {
    // Route is already registered and active, skip re-registration
    // Note: Fastify doesn't support removing routes, so we can't replace it
    // If you need to update, use updateMockRoute which marks old as deleted first
    console.warn(`Mock route for API ${apiRow.id} already registered at ${routeUrl}`);
    return;
  }

  // If route was deleted, we'll register it again (Fastify will have both, but new one takes precedence)

  // Register the route with Fastify
  // Fastify route registration based on method
  const routeHandler = createMockHandler(apiRowWithSlugs);

  try {
    switch (method) {
      case "GET":
        app.get(routeUrl, routeHandler);
        break;
      case "POST":
        app.post(routeUrl, routeHandler);
        break;
      case "PUT":
        app.put(routeUrl, routeHandler);
        break;
      case "PATCH":
        app.patch(routeUrl, routeHandler);
        break;
      case "DELETE":
        app.delete(routeUrl, routeHandler);
        break;
      case "HEAD":
        app.head(routeUrl, routeHandler);
        break;
      case "OPTIONS":
        app.options(routeUrl, routeHandler);
        break;
      default:
        console.error(`Unsupported HTTP method: ${method} for API ${apiRow.id}`);
        return;
    }

    // Register in our in-memory registry
    mockRouteRegistry.set(apiRow.id, {
      apiId: apiRow.id,
      routeUrl,
      method,
      isDeleted: false,
    });

    console.log(`Registered mock route: ${method} ${routeUrl} (API ID: ${apiRow.id})`);
  } catch (error: any) {
    console.error(`Failed to register mock route for API ${apiRow.id}:`, error.message);
  }
}

/**
 * Unregisters a mock route (marks as deleted since Fastify doesn't support route removal)
 * 
 * Note: Fastify does not support removing routes at runtime. Instead, we mark the route
 * as deleted in our registry. The route handler will check this flag and return 410 Gone
 * or 404 Not Found for deleted routes.
 */
export function unregisterMockRoute(app: FastifyInstance, apiId: string): void {
  const entry = mockRouteRegistry.get(apiId);
  if (entry) {
    entry.isDeleted = true;
    console.log(`Marked mock route as deleted: ${entry.method} ${entry.routeUrl} (API ID: ${apiId})`);
  } else {
    console.warn(`Mock route not found in registry: ${apiId}`);
  }
}

/**
 * Updates a mock route by unregistering the old one and registering the new one
 */
export function updateMockRoute(app: FastifyInstance, apiRow: ApiRow): void {
  // First unregister the old route
  unregisterMockRoute(app, apiRow.id);

  // Then register the updated route
  registerMockRoute(app, apiRow);
}

/**
 * Loads all APIs from the database and registers them as mock routes
 */
export function loadAllMocks(app: FastifyInstance): void {
  try {
    // Fetch all APIs from the database
    const apis = db
      .prepare(`
        SELECT 
          id,
          collection_id,
          method,
          endpoint,
          status_code,
          response_type,
          response_body,
          delay_ms,
          created_at,
          updated_at
        FROM apis
      `)
      .all() as ApiRow[];

    console.log(`Loading ${apis.length} mock API(s)...`);

    // Register each API as a mock route
    for (const apiRow of apis) {
      registerMockRoute(app, apiRow);
    }

    console.log(`Successfully loaded ${apis.length} mock API(s)`);
  } catch (error: any) {
    console.error("Failed to load mocks:", error.message);
    throw error;
  }
}

