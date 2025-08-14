# GitHub API Integration for Video Uploads

## Overview
The Portfolio CMS now integrates directly with GitHub API to upload videos to the portfolio repository (`evanreecewalker1/oursayso-sales-ipad`) for offline iPad access. This eliminates the need for a separate server while ensuring videos reach the deployed portfolio app.

## Setup Instructions

### 1. Generate GitHub Personal Access Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. **Token name**: `Portfolio CMS Video Uploads`
4. **Expiration**: Choose appropriate duration (90 days recommended)
5. **Scopes**: Select `repo` (Full control of private repositories)
6. Click "Generate token"
7. **Important**: Copy the token immediately - you won't see it again!

### 2. Configure Environment Variables

#### For Local Development:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and add your GitHub token:
   ```
   REACT_APP_GITHUB_TOKEN=ghp_your_actual_token_here
   ```

#### For Netlify Deployment:
1. Go to Netlify Dashboard > Site Settings > Environment Variables
2. Add new variable:
   - **Key**: `REACT_APP_GITHUB_TOKEN`
   - **Value**: `ghp_your_actual_token_here`
3. Redeploy the site

## How It Works

### Video Upload Flow
1. **User uploads video** in CMS (any size up to 100MB)
2. **Hybrid system detects video** → Routes to GitHub API storage
3. **GitHub API upload**:
   - Converts video to base64 (required by GitHub API)
   - Uploads to `public/videos/` in portfolio repository
   - Creates commit with descriptive message
4. **Portfolio deployment** triggered automatically by GitHub commit
5. **iPad app** accesses video offline from deployed portfolio

### File Naming Convention
Videos are stored with unique names to prevent conflicts:
```
public/videos/{projectId}-{timestamp}-{sanitized-filename}.mp4
```

Example: `public/videos/project-123-1755123456789-mission-improbable.mp4`

## File Size Limitations

### GitHub API Limits
- **Maximum file size**: 100MB per file
- **Repository size**: 5GB total (generous for portfolio videos)
- **Files over 100MB**: Require Git LFS (not implemented yet)

### Current Handling
- Files **≤ 100MB**: Direct GitHub API upload ✅
- Files **> 100MB**: Error with helpful message suggesting compression

## Error Handling

### Common Issues & Solutions

#### 1. "GitHub token not configured"
- **Cause**: Missing or invalid `REACT_APP_GITHUB_TOKEN`
- **Solution**: Follow setup instructions above

#### 2. "File too large for GitHub API"
- **Cause**: Video file > 100MB
- **Solution**: Compress video or implement Git LFS

#### 3. "GitHub API access failed: 401"
- **Cause**: Invalid or expired GitHub token
- **Solution**: Generate new token and update environment variables

#### 4. "GitHub API access failed: 403"
- **Cause**: Token lacks `repo` permissions
- **Solution**: Regenerate token with proper scopes

## Repository Structure

Videos are uploaded to the portfolio repository in this structure:
```
evanreecewalker1/oursayso-sales-ipad/
└── public/
    └── videos/
        ├── project-123-1755123456789-video1.mp4
        ├── project-456-1755123456790-video2.mp4
        └── ...
```

## Console Logging

### Successful Upload
```
📋 GitHub Repository Service initialized: {owner: "evanreecewalker1", ...}
📁 Uploading video to GitHub repository: video.mp4
🔄 Converting video to base64 for GitHub API...
📝 New file, will create: public/videos/project-123-video.mp4
🚀 Making GitHub API request...
✅ GitHub API upload successful
✅ Video uploaded to GitHub repository: public/videos/project-123-video.mp4
🔗 GitHub commit: https://github.com/evanreecewalker1/oursayso-sales-ipad/commit/abc123
🚀 Portfolio deployment will be triggered by GitHub commit: abc123
```

### Upload Error
```
❌ GitHub token not configured. Please set REACT_APP_GITHUB_TOKEN environment variable.
```

## Testing

### Validate GitHub Access
The service includes a validation method to test GitHub API access:
```javascript
const validation = await PortfolioRepositoryService.validateGitHubAccess();
console.log(validation);
```

### Test Video Upload
1. Upload a small video (< 10MB) first to test the integration
2. Check the portfolio repository for the new file
3. Verify the portfolio app deployment includes the video

## Security Notes

### Token Security
- **Never commit** GitHub tokens to version control
- Use environment variables only
- **Rotate tokens** regularly (every 90 days)
- **Minimum permissions**: Only grant `repo` scope

### Repository Access
- Token has full access to the repository
- Consider creating a dedicated bot account for production use
- Monitor repository activity for unauthorized changes

## Future Enhancements

### Git LFS Support
For files > 100MB:
1. Implement Git LFS upload via GitHub API
2. Add LFS file tracking to repository
3. Handle LFS pointer files

### Batch Uploads
- Multiple video uploads in single commit
- Progress tracking for large uploads
- Upload queuing system

### Webhook Integration
- Trigger immediate portfolio rebuild
- Real-time upload status updates
- Deployment notifications

## Troubleshooting

### Debug Mode
Enable detailed logging by opening browser console during uploads.

### Manual Verification
1. Check GitHub repository for uploaded files
2. Verify commit history shows video uploads  
3. Test portfolio deployment includes new videos
4. Confirm iPad app can access videos offline

### Rollback
If issues occur:
1. Revert problematic commits in GitHub repository
2. Redeploy portfolio app
3. Check CMS for error messages

## Support

For issues with GitHub integration:
1. Check browser console for detailed error messages
2. Verify GitHub token permissions and expiration
3. Test with smaller video files first
4. Monitor GitHub API rate limits (5000 requests/hour)