import React from 'react';
import './PortfolioSidebar.css';

const PortfolioSidebar = ({ 
  categories = [], 
  selectedCategory = '', 
  onCategorySelect = () => {},
  deliverableTags = [],
  selectedTags = [],
  onTagSelect = () => {}
}) => {
  return (
    <div className="portfolio-sidebar">
      {/* OurSayso Logo - Rotated 90 degrees, links to oursayso.com */}
      <div className="sidebar-logo-container">
        <a 
          href="https://oursayso.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="sidebar-logo-link"
          title="Visit OurSayso.com"
        >
          <img 
            src="/images/oursayso-logo.svg" 
            alt="OurSayso" 
            className="sidebar-logo"
          />
        </a>
      </div>

      {/* Categories Navigation */}
      {categories.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Categories</h3>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${selectedCategory === '' ? 'active' : ''}`}
              onClick={() => onCategorySelect('')}
            >
              All Projects
            </button>
            {categories.map((category, index) => (
              <button
                key={index}
                className={`sidebar-nav-item ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => onCategorySelect(category)}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Deliverable Tags - with required styling */}
      {deliverableTags.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Deliverables</h3>
          <div className="sidebar-tags">
            {deliverableTags.map((tag, index) => (
              <button
                key={index}
                className={`deliverable-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => onTagSelect(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          <div className="portfolio-title">OurSayso Portfolio</div>
          <div className="portfolio-subtitle">Sales iPad App</div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSidebar;