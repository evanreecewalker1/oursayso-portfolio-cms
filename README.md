# OurSayso Portfolio CMS

A professional content management system for the OurSayso Sales iPad Portfolio application. Built with React and featuring secure team authentication, project management, and automated deployment.

## 🚀 Live CMS
**Access the live CMS at:** [https://oursayso-portfolio-cms.netlify.app](https://oursayso-portfolio-cms.netlify.app)

## 🔐 Team Access

### Login Credentials
| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| `admin` | `admin2024` | Administrator | Full access to all features |
| `evan` | `evan2024` | Owner | Full access to all features |
| `team1` | `team1pass` | Editor | Project editing and publishing |
| `team2` | `team2pass` | Editor | Project editing and publishing |

### Session Management
- **Session Duration**: 24 hours
- **Auto-logout**: Sessions expire automatically for security
- **Persistent Login**: Stay logged in across browser sessions

## ✨ Features

### 🎨 Project Management
- **Visual Project Builder**: Drag-and-drop interface for project organization
- **Media Management**: Support for videos, images, PDFs, and case studies
- **Background Settings**: Configurable tile and page backgrounds
- **Tag System**: Organize projects with deliverable tags
- **Preview Mode**: Live preview before publishing

### 🔧 Content Types
- **Portfolio Projects**: Full project details with media galleries
- **Case Studies**: Before/after transformations with metrics
- **Testimonials**: Client quotes and feedback
- **Media Items**: Videos, images, PDFs with metadata

### 🚀 Publishing System
- **GitHub Integration**: Automatic backup to GitHub repository
- **Netlify Deployment**: One-click publishing to live portfolio
- **JSON Generation**: Automated data export for portfolio app
- **Build Verification**: Real-time deployment status

### 🔒 Security & Authentication
- **Team-based Access Control**: Role-based permissions
- **Secure Sessions**: 24-hour encrypted localStorage sessions
- **GitHub Token Management**: Secure API integration
- **Input Validation**: Form validation and error handling

## 🛠️ Technical Stack

- **Frontend**: React 18 with Hooks
- **Styling**: CSS3 with custom design system
- **Icons**: Lucide React
- **Authentication**: Custom JWT-like session management
- **Deployment**: Netlify with automatic builds
- **Version Control**: Git with GitHub integration

## 📦 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/evanreecewalker1/oursayso-portfolio-cms.git
cd oursayso-portfolio-cms

# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:3000
```

### Build for Production
```bash
# Create production build
npm run build

# Test production build locally
npx serve -s build
```

## 🚀 Deployment

### Automatic Deployment
- **Push to GitHub**: Commits to `main` branch auto-deploy
- **Build Process**: Netlify automatically runs `npm run build`
- **Deploy Preview**: Pull requests get preview deployments

### Manual Deployment
```bash
# Build the project
npm run build

# Deploy to Netlify (if netlify-cli installed)
netlify deploy --prod --dir=build
```

## 🔧 Configuration

### Environment Variables
Create `.env` file for local development:
```env
REACT_APP_GITHUB_TOKEN=your_github_token_here
REACT_APP_GITHUB_REPO=evanreecewalker1/oursayso-sales-ipad
REACT_APP_NETLIFY_WEBHOOK=your_netlify_webhook_url
```

### GitHub Integration
1. Create GitHub Personal Access Token with repo permissions
2. Configure token in CMS Settings
3. Set repository: `evanreecewalker1/oursayso-sales-ipad`

### Netlify Setup
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Configure webhook URL for publishing

## 📱 Usage Guide

### Getting Started
1. **Login**: Use team credentials to access the CMS
2. **Dashboard**: View all projects, testimonials, and settings
3. **Create Project**: Click "Add Project" to create new portfolio item
4. **Edit Content**: Use the visual editor to update project details
5. **Publish**: Click "Publish to Netlify" to deploy changes

### Project Management
- **Drag & Drop**: Reorder projects by dragging tiles
- **Media Upload**: Add videos, images, and documents
- **Background Settings**: Set tile and page backgrounds
- **Preview**: Test projects before publishing
- **Tags**: Organize with deliverable categories

### Publishing Workflow
1. **Edit Content**: Make changes in the CMS
2. **Preview**: Review changes using preview mode
3. **Publish**: Click publish button to deploy
4. **Verify**: Check live portfolio for updates

## 🔍 Troubleshooting

### Common Issues

**Login Problems**
- Verify credentials are correct
- Clear browser cache and cookies
- Check for JavaScript errors in console

**Publishing Failures**
- Verify GitHub token has correct permissions
- Check repository name is correct
- Ensure Netlify webhook URL is valid

**Preview Not Working**
- Check network connection
- Verify GitHub repository is accessible
- Look for CORS errors in browser console

### Support
For technical support or questions:
- Check browser console for errors
- Verify all credentials in Settings
- Contact team administrator

## 📄 License

Private repository for OurSayso team use only.

## 🤝 Contributing

This is a private team repository. Team members can:
1. Create feature branches for changes
2. Submit pull requests for review
3. Follow existing code style and patterns
4. Test thoroughly before submitting

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintained by**: OurSayso Development Team