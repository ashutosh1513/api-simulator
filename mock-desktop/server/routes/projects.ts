import { FastifyInstance } from "fastify";
import { db } from "../database/db";
import { randomUUID } from "crypto";

export async function projectRoutes(app: FastifyInstance) {

  // CREATE PROJECT
  app.post("/projects", async (req, reply) => {
    const { name, description } = req.body as any;

    if (!name) {
      return reply.status(400).send({ error: "Project name is required" });
    }

    const id = randomUUID();
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (id, name, description, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, name, description ?? "", created_at);

    return { id, name, description, created_at };
  });

  // GET ALL PROJECTS
  app.get("/projects", async () => {
    const rows = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    return rows;
  });

  // GET SINGLE PROJECT (optional)
  app.get("/projects/:id", async (req) => {
    const id = (req.params as any).id;
    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    return row ?? {};
  });

  // DELETE PROJECT
  app.delete("/projects/:id", async (req, reply) => {
    const projectId = (req.params as any).id;

    const exists = db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
    if (!exists) {
      return reply.status(404).send({ error: "Project not found" });
    }

    // delete collections
    db.prepare("DELETE FROM collections WHERE project_id = ?").run(projectId);

    // delete project
    db.prepare("DELETE FROM projects WHERE id = ?").run(projectId);

    return { success: true };
  });
}
