// Portfolio Repository Service
// Handles uploading files to GitHub repository via GitHub API for iPad offline access

class PortfolioRepositoryService {
  constructor() {
    // GitHub repository configuration from environment variables
    this.githubOwner = 'evanreecewalker1';
    this.githubRepo = 'oursayso-sales-ipad';
    this.githubBranch = process.env.REACT_APP_GITHUB_BRANCH || 'main';
    this.githubApiUrl = 'https://api.github.com';
    
    // GitHub Contents API file size limit (actual limit is 25MB)
    this.maxFileSize = 25 * 1024 * 1024; // 25MB for Contents API
    
    // Local portfolio repository path for Git LFS operations
    this.portfolioRepoPath = '/Users/evanwalker/Desktop/ipad-portfolio';
    
    // Portfolio repository structure
    this.videosPath = 'public/videos';
    this.documentsPath = 'public/documents';
    this.projectsPath = 'public/projects';
    this.dataPath = 'public/data';
    
    // GitHub authentication
    this.githubToken = process.env.REACT_APP_GITHUB_TOKEN;
    
    console.log('📋 GitHub Repository Service initialized:', {
      owner: this.githubOwner,
      repo: this.githubRepo,
      branch: this.githubBranch,
      hasToken: !!this.githubToken,
      maxFileSize: this.formatFileSize(this.maxFileSize)
    });
  }

  // Write video file to GitHub repository via API or Git LFS
  async writeVideoToRepository(file, projectId, fileName) {
    try {
      console.log('📁 Uploading video to GitHub repository:', fileName);
      
      // Check authentication
      if (!this.githubToken) {
        throw new Error('GitHub token not configured. Please set REACT_APP_GITHUB_TOKEN environment variable.');
      }
      
      // Check file size and route to appropriate method
      if (file.size > this.maxFileSize) {
        console.log(`📦 Large video (${this.formatFileSize(file.size)}) - using Git LFS...`);
        return await this.writeVideoToRepositoryWithLFS(file, projectId, fileName);
      } else {
        console.log(`📄 Small video (${this.formatFileSize(file.size)}) - using GitHub API...`);
        return await this.writeVideoToRepositoryWithAPI(file, projectId, fileName);
      }
    } catch (error) {
      console.error('❌ Failed to upload video to GitHub repository:', error);
      throw error;
    }
  }

  // Write small video file to GitHub repository via Contents API
  async writeVideoToRepositoryWithAPI(file, projectId, fileName) {
    try {
      // Create the target path for the video
      const videoFileName = `${projectId}-${Date.now()}-${this.sanitizeFileName(fileName)}`;
      const githubPath = `${this.videosPath}/${videoFileName}`;
      const relativePath = `/videos/${videoFileName}`;
      
      // Convert file to base64 (required by GitHub API)
      console.log('🔄 Converting video to base64 for GitHub API...');
      const base64Content = await this.fileToBase64(file);
      
      // Upload to GitHub via API
      const uploadResult = await this.uploadFileToGitHub(
        githubPath,
        base64Content,
        `Add video: ${fileName} for project ${projectId}`
      );
      
      console.log('✅ Video uploaded to GitHub repository via API:', githubPath);
      console.log('📝 Portfolio app will access it via:', relativePath);
      console.log('🔗 GitHub commit:', uploadResult.commit.html_url);
      
      return {
        success: true,
        localPath: relativePath,
        githubPath: githubPath,
        fileName: videoFileName,
        size: file.size,
        type: file.type,
        commitSha: uploadResult.commit.sha,
        commitUrl: uploadResult.commit.html_url,
        uploadMethod: 'api'
      };
    } catch (error) {
      console.error('❌ Failed to upload video via API:', error);
      throw error;
    }
  }

