import { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ApiTester } from "./ApiTester";

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
}

interface ApiPreviewProps {
    api: Api;
}

export function ApiPreview({ api }: ApiPreviewProps) {
    const [mockUrl, setMockUrl] = useState("");

    useEffect(() => {
        generateMockUrl(api);
    }, [api]);

    async function generateMockUrl(api: Api) {
        try {
            const r1 = await fetch(`${BASE}/collections/${api.collection_id}`);
            if (!r1.ok) return;
            const collection = await r1.json();

            const r2 = await fetch(`${BASE}/projects/${collection.project_id}`);
            if (!r2.ok) return;
            const project = await r2.json();

            const slugify = (text: string) =>
                text
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, "")
                    .replace(/[\s_-]+/g, "-")
                    .replace(/^-+|-+$/g, "");

            const projectSlug = slugify(project.name);
            const collectionSlug = collection.slug;

            const normalizedEndpoint = api.endpoint.trim().startsWith("/")
                ? api.endpoint.trim()
                : `/${api.endpoint.trim()}`;

            setMockUrl(
                `http://127.0.0.1:5050/mock/${projectSlug}/${collectionSlug}${normalizedEndpoint}`
            );
        } catch (e) {
            console.error("Failed to generate mock URL", e);
        }
    }

    const [activeTab, setActiveTab] = useState<"preview" | "test">("preview");

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Header Info */}
            <div className="flex items-center gap-4">
                <Badge variant={api.method as any} className="text-lg px-3 py-1">
                    {api.method}
                </Badge>
                <h1 className="font-mono text-xl text-text">{api.endpoint}</h1>
                <Badge variant="default" className="ml-auto">
                    Status: {api.status_code}
                </Badge>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setActiveTab("preview")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "preview"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-400 hover:text-text"
                        }`}
                >
                    Preview
                </button>
                <button
                    onClick={() => setActiveTab("test")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "test"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-400 hover:text-text"
                        }`}
                >
                    Test API
                </button>
            </div>

            {activeTab === "preview" ? (
                <div className="space-y-8">
                    {/* Mock URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Mock URL</label>
                        <div className="flex items-center gap-2 rounded-md border border-border bg-panel p-3">
                            <code className="flex-1 font-mono text-sm text-green-400">
                                {mockUrl || "Loading..."}
                            </code>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => navigator.clipboard.writeText(mockUrl)}
                                title="Copy URL"
                            >
                                <Copy size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* Response Preview */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                            Response Body
                        </label>
                        <div className="relative rounded-md border border-border bg-panel p-4">
                            <pre className="overflow-x-auto font-mono text-sm text-gray-300">
                                {api.response_body}
                            </pre>
                            <div className="absolute right-2 top-2 text-xs text-gray-500">
                                {api.response_type}
                            </div>
                        </div>
                    </div>

                    {/* cURL Preview */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">cURL</label>
                        <div className="rounded-md border border-border bg-panel p-4 overflow-x-auto">
                            <pre className="font-mono text-sm text-blue-300">
                                {`curl -X ${api.method} "${mockUrl}"`}
                            </pre>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-[600px]">
                    {/* We need to extract project and collection slugs from the mockUrl or pass them as props. 
                        Since mockUrl is generated async, we might not have it immediately.
                        But we can parse it from the mockUrl state if available, or fetch it again.
                        Actually, ApiPreview generates mockUrl. Let's parse it.
                        Format: http://.../mock/projectSlug/collectionSlug/endpoint
                    */}
                    {mockUrl ? (
                        (() => {
                            try {
                                const urlObj = new URL(mockUrl);
                                const parts = urlObj.pathname.split("/");
                                // /mock/project/collection/endpoint...
                                // parts[0] = ""
                                // parts[1] = "mock"
                                // parts[2] = projectSlug
                                // parts[3] = collectionSlug
                                const projectSlug = parts[2];
                                const collectionSlug = parts[3];

                                return (
                                    <ApiTester
                                        api={api}
                                        projectSlug={projectSlug}
                                        collectionSlug={collectionSlug}
                                    />
                                );
                            } catch {
                                return <div>Error parsing mock URL</div>;
                            }
                        })()
                    ) : (
                        <div>Loading tester...</div>
                    )}
                </div>
            )}
        </div>
    );
}
