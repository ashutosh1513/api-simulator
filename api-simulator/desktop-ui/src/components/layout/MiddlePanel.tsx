import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ApiList } from "../features/ApiList";

const BASE = "http://127.0.0.1:5050";

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

interface MiddlePanelProps {
    collectionId: string | null;
    selectedApiId: string | null;
    onSelectApi: (api: Api | null) => void;
    onCreateApi: () => void;
    refreshTrigger: number;
}

export function MiddlePanel({
    collectionId,
    selectedApiId,
    onSelectApi,
    onCreateApi,
    refreshTrigger,
}: MiddlePanelProps) {
    const [apis, setApis] = useState<Api[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (collectionId) {
            loadApis();
        } else {
            setApis([]);
        }
    }, [collectionId, refreshTrigger]);

    async function loadApis() {
        if (!collectionId) return;
        setLoading(true);
        try {
            const response = await fetch(`${BASE}/collections/${collectionId}/apis`);
            if (response.ok) {
                const data = await response.json();
                setApis(data);
            }
        } catch (error) {
            console.error("Failed to load APIs:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteApi(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this API?")) return;
        try {
            const response = await fetch(`${BASE}/apis/${id}`, { method: "DELETE" });
            if (response.ok) {
                loadApis();
                if (selectedApiId === id) {
                    onSelectApi(null);
                }
            }
        } catch (error) {
            console.error("Failed to delete API:", error);
        }
    }

    const filteredApis = apis.filter((api) =>
        api.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-[350px] flex-col border-r border-border bg-panel">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-border p-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-text">APIs</h2>
                    <Button size="sm" onClick={onCreateApi} disabled={!collectionId}>
                        <Plus size={16} className="mr-2" /> New
                    </Button>
                </div>
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <Input
                        placeholder="Filter APIs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        disabled={!collectionId}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
                <ApiList
                    apis={filteredApis}
                    selectedApiId={selectedApiId}
                    onSelectApi={onSelectApi}
                    onDeleteApi={handleDeleteApi}
                    loading={loading}
                    collectionId={collectionId}
                />
            </div>
        </div>
    );
}
