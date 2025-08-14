import React, { useState, useEffect } from 'react';
import './IOSInstallPrompt.css';

const IOSInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if device is iOS
    const detectIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    };

    // Detect if app is running in standalone mode (already installed)
    const detectStandalone = () => {
      return window.navigator.standalone === true || 
             window.matchMedia('(display-mode: standalone)').matches;
    };

    // Check if prompt was previously dismissed
    const wasPromptDismissed = () => {
      return localStorage.getItem('ios-install-prompt-dismissed') === 'true';
    };

    const iosDetected = detectIOS();
    const standaloneDetected = detectStandalone();
    const promptDismissed = wasPromptDismissed();

    setIsIOS(iosDetected);
    setIsStandalone(standaloneDetected);

    // Show prompt if:
    // 1. Device is iOS
    // 2. Not running in standalone mode (not installed)
    // 3. Prompt hasn't been dismissed
    // 4. Wait 3 seconds after page load
    if (iosDetected && !standaloneDetected && !promptDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
  };

  const handleInstall = () => {
    // iOS doesn't have programmatic install, so just show instructions
    setShowPrompt(false);
    // Could optionally show detailed instructions modal here
    alert('To install this app:\n\n1. Tap the Share button in Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install the app');
  };

  if (!showPrompt || !isIOS || isStandalone) {
    return null;
  }

  return (
    <div className="ios-install-prompt">
      <div className="ios-prompt-content">
        <div className="ios-prompt-header">
          <img 
            src="/images/oursayso-logo.svg" 
            alt="OurSayso Logo" 
            className="ios-prompt-logo"
          />
          <button 
            className="ios-prompt-close"
            onClick={handleDismiss}
            aria-label="Close prompt"
          >
            ×
          </button>
        </div>
        
        <div className="ios-prompt-body">
          <h3>Hey Knotty, add this to your home screen as an app!</h3>
          <p>Get quick access to the OurSayso Portfolio by adding it to your home screen.</p>
          
          <div className="ios-install-steps">
            <div className="install-step">
              <div className="step-number">1</div>
              <span>Tap the Share button</span>
              <div className="share-icon">📤</div>
            </div>
            <div className="install-step">
              <div className="step-number">2</div>
              <span>Select "Add to Home Screen"</span>
              <div className="home-icon">📱</div>
            </div>
            <div className="install-step">
              <div className="step-number">3</div>
              <span>Tap "Add"</span>
              <div className="add-icon">✅</div>
            </div>
          </div>
        </div>
        
        <div className="ios-prompt-actions">
          <button 
            className="ios-btn ios-btn-secondary"
            onClick={handleDismiss}
          >
            Maybe Later
          </button>
          <button 
            className="ios-btn ios-btn-primary"
            onClick={handleInstall}
          >
            Show Me How
          </button>
        </div>
      </div>
    </div>
  );
};

export default IOSInstallPrompt;