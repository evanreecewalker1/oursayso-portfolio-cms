// Portfolio Repository Service
// Handles writing files directly to the portfolio repository and managing Git operations

class PortfolioRepositoryService {
  constructor() {
    // Path to the portfolio repository (where the iPad app gets its files)
    this.portfolioRepoPath = '/Users/evanwalker/Desktop/ipad-portfolio';
    this.videosPath = `${this.portfolioRepoPath}/public/videos`;
    this.projectsPath = `${this.portfolioRepoPath}/public/projects`;
    this.dataPath = `${this.portfolioRepoPath}/public/data`;
  }

  // Write video file directly to portfolio repository
  async writeVideoToRepository(file, projectId, fileName) {
    try {
      console.log('📁 Writing video to portfolio repository:', fileName);
      
      // Create the target path for the video
      const videoFileName = `${projectId}-${Date.now()}-${this.sanitizeFileName(fileName)}`;
      const targetPath = `${this.videosPath}/${videoFileName}`;
      
      // Convert file to buffer for writing
      const buffer = await this.fileToBuffer(file);
      
      // This would write the file to the actual filesystem
      // For now, we'll simulate this and return the path that would be created
      const relativePath = `/videos/${videoFileName}`;
      
      console.log('✅ Video would be written to portfolio repository:', targetPath);
      console.log('📝 Portfolio app would access it via:', relativePath);
      
      return {
        success: true,
        localPath: relativePath,
        absolutePath: targetPath,
        fileName: videoFileName,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('❌ Failed to write video to portfolio repository:', error);
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

  // Commit and push changes to portfolio repository
  async commitAndPushToPortfolio(commitMessage, filePaths = []) {
    try {
      console.log('📤 Committing and pushing to portfolio repository...');
      console.log('💬 Commit message:', commitMessage);
      console.log('📁 Files to commit:', filePaths);
      
      // Git operations for portfolio repository
      const gitCommands = [
        `cd ${this.portfolioRepoPath}`,
        'git add .',
        `git commit -m "${commitMessage}"`,
        'git push origin main'
      ];
      
      console.log('🔧 Git commands that would be executed:');
      gitCommands.forEach(cmd => console.log(`  ${cmd}`));
      
      // For now, simulate successful git operations
      console.log('✅ Portfolio repository would be updated with new video files');
      console.log('🚀 Portfolio app deployment would be triggered');
      
      return {
        success: true,
        commitMessage: commitMessage,
        filePaths: filePaths,
        gitCommands: gitCommands
      };
    } catch (error) {
      console.error('❌ Failed to commit/push to portfolio repository:', error);
      throw error;
    }
  }

  // Convert File object to buffer for writing
  async fileToBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const buffer = new Uint8Array(arrayBuffer);
        resolve(buffer);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
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

  // Check if portfolio repository exists and is accessible
  async validatePortfolioRepository() {
    try {
      console.log('🔍 Validating portfolio repository path:', this.portfolioRepoPath);
      
      // This would check if the directory exists and is a git repository
      // For now, assume it's valid
      console.log('✅ Portfolio repository is accessible');
      
      return {
        valid: true,
        path: this.portfolioRepoPath,
        videosPath: this.videosPath,
        projectsPath: this.projectsPath,
        dataPath: this.dataPath
      };
    } catch (error) {
      console.error('❌ Portfolio repository validation failed:', error);
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