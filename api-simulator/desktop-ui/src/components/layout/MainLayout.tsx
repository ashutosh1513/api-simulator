import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MiddlePanel } from "./MiddlePanel";
import { RightPanel } from "./RightPanel";

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

export function MainLayout() {
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [selectedApi, setSelectedApi] = useState<Api | null>(null);
    const [isCreatingApi, setIsCreatingApi] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleSelectProject = (id: string | null) => {
        setSelectedProject(id);
        setSelectedCollection(null);
        setSelectedApi(null);
        setIsCreatingApi(false);
    };

    const handleSelectCollection = (id: string | null) => {
        setSelectedCollection(id);
        setSelectedApi(null);
        setIsCreatingApi(false);
    };

    const handleSelectApi = (api: Api | null) => {
        setSelectedApi(api);
        setIsCreatingApi(false);
    };

    const handleCreateApi = () => {
        setSelectedApi(null);
        setIsCreatingApi(true);
    };

    const handleSaveApi = () => {
        setIsCreatingApi(false);
        setRefreshTrigger((prev) => prev + 1);
        // Ideally we should select the newly created API, but for now just refresh list
    };

    const handleCancelEdit = () => {
        setIsCreatingApi(false);
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-text">
            <Sidebar
                selectedProject={selectedProject}
                selectedCollection={selectedCollection}
                onSelectProject={handleSelectProject}
                onSelectCollection={handleSelectCollection}
            />

            <MiddlePanel
                collectionId={selectedCollection}
                selectedApiId={selectedApi?.id || null}
                onSelectApi={handleSelectApi}
                onCreateApi={handleCreateApi}
                refreshTrigger={refreshTrigger}
            />

            <RightPanel
                collectionId={selectedCollection}
                selectedApi={selectedApi}
                isCreating={isCreatingApi}
                onSave={handleSaveApi}
                onCancel={handleCancelEdit}
            />
        </div>
    );
}
