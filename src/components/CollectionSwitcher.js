import React from "react";

const CollectionSwitcher = ({ activeCollection, onCollectionChange }) => {
  return (
    <div className="collection-switcher" role="tablist" aria-label="Collection selector">
      <button
        role="tab"
        aria-selected={activeCollection === "experiments"}
        aria-controls="experiments-collection"
        id="experiments-tab"
        className={`collection-button ${activeCollection === "experiments" ? "active" : ""}`}
        onClick={() => onCollectionChange("experiments")}
      >
        Experiments
      </button>
      <button
        role="tab"
        aria-selected={activeCollection === "new"}
        aria-controls="new-collection"
        id="new-tab"
        className={`collection-button ${activeCollection === "new" ? "active" : ""}`}
        onClick={() => onCollectionChange("new")}
      >
        New
      </button>
    </div>
  );
};

export default CollectionSwitcher;

