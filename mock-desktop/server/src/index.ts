import Fastify from "fastify";
import { projectRoutes } from "../routes/projects";
import { collectionRoutes } from "../routes/collections";
import cors from "@fastify/cors";

const server = Fastify({ logger: true });
server.register(cors, {
  origin: "*",  // allow Electron renderer
  methods: ["GET", "POST", "PUT", "DELETE"]
});
server.register(projectRoutes);
server.register(collectionRoutes);
server.get("/health", async () => {
  return { status: "OK", app: "Mock Server MVP" };
});



const start = async () => {
  try {
    // ✅ CRITICAL: "::" for dual-stack (IPv4 + IPv6) binding
    // This binds to BOTH 0.0.0.0:5050 AND [::]:5050
    await server.listen({
      port: 5050,
      host: "::"  // Supports localhost, 127.0.0.1, ::1, and all interfaces
    });

    const address = server.server.address();
    console.log("✅ Mock server running on:");
    console.log("   http://127.0.0.1:5050");
    console.log("   http://localhost:5050");
    console.log("   http://[::1]:5050");
    console.log(`\n📊 Server bound to: ${JSON.stringify(address)}`);
  } catch (err) {
    console.error("❌ Server failed to start:", err);
    process.exit(1);
  }
};

start();
