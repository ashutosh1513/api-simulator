import React from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";

interface Api {
    id: string;
    method: string;
    endpoint: string;
    status_code: number;
}

interface ApiListProps {
    apis: Api[];
    selectedApiId: string | null;
    onSelectApi: (api: any) => void;
    onDeleteApi: (id: string, e: React.MouseEvent) => void;
    loading: boolean;
    collectionId: string | null;
}

export function ApiList({
    apis,
    selectedApiId,
    onSelectApi,
    onDeleteApi,
    loading,
    collectionId,
}: ApiListProps) {
    if (!collectionId) {
        return (
            <div className="mt-10 text-center text-sm text-gray-500">
                Select a collection
            </div>
        );
    }

    if (loading) {
        return (
            <div className="mt-10 text-center text-sm text-gray-500">Loading...</div>
        );
    }

    if (apis.length === 0) {
        return (
            <div className="mt-10 text-center text-sm text-gray-500">
                No APIs found
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {apis.map((api) => (
                <div
                    key={api.id}
                    onClick={() => onSelectApi(api)}
                    className={cn(
                        "group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-transparent p-3 transition-all hover:bg-white/5",
                        selectedApiId === api.id
                            ? "border-primary/50 bg-primary/10"
                            : "border-border/50 bg-background"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <Badge variant={api.method as any}>{api.method}</Badge>
                        <span className="text-xs text-gray-500">{api.status_code}</span>
                    </div>
                    <div className="font-mono text-sm text-text truncate">
                        {api.endpoint}
                    </div>

                    <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                        <button
                            onClick={(e) => onDeleteApi(api.id, e)}
                            className="rounded p-1 text-gray-400 hover:bg-red-900/30 hover:text-red-400"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
