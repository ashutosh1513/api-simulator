import { FastifyInstance } from "fastify";
import { db } from "../database/db";
import { randomUUID } from "crypto";

export async function collectionRoutes(app: FastifyInstance) {
  // Create collection
  app.post("/projects/:projectId/collections", async (req, reply) => {
    const projectId = (req.params as any).projectId;
    const { name, slug } = req.body as any;

    // Sanitize slug: lowercase, replace spaces with hyphens, remove special chars
    const sanitizedSlug = (slug || "")
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    if (!name || !sanitizedSlug) {
      return reply.status(400).send({ error: "Name & valid slug required" });
    }

    // Optionally verify project exists
    const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    const id = randomUUID();
    const created_at = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO collections (id, project_id, name, slug, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(id, projectId, name, sanitizedSlug, created_at);
    } catch (err) {
      app.log.error(err, "Failed insert collection");
      return reply.status(500).send({ error: "Failed to create collection" });
    }

    return { id, projectId, name, slug: sanitizedSlug, created_at };
  });

  // List collections for a project
  app.get("/projects/:projectId/collections", async (req, reply) => {
    const projectId = (req.params as any).projectId;

    // Optionally verify project exists
    const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    const rows = db
      .prepare("SELECT id, project_id as projectId, name, slug, created_at as createdAt FROM collections WHERE project_id = ? ORDER BY created_at DESC")
      .all(projectId);

    return rows;
  });

  // Get single collection
  app.get("/collections/:id", async (req, reply) => {
    const id = (req.params as any).id;
    const row = db.prepare("SELECT * FROM collections WHERE id = ?").get(id);
    if (!row) {
      return reply.status(404).send({ error: "Collection not found" });
    }
    return row;
  });

  // Export collection
  app.get("/collections/:id/export", async (req, reply) => {
    const collectionId = (req.params as any).id;

    const collection = db.prepare("SELECT * FROM collections WHERE id = ?").get(collectionId);
    if (!collection) {
      return reply.status(404).send({ error: "Collection not found" });
    }

    const apis = db.prepare("SELECT * FROM apis WHERE collection_id = ?").all(collectionId);

    return { collection, apis };
  });

  app.delete("/collections/:id", async (req, reply) => {
    const collectionId = (req.params as any).id;

    const exists = db.prepare("SELECT id FROM collections WHERE id = ?").get(collectionId);
    if (!exists) {
      return reply.status(404).send({ error: "Collection not found" });
    }

    db.prepare("DELETE FROM collections WHERE id = ?").run(collectionId);

    return { success: true };
  });

}
