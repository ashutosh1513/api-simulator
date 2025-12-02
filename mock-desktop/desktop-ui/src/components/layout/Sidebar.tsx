import React, { useState, useEffect } from "react";
import {
    listProjects,
    listCollections,
    createProject,
    deleteProject,
    createCollection,
    deleteCollection,
} from "../../api";
import { ProjectList } from "../features/ProjectList";
import { CollectionList } from "../features/CollectionList";

interface SidebarProps {
    selectedProject: string | null;
    selectedCollection: string | null;
    onSelectProject: (id: string | null) => void;
    onSelectCollection: (id: string | null) => void;
}

export function Sidebar({
    selectedProject,
    selectedCollection,
    onSelectProject,
    onSelectCollection,
}: SidebarProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [newCollectionSlug, setNewCollectionSlug] = useState("");

    // Load projects on mount
    useEffect(() => {
        loadProjects();
    }, []);

    // Load collections when project changes
    useEffect(() => {
        if (selectedProject) {
            loadCollections(selectedProject);
        } else {
            setCollections([]);
        }
    }, [selectedProject]);

    async function loadProjects() {
        try {
            const data = await listProjects();
            setProjects(data);
            // Auto-select first project if none selected and projects exist
            if (data.length > 0 && !selectedProject) {
                onSelectProject(data[0].id);
            }
        } catch (error) {
            console.error("Failed to load projects:", error);
        }
    }

    async function loadCollections(projectId: string) {
        try {
            const data = await listCollections(projectId);
            setCollections(data);
        } catch (error) {
            console.error("Failed to load collections:", error);
        }
    }

    async function handleCreateProject(e: React.FormEvent) {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        try {
            await createProject({ name: newProjectName });
            setNewProjectName("");
            setIsCreatingProject(false);
            loadProjects();
        } catch (error) {
            console.error("Failed to create project:", error);
        }
    }

    async function handleDeleteProject(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteProject(id);
            if (selectedProject === id) {
                onSelectProject(null);
                onSelectCollection(null);
            }
            loadProjects();
        } catch (error) {
            console.error("Failed to delete project:", error);
        }
    }

    async function handleCreateCollection(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedProject || !newCollectionName.trim() || !newCollectionSlug.trim())
            return;
        try {
            await createCollection(selectedProject, {
                name: newCollectionName,
                slug: newCollectionSlug,
            });
            setNewCollectionName("");
            setNewCollectionSlug("");
            setIsCreatingCollection(false);
            loadCollections(selectedProject);
        } catch (error) {
            console.error("Failed to create collection:", error);
        }
    }

    async function handleDeleteCollection(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this collection?")) return;
        try {
            await deleteCollection(id);
            if (selectedCollection === id) {
                onSelectCollection(null);
            }
            if (selectedProject) {
                loadCollections(selectedProject);
            }
        } catch (error) {
            console.error("Failed to delete collection:", error);
        }
    }

    return (
        <div className="flex h-full w-[300px] flex-col border-r border-border bg-sidebar text-text">
            <ProjectList
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={onSelectProject as any}
                onDeleteProject={handleDeleteProject}
                isCreating={isCreatingProject}
                setIsCreating={setIsCreatingProject}
                newProjectName={newProjectName}
                setNewProjectName={setNewProjectName}
                onCreateProject={handleCreateProject}
            />
            <CollectionList
                collections={collections}
                selectedCollection={selectedCollection}
                selectedProject={selectedProject}
                onSelectCollection={onSelectCollection as any}
                onDeleteCollection={handleDeleteCollection}
                isCreating={isCreatingCollection}
                setIsCreating={setIsCreatingCollection}
                newCollectionName={newCollectionName}
                setNewCollectionName={setNewCollectionName}
                newCollectionSlug={newCollectionSlug}
                setNewCollectionSlug={setNewCollectionSlug}
                onCreateCollection={handleCreateCollection}
            />
        </div>
    );
}
