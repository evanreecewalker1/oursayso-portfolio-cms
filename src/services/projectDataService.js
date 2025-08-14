// Project Data Service
// Handles saving and loading project data to/from GitHub repository

class ProjectDataService {
  constructor() {
    this.githubOwner = 'evanreecewalker1';
    this.githubRepo = 'oursayso-sales-ipad';
    this.githubBranch = 'main';
    this.githubApiUrl = 'https://api.github.com';
    this.dataPath = 'public/data';
    
    this.githubToken = process.env.REACT_APP_GITHUB_TOKEN;
    
    console.log('📊 Project Data Service initialized:', {
      repo: `${this.githubOwner}/${this.githubRepo}`,
      hasToken: !!this.githubToken
    });
  }

  // Save project data to GitHub repository
  async saveProjectsToGitHub(projects, page2Projects, testimonials) {
    try {
      console.log('💾 Saving project data to GitHub repository...');
      
      if (!this.githubToken) {
        throw new Error('GitHub token not configured. Cannot save project data.');
      }

      const dataToSave = {
        projects: projects,
        page2Projects: page2Projects || [],
        testimonials: testimonials || [],
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };

      // Save to projects.json in the repository
      const fileName = 'cms-projects.json';
      const filePath = `${this.dataPath}/${fileName}`;
      const base64Content = btoa(JSON.stringify(dataToSave, null, 2));

      const result = await this.uploadFileToGitHub(
        filePath,
        base64Content,
        `Update project data from CMS - ${projects.length} projects`
      );

      console.log('✅ Project data saved to GitHub:', {
        projects: projects.length,
        page2Projects: page2Projects?.length || 0,
        testimonials: testimonials?.length || 0,
        commitSha: result.commit?.sha
      });

      // Also save to localStorage as backup
      localStorage.setItem('portfolio-cms-projects', JSON.stringify(projects));
      localStorage.setItem('portfolio-cms-page2-projects', JSON.stringify(page2Projects || []));
      localStorage.setItem('portfolio-cms-testimonials', JSON.stringify(testimonials || []));
      console.log('💾 Project data also backed up to localStorage');

      return result;
    } catch (error) {
      console.error('❌ Failed to save project data to GitHub:', error);
      
      // Fallback to localStorage only
      console.log('⚠️ Falling back to localStorage only...');
      localStorage.setItem('portfolio-cms-projects', JSON.stringify(projects));
      localStorage.setItem('portfolio-cms-page2-projects', JSON.stringify(page2Projects || []));
      localStorage.setItem('portfolio-cms-testimonials', JSON.stringify(testimonials || []));
      
      throw error;
    }
  }

  // Load project data from GitHub repository
  async loadProjectsFromGitHub() {
    try {
      console.log('📥 Loading project data from GitHub repository...');
      
      if (!this.githubToken) {
        console.warn('⚠️ GitHub token not configured. Using localStorage fallback.');
        return this.loadFromLocalStorage();
      }

      const fileName = 'cms-projects.json';
      const filePath = `${this.dataPath}/${fileName}`;
      
      const fileData = await this.getFileFromGitHub(filePath);
      
      if (!fileData) {
        console.log('📝 No project data found in GitHub, using localStorage or defaults');
        return this.loadFromLocalStorage();
      }

      // Decode base64 content
      const jsonContent = atob(fileData.content);
      const data = JSON.parse(jsonContent);

      console.log('✅ Project data loaded from GitHub:', {
        projects: data.projects?.length || 0,
        page2Projects: data.page2Projects?.length || 0,
        testimonials: data.testimonials?.length || 0,
        lastUpdated: data.lastUpdated
      });

      // Cache in localStorage for faster access
      if (data.projects) {
        localStorage.setItem('portfolio-cms-projects', JSON.stringify(data.projects));
      }
      if (data.page2Projects) {
        localStorage.setItem('portfolio-cms-page2-projects', JSON.stringify(data.page2Projects));
      }
      if (data.testimonials) {
        localStorage.setItem('portfolio-cms-testimonials', JSON.stringify(data.testimonials));
      }

      return {
        projects: data.projects || this.getDefaultProjects(),
        page2Projects: data.page2Projects || [],
        testimonials: data.testimonials || this.getDefaultTestimonials()
      };
    } catch (error) {
      console.error('❌ Failed to load project data from GitHub:', error);
      console.log('⚠️ Falling back to localStorage...');
      return this.loadFromLocalStorage();
    }
  }

  // Fallback: Load from localStorage
  loadFromLocalStorage() {
    const projects = localStorage.getItem('portfolio-cms-projects');
    const page2Projects = localStorage.getItem('portfolio-cms-page2-projects');
    const testimonials = localStorage.getItem('portfolio-cms-testimonials');

    console.log('💾 Loading from localStorage fallback');

    return {
      projects: projects ? JSON.parse(projects) : this.getDefaultProjects(),
      page2Projects: page2Projects ? JSON.parse(page2Projects) : [],
      testimonials: testimonials ? JSON.parse(testimonials) : this.getDefaultTestimonials()
    };
  }

  // Default projects if none exist
  getDefaultProjects() {
    console.log('📝 Using default projects (no saved data found)');
    return [
      {
        id: '1',
        title: 'Lovell Leadership Conferences',
        category: 'Events',
        description: 'Premium leadership conference series',
        tags: ['Leadership', 'Events', 'Professional Development'],
        mediaItems: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft'
        }
      }
      // Add more default projects as needed
    ];
  }

  // Default testimonials
  getDefaultTestimonials() {
    return [
      {
        id: '1',
        name: 'Sample Client',
        company: 'Sample Company',
        text: 'Great work on our project!',
        createdAt: new Date().toISOString()
      }
    ];
  }

  // Core GitHub API methods
  async uploadFileToGitHub(filePath, base64Content, commitMessage) {
    const url = `${this.githubApiUrl}/repos/${this.githubOwner}/${this.githubRepo}/contents/${filePath}`;
    
    // Check if file exists (for updates)
    let existingSha = null;
    try {
      const existingFile = await this.getFileFromGitHub(filePath);
      existingSha = existingFile.sha;
      console.log('📝 Updating existing file:', filePath);
    } catch (error) {
      console.log('📝 Creating new file:', filePath);
    }
    
    const requestBody = {
      message: commitMessage,
      content: base64Content,
      branch: this.githubBranch
    };
    
    if (existingSha) {
      requestBody.sha = existingSha;
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  }
  
  async getFileFromGitHub(filePath) {
    const url = `${this.githubApiUrl}/repos/${this.githubOwner}/${this.githubRepo}/contents/${filePath}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // File doesn't exist
      }
      throw new Error(`Failed to get file: ${response.status} - ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Validate GitHub access
  async validateGitHubAccess() {
    try {
      const url = `${this.githubApiUrl}/repos/${this.githubOwner}/${this.githubRepo}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API access failed: ${response.status}`);
      }
      
      const repoInfo = await response.json();
      console.log('✅ GitHub repository access validated:', repoInfo.full_name);
      
      return {
        valid: true,
        repository: repoInfo.full_name
      };
    } catch (error) {
      console.error('❌ GitHub validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

export default new ProjectDataService();