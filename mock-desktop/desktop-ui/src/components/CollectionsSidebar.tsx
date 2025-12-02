import React, { useEffect, useState } from "react";
import {
  listProjects,
  listCollections,
  createCollection,
  createProject,
  deleteProject,
  deleteCollection
} from "../api";

export default function CollectionsSidebar() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionSlug, setNewCollectionSlug] = useState("");

  const [newProjectName, setNewProjectName] = useState("");

  async function loadProjects() {
    const ps = await listProjects();
    setProjects(ps);
    if (ps.length && !selectedProject) {
      setSelectedProject(ps[0].id);
    }
  }

  async function loadCollections() {
    if (!selectedProject) return;
    const cols = await listCollections(selectedProject);
    setCollections(cols);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadCollections();
  }, [selectedProject]);

  async function onCreateProject() {
    if (!newProjectName.trim()) return;
    await createProject({ name: newProjectName });
    setNewProjectName("");
    await loadProjects();
  }

  async function onCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newCollectionName || !newCollectionSlug) return;
    await createCollection(selectedProject!, {
      name: newCollectionName,
      slug: newCollectionSlug
    });
    setNewCollectionName("");
    setNewCollectionSlug("");
    await loadCollections();
  }

  return (
    <div className="flex h-full bg-gray-100">

      {/* LEFT SIDEBAR (Projects) */}
      <div className="w-64 bg-white border-r p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Projects</h2>

        <ul className="flex-1 overflow-auto space-y-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer
                ${selectedProject === p.id ? "bg-blue-100" : "hover:bg-gray-200"}
              `}
            >
              <span
                onClick={() => setSelectedProject(p.id)}
                className="font-medium"
              >
                {p.name}
              </span>

              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => deleteProject(p.id).then(loadProjects)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <input
            className="w-full p-2 border rounded mb-2"
            placeholder="New project"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <button
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            onClick={onCreateProject}
          >
            Create Project
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR (Collections) */}
      <div className="w-72 bg-white border-r p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Collections</h2>

        {selectedProject ? (
          <>
            <ul className="flex-1 overflow-auto space-y-2">
              {collections.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-200"
                >
                  <span>{c.name}</span>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteCollection(c.id).then(loadCollections)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <form className="mt-4 space-y-2" onSubmit={onCreateCollection}>
              <input
                className="w-full p-2 border rounded"
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
              <input
                className="w-full p-2 border rounded"
                placeholder="slug"
                value={newCollectionSlug}
                onChange={(e) => setNewCollectionSlug(e.target.value)}
              />
              <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                Add Collection
              </button>
            </form>
          </>
        ) : (
          <p className="text-gray-500">Select a project</p>
        )}
      </div>

      {/* MAIN AREA — Empty now */}
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold">Mock Desktop</h1>
        <p className="mt-2 text-gray-600">
          API Simulator will appear here in Phase 3.
        </p>
      </div>
    </div>
  );
}
