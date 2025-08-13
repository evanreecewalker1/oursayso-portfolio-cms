# Netlify Integration Guide

This guide explains how to connect the Portfolio CMS to a real Netlify deployment.

## Architecture Overview

The Portfolio CMS generates structured JSON data that can be consumed by a separate portfolio website. Here's how the integration works:

```
Portfolio CMS → Generate JSON → Upload to Repository → Trigger Netlify Build → Live Portfolio
```

## Generated JSON Structure

### projects.json
```json
{
  "projects": [
    {
      "id": "1",
      "title": "Project Title",
      "category": "Design & Digital",
      "description": "Project description...",
      "tags": ["branding", "website"],
      "slug": "project-title",
      "tileBackground": {
        "type": "image",
        "url": "/images/tiles/project-1.jpg"
      },
      "pageBackground": {
        "url": "/images/backgrounds/project-1.jpg",
        "dimensions": { "width": 1920, "height": 1080 }
      },
      "mediaItems": [
        {
          "id": "1",
          "type": "gallery",
          "title": "Project Gallery",
          "files": [
            {
              "url": "/projects/project-1/media/image1.jpg",
              "name": "image1.jpg",
              "type": "image/jpeg"
            }
          ]
        }
      ],
      "hasVideo": false,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "status": "published"
    }
  ],
  "metadata": {
    "totalProjects": 10,
    "categories": ["Events", "Video", "Design & Digital"],
    "lastUpdated": "2025-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

### testimonials.json
```json
{
  "testimonials": [
    {
      "id": "1",
      "text": "Their work is memorable, relevant, entertaining...",
      "author": "Faye Frater, InterContinental Hotels Group"
    }
  ],
  "metadata": {
    "totalTestimonials": 3,
    "lastUpdated": "2025-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

## File Path Structure

Files are organized for portfolio consumption:

```
/public
  /images
    /tiles              # Project tile backgrounds
      project-1.jpg
    /backgrounds        # Project page backgrounds
      project-1.jpg
  /projects
    /project-1
      /media            # Project media files
        image1.jpg
        video1.mp4
  /data
    projects.json       # Generated project data
    testimonials.json   # Generated testimonial data
```

## Real Netlify Integration

To connect this to a real Netlify deployment:

### 1. Set up Portfolio Repository

Create a separate repository for your portfolio website that consumes the JSON data.

### 2. Netlify Build Hook

1. In your Netlify dashboard, go to Site Settings → Build hooks
2. Create a new build hook
3. Copy the webhook URL (e.g., `https://api.netlify.com/build_hooks/your-hook-id`)

### 3. Update CMS Integration

Replace the `simulateNetlifyDeploy` function in `App.js`:

```javascript
const deployToNetlify = async (jsonData) => {
  // 1. Upload files to your repository (GitHub API, GitLab API, etc.)
  await uploadFilesToRepository(jsonData);
  
  // 2. Trigger Netlify build
  const response = await fetch('https://api.netlify.com/build_hooks/your-hook-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trigger_branch: 'main',
      trigger_title: 'CMS Update'
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to trigger deployment');
  }
  
  const result = await response.json();
  return {
    success: true,
    deployUrl: 'https://your-portfolio-site.netlify.app',
    deployId: result.id
  };
};
```

### 4. File Upload Integration

Implement file upload to your repository:

```javascript
const uploadFilesToRepository = async (jsonData) => {
  // Example using GitHub API
  const githubToken = process.env.REACT_APP_GITHUB_TOKEN;
  const repoOwner = 'your-username';
  const repoName = 'your-portfolio-repo';
  
  // Upload projects.json
  await uploadFileToGitHub(
    githubToken,
    repoOwner,
    repoName,
    'public/data/projects.json',
    JSON.stringify(jsonData.projects, null, 2)
  );
  
  // Upload testimonials.json
  await uploadFileToGitHub(
    githubToken,
    repoOwner,
    repoName,
    'public/data/testimonials.json',
    JSON.stringify(jsonData.testimonials, null, 2)
  );
  
  // Upload media files (images, videos, etc.)
  // ... implement file uploads for each project's media
};
```

### 5. Environment Variables

Add required environment variables:

```env
REACT_APP_NETLIFY_HOOK_URL=https://api.netlify.com/build_hooks/your-hook-id
REACT_APP_GITHUB_TOKEN=your-github-personal-access-token
REACT_APP_PORTFOLIO_REPO=your-username/your-portfolio-repo
```

### 6. Portfolio Website Integration

Your portfolio website should fetch and display the JSON data:

```javascript
// In your portfolio app
const loadProjects = async () => {
  const response = await fetch('/data/projects.json');
  const data = await response.json();
  return data.projects;
};
```

## Security Considerations

- Never expose GitHub tokens or API keys in client-side code
- Consider using a serverless function or backend API for secure uploads
- Implement proper authentication for the CMS
- Validate file types and sizes before upload

## Development vs Production

The current implementation includes:
- ✅ JSON generation system
- ✅ File path management
- ✅ Progress indicators
- ✅ Validation system
- 🔄 Simulated deployment (replace with real API calls)
- 🔄 File upload to repository (implement with GitHub/GitLab API)

## Testing

Use the "Export JSON" button in development mode to download and inspect the generated JSON structure before implementing real deployment.