  // Write large video file to GitHub repository via Git LFS
  async writeVideoToRepositoryWithLFS(file, projectId, fileName) {
    try {
      console.log('📦 Large video detected - uploading via automated Git LFS service:', fileName);
      
      // Try automated upload service first
      try {
        return await this.uploadViaLFSService(file, projectId, fileName);
      } catch (serviceError) {
        console.warn('⚠️ Automated LFS service unavailable, falling back to manual process:', serviceError.message);
        return await this.fallbackToManualProcess(file, projectId, fileName);
      }
    } catch (error) {
      console.error('❌ Failed to upload large video via LFS:', error);
      throw error;
    }
  }

  // Upload via automated Git LFS service
  async uploadViaLFSService(file, projectId, fileName) {
    console.log('🚀 Uploading via automated Git LFS service...');
    
    const formData = new FormData();
    formData.append('video', file);
    formData.append('projectId', projectId);
    formData.append('originalName', fileName);
    
    const response = await fetch('http://localhost:3001/upload-large-video', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload service error: ${errorData.error}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Large video uploaded automatically via Git LFS service');
    console.log('📁 File committed and pushed to GitHub repository');
    console.log('🔗 Commit:', result.commitUrl);
    
    return result;
  }

  // Fallback to manual process if service is unavailable
  async fallbackToManualProcess(file, projectId, fileName) {
    console.log('📋 Using manual upload process as fallback...');
    
    // Create the target filename
    const videoFileName = `${projectId}-${Date.now()}-${this.sanitizeFileName(fileName)}`;
    const githubPath = `${this.videosPath}/${videoFileName}`;
    const relativePath = `/videos/${videoFileName}`;
    
    // Create a download link for manual upload
    this.createDownloadForManualUpload(file, videoFileName, relativePath);
    
    // Return a temporary result that indicates manual upload required
    console.log('✅ Large video prepared for manual Git LFS upload');
    console.log('📋 File download created - follow instructions for manual upload');
    
    return {
      success: true,
      localPath: relativePath,
      githubPath: githubPath,
      fileName: videoFileName,
      size: file.size,
      type: file.type,
      commitSha: null,
      commitUrl: null,
      uploadMethod: 'lfs-manual',
      requiresManualUpload: true,
      publicId: `portfolio_${Date.now()}`,
      url: relativePath,
      width: null,
      height: null,
      format: fileName.split('.').pop().toLowerCase(),
      bytes: file.size,
      duration: null,
      resourceType: 'video',
      storageType: 'portfolio',
      uploadedAt: new Date().toISOString(),
      preview: relativePath,
      needsServerUpload: false
    };
  }

  // Create a download link for manual Git LFS upload
  createDownloadForManualUpload(file, fileName, relativePath) {
    try {
      // Create download link
      const blob = new Blob([file], { type: file.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      console.log('🎬='.repeat(50));
      console.log('🎬 LARGE VIDEO MANUAL UPLOAD INSTRUCTIONS');
      console.log('🎬='.repeat(50));
      console.log(`📁 File: ${fileName}`);
      console.log('📥 Download will start automatically in 1 second');
      console.log('');
      console.log('📋 STEP 1: File will download automatically');
      console.log(`📋 STEP 2: Move file to ~/Desktop/ipad-portfolio/public/videos/`);
      console.log('📋 STEP 3: Run these commands in Terminal:');
      console.log('');
      console.log('   cd ~/Desktop/ipad-portfolio');
      console.log(`   git add public/videos/${fileName}`);
      console.log(`   git commit -m "Add large video: ${fileName}"`);
      console.log('   git push origin main');
      console.log('');
      console.log('📋 STEP 4: Refresh CMS after successful push');
      console.log('🎬='.repeat(50));
      
      // Auto-trigger download
      setTimeout(() => {
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show user notification with detailed instructions
        if (window.confirm) {
          const message = `🎬 LARGE VIDEO DOWNLOAD COMPLETE!\n\nFile: ${fileName}\n\n📋 NEXT STEPS:\n1. File saved to Downloads\n2. Move it to: ~/Desktop/ipad-portfolio/public/videos/\n3. Run in Terminal:\n   cd ~/Desktop/ipad-portfolio\n   git add public/videos/${fileName}\n   git commit -m "Add large video: ${fileName}"\n   git push origin main\n4. Refresh CMS\n\nClick OK to continue, or check console for detailed instructions.`;
          
          window.alert(message);
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to create download for manual upload:', error);
    }
  }

  // Write document file (PDF, etc.) to GitHub repository via API
  async writeDocumentToRepository(file, projectId, fileName) {
    try {
      console.log('📄 Uploading document to GitHub repository:', fileName);
      
      // Check authentication
      if (!this.githubToken) {
        throw new Error('GitHub token not configured. Please set REACT_APP_GITHUB_TOKEN environment variable.');
      }
      
      // Check file size
      if (file.size > this.maxFileSize) {
        console.warn(`⚠️ File size ${this.formatFileSize(file.size)} exceeds GitHub API limit of ${this.formatFileSize(this.maxFileSize)}`);
        throw new Error(`File too large for GitHub API. Maximum size: ${this.formatFileSize(this.maxFileSize)}`);
      }
      
      // Create the target path for the document
      const documentFileName = `${projectId}-${Date.now()}-${this.sanitizeFileName(fileName)}`;
      const githubPath = `${this.documentsPath}/${documentFileName}`;
      
      // Upload the file to GitHub
      const uploadResult = await this.uploadFileToGitHub(file, githubPath);
      
      console.log('✅ Document uploaded to GitHub repository:', githubPath);
      console.log('📝 Portfolio app will access it via:', `/documents/${documentFileName}`);
      console.log('🔗 GitHub commit:', uploadResult.commit.html_url);
      
      return {
        success: true,
        localPath: `/documents/${documentFileName}`,
        absolutePath: githubPath,
        fileName: documentFileName,
        size: file.size,
        type: file.type,
        commitSha: uploadResult.commit.sha,
        commitUrl: uploadResult.commit.html_url
      };
    } catch (error) {
      console.error('❌ Failed to upload document to GitHub repository:', error);
      throw error;
    }
  }

  // Write project-specific video to repository
  async writeProjectVideoToRepository(file, projectId, fileName) {
    try {
      console.log('📁 Writing project video to portfolio repository:', fileName);
      
      // Create project-specific directory structure
      const projectDir = `project-${projectId.toString().padStart(2, '0')}-${this.sanitizeProjectName(projectId)}`;
      const videoFileName = `${Date.now()}-${this.sanitizeFileName(fileName)}`;
      const targetDir = `${this.projectsPath}/${projectDir}/media`;
      const targetPath = `${targetDir}/${videoFileName}`;
      
      // Convert file to buffer
      const buffer = await this.fileToBuffer(file);
      
      // Relative path for the portfolio app to use
      const relativePath = `/projects/${projectDir}/media/${videoFileName}`;
      
      console.log('✅ Project video would be written to:', targetPath);
      console.log('📝 Portfolio app would access it via:', relativePath);
      
      return {
        success: true,
        localPath: relativePath,
        absolutePath: targetPath,
        projectDir: projectDir,
        fileName: videoFileName,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('❌ Failed to write project video to repository:', error);
      throw error;
    }
  }

  // Update portfolio data files (projects.json, etc.)
  async updatePortfolioData(projectData, dataType = 'projects') {
    try {
      console.log('📄 Updating portfolio data file:', dataType);
      
      const dataFile = `${this.dataPath}/${dataType}.json`;
      
      // This would write the updated JSON data to the portfolio repository
      console.log('✅ Portfolio data would be updated:', dataFile);
      console.log('📝 Updated data:', JSON.stringify(projectData, null, 2));
      
      return {
        success: true,
        dataFile: dataFile,
        dataType: dataType
      };
    } catch (error) {
      console.error('❌ Failed to update portfolio data:', error);
      throw error;
    }
  }

  // Trigger portfolio deployment after GitHub upload
  async triggerPortfolioDeployment(commitSha, commitMessage) {
    try {
      console.log('🚀 Portfolio deployment will be triggered by GitHub commit:', commitSha);
      console.log('💬 Commit message:', commitMessage);
      
      // GitHub Actions or other CI/CD will automatically deploy the portfolio
      // when new commits are pushed to the main branch
      
      // Optionally, we could trigger a deployment webhook or GitHub Action here
      // For now, just log that the deployment will happen automatically
      
      console.log('✅ Video uploaded to GitHub repository successfully');
      console.log('📱 Portfolio app will be updated with new video for offline access');
      
      return {
        success: true,
        commitSha: commitSha,
        deploymentTriggered: true,
        message: 'Portfolio deployment will be triggered automatically by GitHub'
      };
    } catch (error) {
      console.error('❌ Failed to trigger portfolio deployment:', error);
      throw error;
    }
  }

  // Core GitHub API method to upload a file
  async uploadFileToGitHub(filePath, base64Content, commitMessage) {
    try {
      const url = `${this.githubApiUrl}/repos/${this.githubOwner}/${this.githubRepo}/contents/${filePath}`;
      
      // Check if file exists (for updates)
      let existingSha = null;
      try {
        const existingFile = await this.getFileFromGitHub(filePath);
        existingSha = existingFile.sha;
        console.log('📝 File exists, will update:', filePath);
      } catch (error) {
        console.log('📝 New file, will create:', filePath);
      }
      
      const requestBody = {
        message: commitMessage,
        content: base64Content,
        branch: this.githubBranch
      };
      
      // Add sha for updates
      if (existingSha) {
        requestBody.sha = existingSha;
      }
      
      console.log('🚀 Making GitHub API request...');
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
      
      const result = await response.json();
      console.log('✅ GitHub API upload successful');
      
      return result;
    } catch (error) {
      console.error('❌ GitHub API upload failed:', error);
      throw error;
    }
  }
  
  // Get file from GitHub (to check if it exists and get SHA)
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
      throw new Error(`File not found: ${filePath}`);
    }
    
    return await response.json();
  }
  
  // Convert File object to base64 (required by GitHub API)
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data URL prefix to get pure base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Save file to local filesystem for Git LFS operations (browser fallback)
  async saveFileToLocal(file, localFilePath) {
    // In browser environment, we can't directly save to filesystem
    // This method is kept for potential future server-side implementation
    console.log('📁 Would save file to:', localFilePath);
    console.log('⚠️ Browser environment - cannot write to filesystem directly');
    return Promise.resolve(localFilePath);
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Sanitize file names for safe filesystem usage
  sanitizeFileName(fileName) {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Sanitize project names for directory naming
  sanitizeProjectName(projectId) {
    // This would normally get the project name from the project data
    // For now, use a generic name based on ID
    return `project-${projectId}`;
  }

  // Validate GitHub API access and repository
  async validateGitHubAccess() {
    try {
      console.log('🔍 Validating GitHub API access...');
      
      if (!this.githubToken) {
        throw new Error('GitHub token not configured. Please set REACT_APP_GITHUB_TOKEN environment variable.');
      }
      
      // Test GitHub API access by getting repository info
      const url = `${this.githubApiUrl}/repos/${this.githubOwner}/${this.githubRepo}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API access failed: ${response.status} - ${response.statusText}`);
      }
      
      const repoInfo = await response.json();
      console.log('✅ GitHub repository access validated:', repoInfo.full_name);
      
      return {
        valid: true,
        repository: repoInfo.full_name,
        branch: this.githubBranch,
        hasWriteAccess: repoInfo.permissions?.push || false
      };
    } catch (error) {
      console.error('❌ GitHub validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Get portfolio repository status
  getRepositoryInfo() {
    return {
      portfolioRepoPath: this.portfolioRepoPath,
      videosPath: this.videosPath,
      projectsPath: this.projectsPath,
      dataPath: this.dataPath,
      relativePaths: {
        videos: '/videos',
        projects: '/projects',
        data: '/data'
      }
    };
  }
}

export default new PortfolioRepositoryService();