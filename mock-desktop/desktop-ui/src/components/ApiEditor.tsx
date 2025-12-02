import React, { useState } from "react";

interface ApiEditorProps {
  collectionId: string | null;
  onCreated?: () => void;
}

export default function ApiEditor({ collectionId, onCreated }: ApiEditorProps) {
  const [method, setMethod] = useState<string>("GET");
  const [endpoint, setEndpoint] = useState<string>("");
  const [statusCode, setStatusCode] = useState<number>(200);
  const [responseType, setResponseType] = useState<string>("application/json");
  const [delayMs, setDelayMs] = useState<number>(0);
  const [responseBody, setResponseBody] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collectionId) {
      setError("No collection selected");
      return;
    }

    if (!endpoint.trim() || !responseBody.trim()) {
      setError("Endpoint and Response Body are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:5050/collections/${collectionId}/apis`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            method,
            endpoint: endpoint.trim(), // Backend will normalize leading slash
            status_code: statusCode,
            response_type: responseType,
            delay_ms: Math.max(0, delayMs), // Ensure non-negative
            response_body: responseBody,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || "Failed to create API"
        );
      }

      // Clear form fields
      setMethod("GET");
      setEndpoint("");
      setStatusCode(200);
      setResponseType("application/json");
      setDelayMs(0);
      setResponseBody("");

      // Call callback if provided
      if (onCreated) {
        onCreated();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create API");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!collectionId) {
    return (
      <div className="p-6 bg-white rounded-lg border">
        <p className="text-gray-500">Please select a collection to create an API</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h2 className="text-xl font-semibold mb-4">Create New API</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Method
          </label>
          <select
            className="w-full p-2 border rounded"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            required
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        {/* Endpoint */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Endpoint
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="/users/:id"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            required
          />
        </div>

        {/* Status Code and Response Type in a row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Code
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={statusCode}
              onChange={(e) => setStatusCode(parseInt(e.target.value) || 200)}
              min={100}
              max={599}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response Type
            </label>
            <select
              className="w-full p-2 border rounded"
              value={responseType}
              onChange={(e) => setResponseType(e.target.value)}
            >
              <option value="application/json">application/json</option>
              <option value="text/plain">text/plain</option>
              <option value="text/html">text/html</option>
            </select>
          </div>
        </div>

        {/* Delay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delay (ms)
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={delayMs}
            onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>

        {/* Response Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Response Body
          </label>
          <textarea
            className="w-full p-2 border rounded font-mono text-sm"
            rows={10}
            placeholder='{"message": "Hello {{faker.person.firstName()}}"}'
            value={responseBody}
            onChange={(e) => setResponseBody(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Supports Handlebars templates. Use {"{{query}}"}, {"{{headers}}"}, {"{{params}}"}, {"{{body}}"}, {"{{now}}"}, or {"{{faker.*}}"}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create API"}
        </button>
      </form>
    </div>
  );
}

