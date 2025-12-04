import { FastifyInstance } from "fastify";
import { db } from "../database/db";
import { randomUUID } from "crypto";

export async function logRoutes(app: FastifyInstance) {
    // POST /request-logs
    app.post("/request-logs", async (req, reply) => {
        const {
            apiId,
            url,
            method,
            headers,
            query,
            params,
            body,
            response,
            durationMs,
            timestamp,
        } = req.body as any;

        const id = randomUUID();
        const finalTimestamp = timestamp || new Date().toISOString();

        // Sanitize/Truncate large bodies to prevent DB bloat
        const sanitize = (data: any) => {
            if (!data) return null;
            const str = typeof data === "string" ? data : JSON.stringify(data);
            return str.length > 10000 ? str.substring(0, 10000) + "...(truncated)" : str;
        };

        try {
            db.prepare(`
        INSERT INTO request_logs (
          id, 
          api_id, 
          timestamp, 
          request_meta, 
          request_body, 
          response_sent
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
                id,
                apiId || null,
                finalTimestamp,
                JSON.stringify({
                    url,
                    method,
                    headers,
                    query,
                    params,
                    durationMs,
                }),
                sanitize(body),
                JSON.stringify(response)
            );

            return { success: true, id };
        } catch (err) {
            app.log.error(err, "Failed to save request log");
            return reply.status(500).send({ error: "Failed to save request log" });
        }
    });
}
