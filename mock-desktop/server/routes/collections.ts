import { FastifyInstance } from "fastify";
import { db } from "../database/db";
import { randomUUID } from "crypto";

export async function collectionRoutes(app: FastifyInstance) {
  // Create collection
  app.post("/projects/:projectId/collections", async (req, reply) => {
    const projectId = (req.params as any).projectId;
    const { name, slug } = req.body as any;

    if (!name || !slug) {
      return reply.status(400).send({ error: "Name & slug required" });
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
      stmt.run(id, projectId, name, slug, created_at);
    } catch (err) {
      app.log.error(err, "Failed insert collection");
      return reply.status(500).send({ error: "Failed to create collection" });
    }

    return { id, projectId, name, slug, created_at };
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
