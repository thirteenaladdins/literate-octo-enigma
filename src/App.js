import React, { useState, useEffect, lazy, Suspense } from "react";
import "./App.css";
import Navigation from "./components/Navigation";
import CollectionSwitcher from "./components/CollectionSwitcher";
import ErrorBoundary from "./components/ErrorBoundary";
import { belongsToCollection, getUniqueTemplates } from "./utils/artworkHelpers";
import staticArtworksData from "./data/artworks.json";

// Lazy load components for code splitting
const ArtworkViewer = lazy(() => import("./components/ArtworkViewer"));
const TemplateSection = lazy(() => import("./components/TemplateSection"));

// Export for use in other components
export { belongsToCollection };

function App() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [activeSection, setActiveSection] = useState("all");
  const [activeCollection, setActiveCollection] = useState("experiments");
  const [experimentArtworks] = useState(staticArtworksData.artworks || []);
  const [newArtworks, setNewArtworks] = useState([]);
  const [isLoadingNew, setIsLoadingNew] = useState(false);
  const [newError, setNewError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingNew(true);
    fetch("/api/artworks?limit=200")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.artworks && Array.isArray(data.artworks)) {
          setNewArtworks(data.artworks);
          setNewError(null);
        } else {
          setNewError("No artworks returned from Supabase.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("API fetch failed, staying on static experiments:", err);
        setNewError(err.message || "Failed to load new artworks.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingNew(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Scroll to top when changing sections
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCollectionChange = (collection) => {
    setActiveCollection(collection);
    setActiveSection("all"); // Reset to "all" when switching collections
    // Scroll to top when changing collections
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isNewCollection = activeCollection === "new";
  const collectionArtworks = isNewCollection ? newArtworks : experimentArtworks;

  const renderContent = () => {
    if (activeSection === "all") {
      // Show all templates
      const templates = getUniqueTemplates(collectionArtworks);
      return (
        <>
          {templates.map((template) => {
            // Special handling for gridPattern to include both variants
            const templateType = template === "gridPattern" 
              ? ["gridPattern", "gridPatternModular"]
              : template;
            return (
              <Suspense key={template} fallback={<div className="loading">Loading...</div>}>
                <TemplateSection
                  templateType={templateType}
                  onArtworkSelect={setSelectedArtwork}
                  activeCollection={activeCollection}
                  artworks={collectionArtworks}
                />
              </Suspense>
            );
          })}
        </>
      );
    } else {
      // Show only the selected template section
      const templateType = activeSection === "gridPattern" 
        ? ["gridPattern", "gridPatternModular"]
        : activeSection;
      return (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <TemplateSection
            templateType={templateType}
            onArtworkSelect={setSelectedArtwork}
            activeCollection={activeCollection}
            artworks={collectionArtworks}
          />
        </Suspense>
      );
    }
  };

  return (
    <div className="App">
      <div className={`app-layout ${selectedArtwork ? "no-sidebar" : ""}`}>
        {!selectedArtwork && (
          <>
            <CollectionSwitcher
              activeCollection={activeCollection}
              onCollectionChange={handleCollectionChange}
            />
            {isNewCollection && newArtworks.length === 0 && (
              <div
                className="info-banner"
                style={{
                  margin: "1rem 0",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  background: "#222",
                  color: "#fff",
                  fontSize: "0.9rem",
                }}
              >
                {isLoadingNew
                  ? "Loading new artworks..."
                  : newError || "No Supabase artworks available yet."}
              </div>
            )}
            <div className="sidebar-container">
              <Navigation
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                activeCollection={activeCollection}
                artworks={collectionArtworks}
              />
            </div>
          </>
        )}
        <main className="App-main">
          <ErrorBoundary>
            <Suspense fallback={<div className="loading">Loading...</div>}>
              {selectedArtwork ? (
                <ArtworkViewer artwork={selectedArtwork} onBack={() => setSelectedArtwork(null)} />
              ) : (
                renderContent()
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
