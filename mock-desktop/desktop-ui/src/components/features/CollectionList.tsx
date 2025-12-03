import React from "react";
import { FolderPlus, Trash2, ChevronRight, ChevronDown, Layers, Download } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";

interface Collection {
    id: string;
    name: string;
}

interface CollectionListProps {
    collections: Collection[];
    selectedCollection: string | null;
    selectedProject: string | null;
    onSelectCollection: (id: string) => void;
    onDeleteCollection: (id: string, e: React.MouseEvent) => void;
    onExportCollection: (id: string, e: React.MouseEvent) => void;
    isCreating: boolean;
    setIsCreating: (v: boolean) => void;
    newCollectionName: string;
    setNewCollectionName: (v: string) => void;
    newCollectionSlug: string;
    setNewCollectionSlug: (v: string) => void;
    onCreateCollection: (e: React.FormEvent) => void;
}

export function CollectionList({
    collections,
    selectedCollection,
    selectedProject,
    onSelectCollection,
    onDeleteCollection,
    onExportCollection,
    isCreating,
    setIsCreating,
    newCollectionName,
    setNewCollectionName,
    newCollectionSlug,
    setNewCollectionSlug,
    onCreateCollection,
}: CollectionListProps) {
    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground text-gray-400">
                    <Layers size={16} /> Collections
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCreating(!isCreating)}
                    disabled={!selectedProject}
                    title="Create Collection"
                >
                    <FolderPlus size={16} />
                </Button>
            </div>

            {!selectedProject ? (
                <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-gray-500">
                    Select a project to view collections
                </div>
            ) : (
                <>
                    {isCreating && (
                        <form onSubmit={onCreateCollection} className="px-4 pb-4 space-y-2">
                            <Input
                                autoFocus
                                placeholder="Collection Name"
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                className="h-8"
                            />
                            <Input
                                placeholder="Slug (e.g. users-api)"
                                value={newCollectionSlug}
                                onChange={(e) => {
                                    const val = e.target.value
                                        .toLowerCase()
                                        .replace(/[\s]+/g, "-")
                                        .replace(/[^a-z0-9-_]/g, "");
                                    setNewCollectionSlug(val);
                                }}
                                className="h-8"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsCreating(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" variant="primary">
                                    Create
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="flex-1 overflow-y-auto px-2 pb-2">
                        {collections.length === 0 && !isCreating ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No collections found
                            </div>
                        ) : (
                            collections.map((collection) => (
                                <div
                                    key={collection.id}
                                    onClick={() => onSelectCollection(collection.id)}
                                    className={cn(
                                        "group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                                        selectedCollection === collection.id
                                            ? "bg-primary/20 text-primary"
                                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                                    )}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        {selectedCollection === collection.id ? (
                                            <ChevronDown size={14} />
                                        ) : (
                                            <ChevronRight size={14} />
                                        )}
                                        <span className="truncate">{collection.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                            onClick={(e) => onExportCollection(collection.id, e)}
                                            className="text-gray-400 hover:text-blue-400"
                                            title="Export Collection"
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => onDeleteCollection(collection.id, e)}
                                            className="hover:text-red-400"
                                            title="Delete Collection"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
