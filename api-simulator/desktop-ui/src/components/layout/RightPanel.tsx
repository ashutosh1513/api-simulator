import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { ApiPreview } from "../features/ApiPreview";
import { ApiEditor } from "../features/ApiEditor";

interface Api {
    id: string;
    collection_id: string;
    method: string;
    endpoint: string;
    status_code: number;
    response_type: string;
    response_body: string;
    delay_ms: number;
    created_at: string;
}

interface RightPanelProps {
    collectionId: string | null;
    selectedApi: Api | null;
    isCreating: boolean;
    onSave: () => void;
    onCancel: () => void;
}

export function RightPanel({
    collectionId,
    selectedApi,
    isCreating,
    onSave,
    onCancel,
}: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");

    useEffect(() => {
        if (isCreating) {
            setActiveTab("edit");
        } else if (selectedApi) {
            setActiveTab("preview");
        }
    }, [selectedApi, isCreating]);

    if (!selectedApi && !isCreating) {
        return (
            <div className="flex h-full flex-1 items-center justify-center bg-background text-gray-500">
                Select an API to view details
            </div>
        );
    }

    return (
        <div className="flex h-full flex-1 flex-col bg-background">
            {/* Tabs */}
            <div className="flex border-b border-border bg-panel px-4">
                <button
                    onClick={() => setActiveTab("preview")}
                    disabled={isCreating}
                    className={cn(
                        "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                        activeTab === "preview"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-400 hover:text-gray-200",
                        isCreating && "cursor-not-allowed opacity-50"
                    )}
                >
                    Preview
                </button>
                <button
                    onClick={() => setActiveTab("edit")}
                    className={cn(
                        "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                        activeTab === "edit"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-400 hover:text-gray-200"
                    )}
                >
                    {isCreating ? "Create New API" : "Edit API"}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "preview" && selectedApi ? (
                    <ApiPreview api={selectedApi} />
                ) : (
                    <ApiEditor
                        collectionId={collectionId}
                        selectedApi={selectedApi}
                        isCreating={isCreating}
                        onSave={onSave}
                        onCancel={onCancel}
                    />
                )}
            </div>
        </div>
    );
}
