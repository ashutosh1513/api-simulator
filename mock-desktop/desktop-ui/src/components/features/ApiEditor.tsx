import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

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

interface ApiEditorProps {
    collectionId: string | null;
    selectedApi: Api | null;
    isCreating: boolean;
    onSave: () => void;
    onCancel: () => void;
}

export function ApiEditor({
    collectionId,
    selectedApi,
    isCreating,
    onSave,
    onCancel,
}: ApiEditorProps) {
    const [method, setMethod] = useState("GET");
    const [endpoint, setEndpoint] = useState("");
    const [statusCode, setStatusCode] = useState(200);
    const [responseType, setResponseType] = useState("application/json");
    const [delayMs, setDelayMs] = useState(0);
    const [responseBody, setResponseBody] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isCreating) {
            resetForm();
        } else if (selectedApi) {
            populateForm(selectedApi);
        }
    }, [selectedApi, isCreating]);

    function resetForm() {
        setMethod("GET");
        setEndpoint("");
        setStatusCode(200);
        setResponseType("application/json");
        setDelayMs(0);
        setResponseBody("");
    }

    function populateForm(api: Api) {
        setMethod(api.method);
        setEndpoint(api.endpoint);
        setStatusCode(api.status_code);
        setResponseType(api.response_type);
        setDelayMs(api.delay_ms);
        setResponseBody(api.response_body);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!collectionId) return;

        setIsSubmitting(true);
        try {
            const url = isCreating
                ? `${BASE}/collections/${collectionId}/apis`
                : `${BASE}/apis/${selectedApi?.id}`;

            const apiMethod = isCreating ? "POST" : "PUT";

            const response = await fetch(url, {
                method: apiMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    method,
                    endpoint: endpoint.trim(),
                    status_code: statusCode,
                    response_type: responseType,
                    delay_ms: Math.max(0, delayMs),
                    response_body: responseBody,
                }),
            });

            if (response.ok) {
                onSave();
            } else {
                const err = await response.json();
                alert(err.message || "Failed to save API");
            }
        } catch (error) {
            console.error("Failed to save API:", error);
            alert("Failed to save API");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                        Method
                    </label>
                    <select
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                    >
                        {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-span-3">
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                        Endpoint
                    </label>
                    <Input
                        placeholder="/users/:id"
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                        Status Code
                    </label>
                    <Input
                        type="number"
                        value={statusCode}
                        onChange={(e) => setStatusCode(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                        Response Type
                    </label>
                    <select
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                        value={responseType}
                        onChange={(e) => setResponseType(e.target.value)}
                    >
                        <option value="application/json">application/json</option>
                        <option value="text/plain">text/plain</option>
                        <option value="text/html">text/html</option>
                    </select>
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                        Delay (ms)
                    </label>
                    <Input
                        type="number"
                        value={delayMs}
                        onChange={(e) => setDelayMs(Number(e.target.value))}
                    />
                </div>
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">
                    Response Body
                </label>
                <textarea
                    className="h-[400px] w-full rounded-md border border-border bg-panel p-4 font-mono text-sm text-text focus:border-primary focus:outline-none"
                    value={responseBody}
                    onChange={(e) => setResponseBody(e.target.value)}
                    placeholder='{"message": "Hello World"}'
                    required
                />
                <p className="mt-2 text-xs text-gray-500">
                    Supports Handlebars: {"{{faker.person.firstName()}}"}, {"{{query.id}}"},
                    etc.
                </p>
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    <Save size={16} className="mr-2" />
                    {isSubmitting ? "Saving..." : "Save API"}
                </Button>
            </div>
        </form>
    );
}
