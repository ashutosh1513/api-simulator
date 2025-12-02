const BASE = "http://127.0.0.1:5050"; 
// DO NOT USE "localhost" (your machine has IPv6 issues)

export async function listProjects() {
  const r = await fetch(`${BASE}/projects`);
  if (!r.ok) throw new Error("Failed to load projects");
  return r.json();
}

export async function listCollections(projectId: string) {
  const r = await fetch(`${BASE}/projects/${projectId}/collections`);
  if (!r.ok) throw new Error("Failed to load collections");
  return r.json();
}

export async function createCollection(projectId: string, data: any) {
  const r = await fetch(`${BASE}/projects/${projectId}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Failed to create collection");
  return r.json();
}


export async function createProject(data: any) {
  const r = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function deleteProject(id: string) {
  const r = await fetch(`${BASE}/projects/${id}`, { method: "DELETE" });
  return r.json();
}

export async function deleteCollection(id: string) {
  const r = await fetch(`${BASE}/collections/${id}`, { method: "DELETE" });
  return r.json();
}

