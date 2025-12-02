import React, { useEffect, useState } from "react";

interface ApiListProps {
  collectionId: string | null;
}

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
  updated_at?: string | null;
}

interface Collection {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

const BASE = "http://127.0.0.1:5050";

// Helper function to generate a URL-friendly slug from a string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export default function ApiList({ collectionId }: ApiListProps) {
  const [apis, setApis] = useState<Api[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewApi, setPreviewApi] = useState<Api | null>(null);
  const [collectionSlug, setCollectionSlug] = useState<string | null>(null);
  const [projectSlug, setProjectSlug] = useState<string | null>(null);

  // Fetch APIs for the collection
  const loadApis = async () => {
    if (!collectionId) {
      setApis([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch APIs
      const response = await fetch(`${BASE}/collections/${collectionId}/apis`);
      if (!response.ok) {
        throw new Error("Failed to load APIs");
      }
      const data = await response.json();
      setApis(data);

      // Fetch collection and project details for URL generation
      await loadCollectionAndProjectDetails(collectionId);
    } catch (err: any) {
      setError(err.message || "Failed to load APIs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch collection and project details to build mock URL
  // IMPORTANT: Uses actual collection.slug from backend API response, not a literal string
  const loadCollectionAndProjectDetails = async (collectionId: string) => {
    try {
      // Fetch all projects
      const projectsResponse = await fetch(`${BASE}/projects`);
      if (!projectsResponse.ok) return;
      const projects: Project[] = await projectsResponse.json();

      // Find the collection by searching through all projects' collections
      for (const project of projects) {
        const collectionsResponse = await fetch(
          `${BASE}/projects/${project.id}/collections`
        );
        if (!collectionsResponse.ok) continue;
        const collections: Collection[] = await collectionsResponse.json();

        const collection = collections.find((c) => c.id === collectionId);
        if (collection) {
          // Use actual collection.slug from backend (collections.slug column)
          setCollectionSlug(collection.slug);
          setProjectSlug(slugify(project.name));
          break;
        }
      }
    } catch (err) {
      console.error("Failed to load collection/project details:", err);
    }
  };

  useEffect(() => {
    loadApis();
  }, [collectionId]);

  const handleDelete = async (apiId: string) => {
    if (!confirm("Are you sure you want to delete this API?")) {
      return;
    }

    try {
      const response = await fetch(`${BASE}/apis/${apiId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete API");
      }

      // Refresh the list
      await loadApis();
    } catch (err: any) {
      alert(err.message || "Failed to delete API");
    }
  };

  const handlePreview = (api: Api) => {
    setPreviewApi(api);
  };

  const closePreview = () => {
    setPreviewApi(null);
  };

  const buildMockUrl = (api: Api): string => {
    if (!projectSlug || !collectionSlug) {
      return "Loading...";
    }

    // Normalize endpoint: ensure it starts with / and trim whitespace
    const normalizedEndpoint = api.endpoint.trim().startsWith("/")
      ? api.endpoint.trim()
      : `/${api.endpoint.trim()}`;

    // Use actual collection slug from backend (collections.slug), not a literal string
    return `http://127.0.0.1:5050/mock/${projectSlug}/${collectionSlug}${normalizedEndpoint}`;
  };

  const buildCurlCommand = (api: Api): string => {
    const url = buildMockUrl(api);
    const method = api.method.toUpperCase();

    if (method === "GET" || method === "DELETE" || method === "HEAD") {
      return `curl -X ${method} "${url}"`;
    } else {
      return `curl -X ${method} "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`;
    }
  };

  if (!collectionId) {
    return (
      <div className="p-6 bg-white rounded-lg border">
        <p className="text-gray-500">Please select a collection to view APIs</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 bg-white rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">APIs</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading APIs...</p>
        ) : apis.length === 0 ? (
          <p className="text-gray-500">No APIs found in this collection</p>
        ) : (
          <div className="space-y-3">
            {apis.map((api) => (
              <div
                key={api.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                      {api.method.toUpperCase()}
                    </span>
                    <span className="font-mono text-sm">{api.endpoint}</span>
                    <span className="text-gray-500 text-sm">
                      (Status: {api.status_code})
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(api)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleDelete(api.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewApi && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">API Preview</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Mock URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mock URL
                </label>
                <div className="p-3 bg-gray-100 rounded border font-mono text-sm break-all">
                  {buildMockUrl(previewApi)}
                </div>
              </div>

              {/* cURL Example */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  cURL Example
                </label>
                <div className="p-3 bg-gray-100 rounded border font-mono text-sm whitespace-pre-wrap break-all">
                  {buildCurlCommand(previewApi)}
                </div>
              </div>

              {/* API Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method
                  </label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {previewApi.method.toUpperCase()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Code
                  </label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {previewApi.status_code}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Response Type
                  </label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {previewApi.response_type}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay
                  </label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {previewApi.delay_ms} ms
                  </div>
                </div>
              </div>

              {/* Response Body Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Body Template
                </label>
                <div className="p-3 bg-gray-100 rounded border font-mono text-sm whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                  {previewApi.response_body}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

