import React, { useState, lazy, Suspense } from "react";
import "./App.css";
import Navigation from "./components/Navigation";
import CollectionSwitcher from "./components/CollectionSwitcher";
import ErrorBoundary from "./components/ErrorBoundary";
import { TEMPLATE_TYPES } from "./constants";
import { belongsToCollection } from "./utils/artworkHelpers";

// Lazy load components for code splitting
const ArtworkViewer = lazy(() => import("./components/ArtworkViewer"));
const TemplateSection = lazy(() => import("./components/TemplateSection"));

// Export for use in other components
export { belongsToCollection };

function App() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [activeSection, setActiveSection] = useState("all");
  const [activeCollection, setActiveCollection] = useState("experiments");

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

  const renderContent = () => {
    if (activeSection === "all") {
      // Show all template sections
      return (
        <>
          {TEMPLATE_TYPES.map((templateType) => {
            // Special handling for gridPattern to include both variants
            const template = templateType === "gridPattern" 
              ? ["gridPattern", "gridPatternModular"]
              : templateType;
            return (
              <Suspense key={templateType} fallback={<div className="loading">Loading...</div>}>
                <TemplateSection
                  templateType={template}
                  onArtworkSelect={setSelectedArtwork}
                  activeCollection={activeCollection}
                />
              </Suspense>
            );
          })}
        </>
      );
    } else {
      // Show only the selected template section
      const template = activeSection === "gridPattern" 
        ? ["gridPattern", "gridPatternModular"]
        : activeSection;
      return (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <TemplateSection
            templateType={template}
            onArtworkSelect={setSelectedArtwork}
            activeCollection={activeCollection}
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
            <div className="sidebar-container">
              <Navigation
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                activeCollection={activeCollection}
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
