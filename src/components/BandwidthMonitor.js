import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Download, Upload, Wifi, WifiOff, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import CloudinaryService from '../services/cloudinaryConfig';
import './BandwidthMonitor.css';

const BandwidthMonitor = ({ compact = false }) => {
  const [usageStats, setUsageStats] = useState(CloudinaryService.getUsageStats());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionSpeed, setConnectionSpeed] = useState(null);
  const [realTimeData, setRealTimeData] = useState({
    downloads: 0,
    uploads: 0,
    errors: 0
  });
  const [alerts, setAlerts] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Update stats every 30 seconds
    intervalRef.current = setInterval(() => {
      setUsageStats(CloudinaryService.getUsageStats());
      checkForAlerts();
    }, 30000);

    // Network monitoring
    const handleOnline = () => {
      setIsOnline(true);
      measureConnectionSpeed();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionSpeed(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection speed test
    if (navigator.onLine) {
      measureConnectionSpeed();
    }

    // Monitor real-time network activity
    monitorNetworkActivity();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const measureConnectionSpeed = async () => {
    try {
      const startTime = performance.now();
      const response = await fetch('https://res.cloudinary.com/demo/image/fetch/c_limit,w_100/https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png', { 
        cache: 'no-cache' 
      });
      const endTime = performance.now();
      
      if (response.ok) {
        const duration = endTime - startTime;
        const bytes = 100; // Small test image
        const speed = (bytes * 8) / (duration / 1000); // bits per second
        
        setConnectionSpeed(speed);
      }
    } catch (error) {
      console.warn('Failed to measure connection speed:', error);
      setConnectionSpeed(null);
    }
  };

  const monitorNetworkActivity = () => {
    // Monitor fetch requests to track real-time usage
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      const isCloudinaryRequest = typeof url === 'string' && url.includes('cloudinary');
      
      if (isCloudinaryRequest) {
        const startTime = performance.now();
        
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          
          // Estimate data transferred
          const contentLength = response.headers.get('content-length');
          const bytes = contentLength ? parseInt(contentLength) : 0;
          
          setRealTimeData(prev => ({
            ...prev,
            downloads: prev.downloads + bytes
          }));
          
          return response;
        } catch (error) {
          setRealTimeData(prev => ({
            ...prev,
            errors: prev.errors + 1
          }));
          throw error;
        }
      }
      
      return originalFetch(...args);
    };
  };

  const checkForAlerts = () => {
    const newAlerts = [];
    const stats = CloudinaryService.getUsageStats();
    
    // Check bandwidth usage
    if (stats.monthly.percentage > 90) {
      newAlerts.push({
        id: 'bandwidth-critical',
        type: 'critical',
        message: 'Critical: Over 90% of monthly bandwidth used',
        icon: <AlertTriangle size={16} />
      });
    } else if (stats.monthly.percentage > 75) {
      newAlerts.push({
        id: 'bandwidth-warning',
        type: 'warning',
        message: 'Warning: Over 75% of monthly bandwidth used',
        icon: <AlertTriangle size={16} />
      });
    }
    
    // Check storage usage
    if (stats.storage.percentage > 85) {
      newAlerts.push({
        id: 'storage-warning',
        type: 'warning',
        message: 'Warning: Approaching storage limit',
        icon: <AlertTriangle size={16} />
      });
    }
    
    // Check connection quality
    if (!isOnline) {
      newAlerts.push({
        id: 'offline',
        type: 'info',
        message: 'Offline - Using cached content',
        icon: <WifiOff size={16} />
      });
    } else if (connectionSpeed && connectionSpeed < 1000000) { // Less than 1Mbps
      newAlerts.push({
        id: 'slow-connection',
        type: 'warning',
        message: 'Slow connection detected - Optimizing delivery',
        icon: <Wifi size={16} />
      });
    }
    
    setAlerts(newAlerts);
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatSpeed = (bitsPerSecond) => {
    if (!bitsPerSecond) return 'Unknown';
    
    const mbps = bitsPerSecond / 1000000;
    if (mbps >= 1) {
      return `${mbps.toFixed(1)} Mbps`;
    } else {
      const kbps = bitsPerSecond / 1000;
      return `${kbps.toFixed(0)} Kbps`;
    }
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#dc3545'; // Red
    if (percentage >= 75) return '#ffc107'; // Yellow
    if (percentage >= 50) return '#17a2b8'; // Blue
    return '#28a745'; // Green
  };

  const getConnectionQuality = () => {
    if (!isOnline) return { quality: 'offline', color: '#6c757d' };
    if (!connectionSpeed) return { quality: 'testing', color: '#17a2b8' };
    
    const mbps = connectionSpeed / 1000000;
    if (mbps >= 10) return { quality: 'excellent', color: '#28a745' };
    if (mbps >= 5) return { quality: 'good', color: '#17a2b8' };
    if (mbps >= 1) return { quality: 'fair', color: '#ffc107' };
    return { quality: 'poor', color: '#dc3545' };
  };

  if (compact) {
    return (
      <div className="bandwidth-monitor compact">
        <div className="monitor-header">
          <div className="connection-indicator">
            {isOnline ? (
              <Wifi size={16} style={{ color: getConnectionQuality().color }} />
            ) : (
              <WifiOff size={16} style={{ color: '#6c757d' }} />
            )}
          </div>
          <div className="usage-summary">
            {formatBytes(usageStats.monthly.used)} / {formatBytes(usageStats.monthly.limit)}
          </div>
        </div>
        
        {alerts.length > 0 && (
          <div className="alerts compact">
            {alerts.slice(0, 1).map(alert => (
              <div key={alert.id} className={`alert ${alert.type}`}>
                {alert.icon}
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bandwidth-monitor">
      <div className="monitor-header">
        <h3>
          <BarChart3 size={20} />
          Bandwidth Monitor
        </h3>
        <div className="connection-status">
          {isOnline ? (
            <div className="status-item online">
              <Wifi size={16} />
              <span>Online ({getConnectionQuality().quality})</span>
            </div>
          ) : (
            <div className="status-item offline">
              <WifiOff size={16} />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="usage-section">
        <div className="usage-card">
          <div className="card-header">
            <Download size={16} />
            <span>Monthly Bandwidth</span>
          </div>
          <div className="usage-display">
            <div className="usage-text">
              <span className="used">{formatBytes(usageStats.monthly.used)}</span>
              <span className="total">/ {formatBytes(usageStats.monthly.limit)}</span>
            </div>
            <div className="usage-percentage">
              {usageStats.monthly.percentage.toFixed(1)}%
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.min(usageStats.monthly.percentage, 100)}%`,
                backgroundColor: getUsageColor(usageStats.monthly.percentage)
              }}
            />
          </div>
        </div>

        <div className="usage-card">
          <div className="card-header">
            <Upload size={16} />
            <span>Storage Usage</span>
          </div>
          <div className="usage-display">
            <div className="usage-text">
              <span className="used">~{formatBytes(usageStats.monthly.used * 0.1)}</span>
              <span className="total">/ {formatBytes(usageStats.storage.limit)}</span>
            </div>
            <div className="usage-percentage">
              {usageStats.storage.percentage.toFixed(1)}%
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.min(usageStats.storage.percentage, 100)}%`,
                backgroundColor: getUsageColor(usageStats.storage.percentage)
              }}
            />
          </div>
        </div>

        <div className="usage-card">
          <div className="card-header">
            <Activity size={16} />
            <span>Session Usage</span>
          </div>
          <div className="usage-display">
            <div className="usage-text">
              <span className="used">{formatBytes(usageStats.session)}</span>
            </div>
            <div className="session-stats">
              <div className="stat-item">
                <span className="stat-label">Downloads</span>
                <span className="stat-value">{formatBytes(realTimeData.downloads)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Errors</span>
                <span className="stat-value">{realTimeData.errors}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Details */}
      <div className="connection-section">
        <div className="connection-card">
          <div className="card-header">
            <Wifi size={16} />
            <span>Connection Details</span>
          </div>
          <div className="connection-details">
            <div className="detail-row">
              <span className="label">Status</span>
              <span className={`value ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Speed</span>
              <span className="value">{formatSpeed(connectionSpeed)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Quality</span>
              <span 
                className="value"
                style={{ color: getConnectionQuality().color }}
              >
                {getConnectionQuality().quality}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <div className="alerts">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert ${alert.type}`}>
                {alert.icon}
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Tips */}
      <div className="tips-section">
        <div className="tips-card">
          <div className="card-header">
            <CheckCircle size={16} />
            <span>Optimization Tips</span>
          </div>
          <div className="tips-list">
            {usageStats.monthly.percentage > 75 && (
              <div className="tip">
                📊 High usage detected - Consider enabling more aggressive caching
              </div>
            )}
            {connectionSpeed && connectionSpeed < 5000000 && (
              <div className="tip">
                🐌 Slow connection - Lower quality media will be served automatically
              </div>
            )}
            {!isOnline && (
              <div className="tip">
                📱 Offline mode active - Using cached content for full functionality
              </div>
            )}
            <div className="tip">
              💾 Media is automatically cached for offline use on this device
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandwidthMonitor;