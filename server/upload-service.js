#!/usr/bin/env node

// Simple Node.js upload service for handling large video files with Git LFS
// This runs as a local service that the CMS can call for large file uploads

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Portfolio repository path
const PORTFOLIO_REPO = '/Users/evanwalker/Desktop/ipad-portfolio';
const VIDEOS_DIR = path.join(PORTFOLIO_REPO, 'public/videos');

// Enable CORS for CMS
app.use(cors({
  origin: ['http://localhost:3000', 'https://oursayso-portfolio-cms.netlify.app', 'https://dashboard.oursayso.com'],
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure videos directory exists
    if (!fs.existsSync(VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    }
    cb(null, VIDEOS_DIR);
  },
  filename: (req, file, cb) => {
    // Use the filename from the request or generate one
    const projectId = req.body.projectId || 'general';
    const timestamp = Date.now();
    const sanitizedName = file.originalname.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const fileName = `${projectId}-${timestamp}-${sanitizedName}`;
    cb(null, fileName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Large Video Upload Service',
    portfolio_repo: PORTFOLIO_REPO 
  });
});

// Large video upload endpoint
app.post('/upload-large-video', upload.single('video'), async (req, res) => {
  try {
    console.log('🎬 Large video upload request received');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No video file provided' 
      });
    }

    const fileName = req.file.filename;
    const filePath = req.file.path;
    const fileSize = req.file.size;
    const projectId = req.body.projectId || 'general';
    
    console.log(`📁 File uploaded: ${fileName} (${formatFileSize(fileSize)})`);
    
    // Change to portfolio repository directory
    process.chdir(PORTFOLIO_REPO);
    
    try {
      // Pull latest changes first
      console.log('🔄 Pulling latest changes...');
      execSync('git pull origin main', { stdio: 'pipe' });
      
      // Add the video file (Git LFS will handle it automatically)
      console.log('📦 Adding file to Git LFS...');
      const relativePath = `public/videos/${fileName}`;
      execSync(`git add "${relativePath}"`, { stdio: 'pipe' });
      
      // Commit the file
      console.log('💾 Committing file...');
      const commitMessage = `Add large video: ${req.file.originalname} for project ${projectId}`;
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
      
      // Push to remote (LFS will upload the file)
      console.log('🚀 Pushing to GitHub with LFS...');
      execSync('git push origin main', { stdio: 'pipe' });
      
      // Get the latest commit SHA
      const commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      
      console.log('✅ Large video uploaded successfully via Git LFS');
      
      // Return success response in same format as other upload methods
      res.json({
        success: true,
        localPath: `/videos/${fileName}`,
        githubPath: `public/videos/${fileName}`,
        fileName: fileName,
        size: fileSize,
        type: req.file.mimetype,
        commitSha: commitSha,
        commitUrl: `https://github.com/evanreecewalker1/oursayso-sales-ipad/commit/${commitSha}`,
        uploadMethod: 'lfs-auto',
        publicId: `portfolio_${Date.now()}`,
        url: `/videos/${fileName}`,
        width: null,
        height: null,
        format: path.extname(fileName).substring(1),
        bytes: fileSize,
        duration: null,
        resourceType: 'video',
        storageType: 'portfolio',
        uploadedAt: new Date().toISOString(),
        preview: `/videos/${fileName}`,
        needsServerUpload: false
      });
      
    } catch (gitError) {
      console.error('❌ Git LFS operation failed:', gitError.message);
      
      // Clean up the uploaded file if git operations failed
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
      
      res.status(500).json({
        success: false,
        error: `Git LFS upload failed: ${gitError.message}`,
        details: 'Large video could not be committed to repository'
      });
    }
    
  } catch (error) {
    console.error('❌ Upload service error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Utility function to format file sizes
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Start the server
app.listen(PORT, () => {
  console.log('🎬 Large Video Upload Service Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📁 Portfolio repository: ${PORTFOLIO_REPO}`);
  console.log(`📂 Videos directory: ${VIDEOS_DIR}`);
  console.log('');
  console.log('✅ Ready to handle large video uploads with Git LFS');
});

module.exports = app;