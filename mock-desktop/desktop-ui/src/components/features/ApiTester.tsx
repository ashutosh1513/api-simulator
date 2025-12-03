import { useState, useEffect } from "react";
import { Play, Save, Copy, Loader2, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";

interface ApiTesterProps {
    api: {
        id: string;
        method: string;
        endpoint: string;
        response_type: string;
        response_body: string;
    };
    projectSlug: string;
    collectionSlug: string;
}

interface KeyValue {
    key: string;
    value: string;
    enabled: boolean;
}

export function ApiTester({ api, projectSlug, collectionSlug }: ApiTesterProps) {
    const [method, setMethod] = useState(api.method);
    const [url, setUrl] = useState("");
    const [headers, setHeaders] = useState<KeyValue[]>([
        { key: "Content-Type", value: api.response_type || "application/json", enabled: true },
    ]);
    const [queryParams, setQueryParams] = useState<KeyValue[]>([]);
    const [pathParams, setPathParams] = useState<KeyValue[]>([]);
    const [body, setBody] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [saveLog, setSaveLog] = useState(true);
    const [activeTab, setActiveTab] = useState<"params" | "headers" | "body">("params");

    // Initialize state when API changes
    useEffect(() => {
        setMethod(api.method);

        // Extract path params from endpoint (e.g. /users/:id -> id)
        const matches = api.endpoint.match(/:[a-zA-Z0-9_]+/g) || [];
        const params = matches.map(m => ({
            key: m.substring(1), // remove :
            value: "",
            enabled: true
        }));
        setPathParams(params);

        // Set initial body if applicable
        if (["POST", "PUT", "PATCH"].includes(api.method.toUpperCase())) {
            // Try to pretty print if it's JSON
            try {
                const json = JSON.parse(api.response_body); // Using response body as a template/example? 
                // Actually usually request body is different, but for mock testing we might want to send something.
                // Let's leave it empty or default to {} for JSON
                setBody("{}");
            } catch {
                setBody("");
            }
        } else {
            setBody("");
        }

        // Construct base URL
        const normalizedEndpoint = api.endpoint.trim().startsWith("/")
            ? api.endpoint.trim()
            : `/${api.endpoint.trim()}`;

        // We don't set the full URL here because it depends on path params
        // But we can show the template
        setUrl(`http://127.0.0.1:5050/mock/${projectSlug}/${collectionSlug}${normalizedEndpoint}`);

    }, [api, projectSlug, collectionSlug]);

    const getFinalUrl = () => {
        let finalUrl = `http://127.0.0.1:5050/mock/${projectSlug}/${collectionSlug}`;
        let endpoint = api.endpoint.trim().startsWith("/") ? api.endpoint.trim() : `/${api.endpoint.trim()}`;

        // Replace path params
        pathParams.forEach(p => {
            if (p.enabled && p.value) {
                endpoint = endpoint.replace(`:${p.key}`, p.value);
            }
        });

        finalUrl += endpoint;

        // Append query params
        const activeQueryParams = queryParams.filter(p => p.enabled && p.key);
        if (activeQueryParams.length > 0) {
            const qs = activeQueryParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
            finalUrl += `?${qs}`;
        }

        return finalUrl;
    };

    const handleSend = async () => {
        setIsLoading(true);
        setResponse(null);
        const startTime = performance.now();

        const finalUrl = getFinalUrl();
        const activeHeaders = headers.reduce((acc, h) => {
            if (h.enabled && h.key) acc[h.key] = h.value;
            return acc;
        }, {} as Record<string, string>);

        try {
            const res = await fetch(finalUrl, {
                method,
                headers: activeHeaders,
                body: ["GET", "HEAD"].includes(method.toUpperCase()) ? undefined : body,
            });

            const duration = performance.now() - startTime;
            const status = res.status;
            const resHeaders = Object.fromEntries(res.headers.entries());
            const text = await res.text();

            let resBody = text;
            try {
                resBody = JSON.parse(text);
            } catch { }

            const responseData = {
                status,
                statusText: res.statusText,
                headers: resHeaders,
                body: resBody,
                duration: Math.round(duration),
                size: new Blob([text]).size,
            };

            setResponse(responseData);

            if (saveLog) {
                // Log to backend
                await fetch("http://127.0.0.1:5050/request-logs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        apiId: api.id,
                        url: finalUrl,
                        method,
                        headers: activeHeaders,
                        query: Object.fromEntries(queryParams.filter(p => p.enabled).map(p => [p.key, p.value])),
                        params: Object.fromEntries(pathParams.filter(p => p.enabled).map(p => [p.key, p.value])),
                        body: ["GET", "HEAD"].includes(method.toUpperCase()) ? null : body,
                        response: {
                            statusCode: status,
                            headers: resHeaders,
                            body: resBody
                        },
                        durationMs: Math.round(duration),
                    }),
                });
            }

        } catch (error: any) {
            setResponse({
                error: true,
                message: error.message,
                duration: Math.round(performance.now() - startTime),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const generateCurl = () => {
        const finalUrl = getFinalUrl();
        let curl = `curl -X ${method} "${finalUrl}"`;

        headers.filter(h => h.enabled && h.key).forEach(h => {
            curl += ` \\\n  -H "${h.key}: ${h.value}"`;
        });

        if (!["GET", "HEAD"].includes(method.toUpperCase()) && body) {
            // Escape single quotes
            const escapedBody = body.replace(/'/g, "'\\''");
            curl += ` \\\n  -d '${escapedBody}'`;
        }

        return curl;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const addRow = (setter: React.Dispatch<React.SetStateAction<KeyValue[]>>) => {
        setter(prev => [...prev, { key: "", value: "", enabled: true }]);
    };

    const removeRow = (setter: React.Dispatch<React.SetStateAction<KeyValue[]>>, index: number) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };

    const updateRow = (setter: React.Dispatch<React.SetStateAction<KeyValue[]>>, index: number, field: keyof KeyValue, value: any) => {
        setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    return (
        <div className="flex flex-col h-full bg-background text-text space-y-4">
            {/* Top Bar: Method, URL, Send */}
            <div className="flex gap-2">
                <select
                    className="bg-panel border border-border rounded px-3 py-2 font-mono text-sm"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                >
                    {["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"].map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                <div className="flex-1 relative">
                    <Input
                        value={getFinalUrl()}
                        readOnly
                        className="font-mono text-sm bg-panel text-gray-400"
                    />
                </div>
                <Button onClick={handleSend} disabled={isLoading} className="min-w-[100px]">
                    {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Play className="mr-2" size={16} />}
                    Send
                </Button>
            </div>

            {/* Tabs for Request Details */}
            <div className="flex border-b border-border">
                {(["params", "headers", "body"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-400 hover:text-text"
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2 px-2">
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={saveLog}
                            onChange={e => setSaveLog(e.target.checked)}
                            className="rounded border-gray-600 bg-transparent"
                        />
                        Save Log
                    </label>
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px] border border-border rounded bg-panel p-4 overflow-y-auto">
                {activeTab === "params" && (
                    <div className="space-y-4">
                        {/* Path Params */}
                        {pathParams.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Path Variables</h3>
                                <div className="space-y-2">
                                    {pathParams.map((p, i) => (
                                        <div key={p.key} className="flex gap-2 items-center">
                                            <span className="font-mono text-sm text-primary w-32 truncate">:{p.key}</span>
                                            <Input
                                                value={p.value}
                                                onChange={e => updateRow(setPathParams, i, "value", e.target.value)}
                                                placeholder="Value"
                                                className="flex-1 h-8"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Query Params */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase">Query Parameters</h3>
                                <Button size="sm" variant="ghost" onClick={() => addRow(setQueryParams)}>
                                    <Plus size={14} />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {queryParams.map((p, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            type="checkbox"
                                            checked={p.enabled}
                                            onChange={e => updateRow(setQueryParams, i, "enabled", e.target.checked)}
                                        />
                                        <Input
                                            value={p.key}
                                            onChange={e => updateRow(setQueryParams, i, "key", e.target.value)}
                                            placeholder="Key"
                                            className="flex-1 h-8"
                                        />
                                        <Input
                                            value={p.value}
                                            onChange={e => updateRow(setQueryParams, i, "value", e.target.value)}
                                            placeholder="Value"
                                            className="flex-1 h-8"
                                        />
                                        <Button size="icon" variant="ghost" onClick={() => removeRow(setQueryParams, i)}>
                                            <Trash2 size={14} className="text-red-400" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "headers" && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase">Request Headers</h3>
                            <Button size="sm" variant="ghost" onClick={() => addRow(setHeaders)}>
                                <Plus size={14} />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {headers.map((h, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input
                                        type="checkbox"
                                        checked={h.enabled}
                                        onChange={e => updateRow(setHeaders, i, "enabled", e.target.checked)}
                                    />
                                    <Input
                                        value={h.key}
                                        onChange={e => updateRow(setHeaders, i, "key", e.target.value)}
                                        placeholder="Key"
                                        className="flex-1 h-8"
                                    />
                                    <Input
                                        value={h.value}
                                        onChange={e => updateRow(setHeaders, i, "value", e.target.value)}
                                        placeholder="Value"
                                        className="flex-1 h-8"
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => removeRow(setHeaders, i)}>
                                        <Trash2 size={14} className="text-red-400" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "body" && (
                    <div className="h-full flex flex-col">
                        <textarea
                            className="flex-1 bg-background border border-border rounded p-2 font-mono text-sm resize-none focus:outline-none focus:border-primary"
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Request Body (JSON, Text, etc.)"
                        />
                    </div>
                )}
            </div>

            {/* Response Area */}
            {response && (
                <div className="border border-border rounded bg-panel overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
                        <div className="flex items-center gap-4">
                            <span className="font-medium text-sm text-gray-400">Response</span>
                            {!response.error && (
                                <>
                                    <Badge variant={response.status >= 200 && response.status < 300 ? "GET" : "DELETE"}>
                                        {response.status} {response.statusText}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{response.duration}ms</span>
                                    <span className="text-xs text-gray-500">{response.size} B</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-4 max-h-[300px] overflow-auto">
                        {response.error ? (
                            <div className="text-red-400 font-mono text-sm">
                                Error: {response.message}
                            </div>
                        ) : (
                            <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">
                                {typeof response.body === "object"
                                    ? JSON.stringify(response.body, null, 2)
                                    : response.body}
                            </pre>
                        )}
                    </div>
                </div>
            )}

            {/* cURL Snippet */}
            <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">cURL</h3>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generateCurl())}>
                        <Copy size={14} className="mr-2" />
                        Copy
                    </Button>
                </div>
                <div className="bg-panel border border-border rounded p-3 overflow-x-auto">
                    <pre className="font-mono text-xs text-blue-300 whitespace-pre-wrap">
                        {generateCurl()}
                    </pre>
                </div>
            </div>
        </div>
    );
}
