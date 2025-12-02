import React from "react";
import { Folder, Trash2, Plus, Box } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";

interface Project {
    id: string;
    name: string;
}

interface ProjectListProps {
    projects: Project[];
    selectedProject: string | null;
    onSelectProject: (id: string) => void;
    onDeleteProject: (id: string, e: React.MouseEvent) => void;
    isCreating: boolean;
    setIsCreating: (v: boolean) => void;
    newProjectName: string;
    setNewProjectName: (v: string) => void;
    onCreateProject: (e: React.FormEvent) => void;
}

export function ProjectList({
    projects,
    selectedProject,
    onSelectProject,
    onDeleteProject,
    isCreating,
    setIsCreating,
    newProjectName,
    setNewProjectName,
    onCreateProject,
}: ProjectListProps) {
    return (
        <div className="flex flex-col border-b border-border">
            <div className="flex items-center justify-between p-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground text-gray-400">
                    <Box size={16} /> Projects
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCreating(!isCreating)}
                    title="Create Project"
                >
                    <Plus size={16} />
                </Button>
            </div>

            {isCreating && (
                <form onSubmit={onCreateProject} className="px-4 pb-4">
                    <div className="flex gap-2">
                        <Input
                            autoFocus
                            placeholder="Project Name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="h-8"
                        />
                        <Button type="submit" size="sm" variant="primary">
                            Add
                        </Button>
                    </div>
                </form>
            )}

            <div className="max-h-[200px] overflow-y-auto px-2 pb-2">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => onSelectProject(project.id)}
                        className={cn(
                            "group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                            selectedProject === project.id
                                ? "bg-primary/20 text-primary"
                                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        )}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Folder size={16} />
                            <span className="truncate">{project.name}</span>
                        </div>
                        <button
                            onClick={(e) => onDeleteProject(project.id, e)}
                            className="opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
