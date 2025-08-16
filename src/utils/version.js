// Version utilities for Oursayso CMS
import packageJson from '../../package.json';

export const VERSION_INFO = {
  version: packageJson.version,
  buildTimestamp: process.env.REACT_APP_BUILD_TIMESTAMP || new Date().toISOString(),
  buildNumber: process.env.REACT_APP_BUILD_NUMBER || Math.floor(Date.now() / 1000).toString(),
  gitCommit: process.env.REACT_APP_GIT_COMMIT || 'unknown',
  environment: process.env.NODE_ENV || 'development',
  appName: 'Oursayso CMS',
  deploymentId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};

export const getVersionString = () => {
  return `v${VERSION_INFO.version}`;
};

export const getBuildString = () => {
  const buildDate = new Date(VERSION_INFO.buildTimestamp);
  const formattedDate = buildDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
  const formattedTime = buildDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `Build ${formattedDate} ${formattedTime}`;
};

export const getFullVersionString = () => {
  return `${getVersionString()} • ${getBuildString()}`;
};

export const isProduction = () => {
  return VERSION_INFO.environment === 'production';
};

export const getVersionForCacheBusting = () => {
  return `${VERSION_INFO.version}-${VERSION_INFO.buildNumber}`;
};

export const getShortVersionString = () => {
  return `${VERSION_INFO.appName} ${getVersionString()}`;
};

// For debugging
export const getVersionDebugInfo = () => {
  return {
    ...VERSION_INFO,
    versionString: getVersionString(),
    buildString: getBuildString(),
    fullVersionString: getFullVersionString(),
    shortVersionString: getShortVersionString()
  };
};