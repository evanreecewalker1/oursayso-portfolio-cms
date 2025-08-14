import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, Menu, Settings, Eye, Upload, ChevronUp, ChevronDown, X, FileImage, FileVideo, File, GripVertical } from 'lucide-react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import BandwidthMonitor from './components/BandwidthMonitor';
import CloudinaryService from './services/cloudinaryConfig';
import HybridMediaService from './services/hybridMediaService';
import ProjectDataService from './services/projectDataService';
import GalleryBuilder from './components/GalleryBuilder';

// Main CMS Component (authenticated)
const CMSApp = () => {
  const buildTimestamp = new Date().toISOString();
  console.log('🚀 ===== NETLIFY FORCE REBUILD ===== 🚀');
  console.log('🔍 DEBUG: Forcing new deployment - PDF & Publish fixes included!');
  console.log('📅 BUILD TIMESTAMP:', buildTimestamp);
  console.log('🆔 VERSION: 2025-08-14-NETLIFY-FORCE-REBUILD');
  console.log('⏰ LOADED AT:', new Date().toLocaleString());
  console.log('🔧 FIXES: PDF previews + publish error resolved');
  console.log('🚀 ========================================== 🚀');
  const { user, logout } = useAuth();
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [cacheVersion, setCacheVersion] = useState(Date.now());
  
  // Cache clearing function
  // Handle manual Cloudinary URL input for large videos
  const handleManualUrl = (url, type) => {
    if (!url || !url.includes('cloudinary.com')) {
      alert('Please enter a valid Cloudinary URL');
      return;
    }

    const fileName = url.split('/').pop() || 'manual-upload';
    const fileData = {
      name: fileName,
      url: url,
      cloudinary: true,
      cloudinaryId: url.split('/').pop()?.split('.')[0],
      uploadedAt: new Date().toISOString(),
      preview: url, // Use the URL as preview too
      type: type.includes('Video') ? 'video/mp4' : 'image/jpeg'
    };

    if (type === 'tileVideo' || type === 'tileImage') {
      updateFormObject({ tileBackgroundFile: fileData });
    } else if (type === 'pageBackground') {
      updateFormObject({ pageBackgroundFile: fileData });
    }

    setManualUrlInput('');
    console.log('✅ Manual URL added:', url);
  };

  const clearAppCache = () => {
    // Clear localStorage
    localStorage.removeItem('projects');
    localStorage.removeItem('page2Projects');  
    localStorage.removeItem('testimonials');
    localStorage.removeItem('portfolio-data');
    localStorage.removeItem('cloudinary-usage');
    localStorage.removeItem('usage-reset-date');
    
    // Clear Service Worker cache if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Update cache version to force refresh
    setCacheVersion(Date.now());
    
    // Reload the page to start fresh
    window.location.reload();
  }; // 'dashboard', 'edit-project', 'edit-testimonials', 'settings'
  const [editingProjectPage, setEditingProjectPage] = useState(1); // Track which page the project being edited is on
  // eslint-disable-next-line no-unused-vars
  const [editingProject, setEditingProject] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedPage, setDraggedPage] = useState(null); // Track which page the dragged item is from
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragOverPage, setDragOverPage] = useState(null); // Track which page we're dragging over

  // Real portfolio data from GitHub repository
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  
  // Load projects from GitHub on startup
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        console.log('🔍 Loading project data from GitHub repository...');
        setIsLoadingProjects(true);
        
        const data = await ProjectDataService.loadProjectsFromGitHub();
        
        setProjects(data.projects);
        setPage2Projects(data.page2Projects);
        setTestimonials(data.testimonials);
        
        console.log('✅ Project data loaded successfully:', {
          projects: data.projects.length,
          page2Projects: data.page2Projects.length,
          testimonials: data.testimonials.length
        });
        
        // Debug: Check if projects have media items
        data.projects.forEach((project, index) => {
          if (project.mediaItems && project.mediaItems.length > 0) {
            console.log(`📋 Project ${index + 1} "${project.title}" has ${project.mediaItems.length} media items:`, 
              project.mediaItems.map(item => `${item.type}: ${item.files?.length || 0} files`)
            );
          }
        });
      } catch (error) {
        console.error('❌ Failed to load project data:', error);
        // Fallback to default projects
        console.log('📝 Using fallback default projects');
        setProjects([
    {
      id: '1',
      title: 'Lovell Leadership Conferences',
      category: 'Events',
      description: 'Leadership development conferences designed to inspire and educate senior executives. Transformed traditional conference format with interactive workshops and AI-powered networking.',
      tags: ['leadership', 'conferences', 'events', 'executive-training'],
      hasVideo: true,
      backgrounds: {
        tile: {
          type: 'video',
          file: {
            name: 'project1.mp4',
            type: 'video/mp4',
            url: '/videos/project1.mp4',
            uploadedAt: '2024-01-15T10:00:00Z'
          }
        },
        page: {
          name: 'project1-bg.jpg',
          type: 'image/jpeg',
          url: '/images/backgrounds/project1-bg.jpg',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-01-15T10:00:00Z'
        }
      },
      mediaItems: [
        {
          id: '1-1',
          type: 'video',
          title: 'Event Highlights',
          files: [{ url: '/videos/project1.mp4', name: 'project1.mp4', type: 'video/mp4' }]
        },
        {
          id: '1-2',
          type: 'case-study',
          title: 'Impact Report',
          files: []
        }
      ],
      metadata: {
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        version: 1,
        status: 'draft'
      }
    },
    {
      id: '2',
      title: 'Rarely Heard Voices Videos',
      category: 'Video',
      description: 'Powerful documentary series amplifying underrepresented voices in corporate leadership. Award-winning video production with compelling storytelling.',
      tags: ['documentary', 'video-production', 'diversity', 'leadership'],
      hasVideo: true,
      backgrounds: {
        tile: {
          type: 'image',
          file: {
            name: 'project2.png',
            type: 'image/png',
            url: '/images/project2.png',
            uploadedAt: '2024-01-20T10:00:00Z'
          }
        },
        page: {
          name: 'project2-bg.jpg',
          type: 'image/jpeg',
          url: '/images/backgrounds/project2-bg.jpg',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-01-20T10:00:00Z'
        }
      },
      metadata: {
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
        version: 1,
        status: 'draft'
      }
    },
    {
      id: '3',
      title: 'DRYZZE® & Cook Pronto® Branding',
      category: 'Design & Digital',
      description: 'Complete brand identity and digital strategy for innovative kitchen technology brands. Modern design system with cohesive brand experience.',
      tags: ['branding', 'logo-design', 'brand-identity', 'kitchen-tech'],
      hasVideo: false,
      backgrounds: {
        tile: {
          type: 'image',
          file: {
            name: 'project3.png',
            type: 'image/png',
            url: '/images/project3.png',
            uploadedAt: '2024-02-01T10:00:00Z'
          }
        },
        page: {
          name: 'project3-bg.jpg',
          type: 'image/jpeg',
          url: '/images/backgrounds/project3-bg.jpg',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-02-01T10:00:00Z'
        }
      },
      metadata: {
        createdAt: '2024-02-01T10:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z',
        version: 1,
        status: 'draft'
      }
    },
    {
      id: '4',
      title: 'Warner Bros & Discovery Training',
      category: 'Design & Digital',
      description: 'Interactive training materials and digital resources for Warner Bros Discovery. Engaging multimedia content for global team development.',
      tags: ['training-materials', 'interactive-design', 'multimedia', 'corporate-training'],
      hasVideo: false,
      backgrounds: {
        tile: {
          type: 'image',
          file: {
            name: 'project4.png',
            type: 'image/png',
            url: '/images/project4.png',
            uploadedAt: '2024-02-10T10:00:00Z'
          }
        },
        page: {
          name: 'project4-bg.jpg',
          type: 'image/jpeg',
          url: '/images/backgrounds/project4-bg.jpg',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-02-10T10:00:00Z'
        }
      },
      metadata: {
        createdAt: '2024-02-10T10:00:00Z',
        updatedAt: '2024-02-10T10:00:00Z',
        version: 1,
        status: 'draft'
      }
    },
    {
      id: '5',
      title: 'River Island \'Wrapped\' Video',
      category: 'Video',
      description: 'Dynamic promotional video campaign for River Island\'s seasonal collection. High-energy visual storytelling with modern aesthetic.',
      tags: ['promotional-video', 'fashion', 'retail', 'commercial'],
      hasVideo: true,
      backgrounds: {
        tile: {
          type: 'video',
          file: {
            name: 'riverisland-video.mp4',
            type: 'video/mp4',
            url: '/public/projects/project-05-riverisland/media/video-01.mp4',
            uploadedAt: '2024-02-15T10:00:00Z'
          }
        },
        page: {
          name: 'riverisland-bg.png',
          type: 'image/png',
          url: '/public/projects/project-05-riverisland/background.png',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-02-15T10:00:00Z'
        }
      },
      mediaItems: [
        {
          id: '5-1',
          type: 'video',
          title: 'Promotional Video',
          files: [{
            url: '/public/projects/project-05-riverisland/media/video-01.mp4',
            name: 'video-01.mp4',
            type: 'video/mp4'
          }]
        }
      ],
      metadata: {
        createdAt: '2024-02-15T10:00:00Z',
        updatedAt: '2024-02-15T10:00:00Z',
        version: 1,
        status: 'draft'
      }
    },
    {
      id: '6',
      title: 'Accor Owner Services Catalogue',
      category: 'Design & Digital',
      description: 'Comprehensive digital catalogue for Accor hotel owner services. Clean, professional design with intuitive navigation and service showcases.',
      tags: ['catalogue-design', 'digital-publishing', 'hospitality', 'service-design'],
      hasVideo: false,
      backgrounds: {
        tile: {
          type: 'image',
          file: {
            name: 'project6.png',
            type: 'image/png',
            url: '/images/project6.png',
            uploadedAt: '2024-02-20T10:00:00Z'
          }
        },
        page: {
          name: 'project6-bg.jpg',
          type: 'image/jpeg',
          url: '/images/backgrounds/project6-bg.jpg',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-02-20T10:00:00Z'
        }
      },
      metadata: {
        createdAt: '2024-02-20T10:00:00Z',
        updatedAt: '2024-02-20T10:00:00Z',
        version: 1,
        status: 'draft'
      }
    },
    {
      id: '7',
      title: 'Noah\'s Promotional Film',
      category: 'Video',
      description: 'Emotional promotional film showcasing Noah\'s mission and impact. Compelling narrative with professional cinematography and sound design.',
      tags: ['promotional-film', 'non-profit', 'storytelling', 'emotional'],
      hasVideo: true,
      backgrounds: {
        tile: {
          type: 'image',
          file: {
            name: 'project7.png',
            type: 'image/png',
            url: '/images/project7.png',
            uploadedAt: '2024-03-01T10:00:00Z'
          }
        },
        page: {
          name: 'project7-bg.jpg',
          type: 'image/jpeg',
          url: '/images/backgrounds/project7-bg.jpg',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-03-01T10:00:00Z'
        }
      },
      metadata: {
        createdAt: '2024-03-01T10:00:00Z',
        updatedAt: '2024-03-01T10:00:00Z',
        version: 1,
        status: 'draft'
      }
    },
    {
      id: '8',
      title: 'Wealmoor Website Design',
      category: 'Design & Digital',
      description: 'Modern, responsive website design for Wealmoor investment platform. Clean interface with sophisticated user experience and financial data visualization.',
      tags: ['website-design', 'fintech', 'responsive-design', 'user-experience'],
      hasVideo: false,
      backgrounds: {
        tile: {
          type: 'image',
          file: {
            name: 'project8.png',
            type: 'image/png',
            url: '/images/project8.png',
            uploadedAt: '2024-03-10T10:00:00Z'
          }
        },
        page: {
          name: 'project8-bg.jpg',
          type: 'image/jpeg',
          url: '/images/backgrounds/project8-bg.jpg',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-03-10T10:00:00Z'
        }
      },
      metadata: {
        createdAt: '2024-03-10T10:00:00Z',
        updatedAt: '2024-03-10T10:00:00Z',
        version: 1,
        status: 'draft'
      }
    },
    {
      id: '9',
      title: 'Insight Research Website',
      category: 'Design & Digital',
      description: 'Professional website for research consultancy firm. Data-driven design with research showcase and client portal functionality.',
      tags: ['website-design', 'research', 'data-visualization', 'consulting'],
      hasVideo: false,
      backgrounds: {
        tile: {
          type: 'image',
          file: {
            name: 'project9.png',
            type: 'image/png',
            url: '/images/project9.png',
            uploadedAt: '2024-03-15T10:00:00Z'
          }
        },
        page: {
          name: 'project9-bg.jpg',
          type: 'image/jpeg',
          url: '/images/backgrounds/project9-bg.jpg',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-03-15T10:00:00Z'
        }
      },
      metadata: {
        createdAt: '2024-03-15T10:00:00Z',
        updatedAt: '2024-03-15T10:00:00Z',
        version: 1,
        status: 'draft'
      }
    },
    {
      id: '10',
      title: 'ARDA Impact Video Shoot & Website',
      category: 'Design & Digital',
      description: 'Comprehensive digital campaign for ARDA including impact video production and responsive website. Showcases organization impact with compelling visuals.',
      tags: ['video-production', 'website-design', 'non-profit', 'impact-storytelling'],
      hasVideo: true,
      backgrounds: {
        tile: {
          type: 'image',
          file: {
            name: 'project10.png',
            type: 'image/png',
            url: '/images/project10.png',
            uploadedAt: '2024-03-20T10:00:00Z'
          }
        },
        page: {
          name: 'project10-bg.jpg',
          type: 'image/jpeg',
          url: '/images/backgrounds/project10-bg.jpg',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-03-20T10:00:00Z'
        }
      },
      mediaItems: [
        {
          id: '10-1',
          type: 'video',
          title: 'Impact Video',
          files: []
        },
        {
          id: '10-2',
          type: 'gallery',
          title: 'Website Screenshots',
          files: []
        }
      ],
      metadata: {
        createdAt: '2024-03-20T10:00:00Z',
        updatedAt: '2024-03-20T10:00:00Z',
        version: 1,
        status: 'draft'
        }
      }
      ]);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    loadProjectData();
  }, []); // Load once on component mount

  // Page 2 projects - managed via GitHub
  const [page2Projects, setPage2Projects] = useState([]);

  // Real client testimonials - managed via GitHub
  const [testimonials, setTestimonials] = useState([]);
  
  // Gallery management state
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Project Editor State
  const [projectForm, setProjectForm] = useState({
    title: '',
    category: 'Events',
    description: '',
    tags: [],
    tileBackgroundType: 'image', // 'image' or 'video'
    tileBackgroundFile: null,
    pageBackgroundFile: null,
    mediaItems: []
  });
  
  const [newTag, setNewTag] = useState('');
  const [dragOverFile, setDragOverFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null); // {id, title} or null
  const [successMessage, setSuccessMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormState, setInitialFormState] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({
    text: '',
    author: '',
    project: ''
  });
  const [settingsForm, setSettingsForm] = useState({
    githubToken: '',
    githubRepo: '',
    netlifyWebhook: '',
    portfolioUrl: ''
  });
  const [settingsErrors, setSettingsErrors] = useState({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publishProgress, setPublishProgress] = useState({
    step: 0,
    message: '',
    error: null,
    isPublishing: false
  });
  const [showPublishHelp, setShowPublishHelp] = useState(false);
  const [draggedTestimonial, setDraggedTestimonial] = useState(null);

  // Testimonial drag handlers
  const handleTestimonialDragStart = (e, index) => {
    setDraggedTestimonial(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTestimonialDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTestimonialDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedTestimonial === null || draggedTestimonial === targetIndex) return;
    
    const reorderedTestimonials = [...testimonials];
    const draggedItem = reorderedTestimonials[draggedTestimonial];
    
    // Remove dragged item
    reorderedTestimonials.splice(draggedTestimonial, 1);
    // Insert at target position
    reorderedTestimonials.splice(targetIndex, 0, draggedItem);
    
    setTestimonials(reorderedTestimonials);
    setDraggedTestimonial(null);
  };
  
  // File upload refs
  const tileImageRef = useRef(null);
  const tileVideoRef = useRef(null);
  const pageBackgroundRef = useRef(null);
  
  // Auto-save projects to GitHub whenever they change (with debounce)
  useEffect(() => {
    if (isLoadingProjects) return; // Don't save while initially loading
    
    const saveTimer = setTimeout(async () => {
      try {
        console.log('💾 Auto-saving project data to GitHub...', {
          projects: projects.length,
          page2Projects: page2Projects.length,
          testimonials: testimonials.length
        });
        
        await ProjectDataService.saveProjectsToGitHub(projects, page2Projects, testimonials);
        console.log('✅ Project data auto-saved to GitHub successfully');
      } catch (error) {
        console.error('❌ Failed to auto-save to GitHub:', error);
        // localStorage fallback already handled in the service
      }
    }, 2000); // Debounce: save 2 seconds after last change

    return () => clearTimeout(saveTimer);
  }, [projects, page2Projects, testimonials, isLoadingProjects]);

  // Cleanup blob URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if (projectForm.tileBackgroundFile && projectForm.tileBackgroundFile.needsCleanup && projectForm.tileBackgroundFile.preview && projectForm.tileBackgroundFile.preview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(projectForm.tileBackgroundFile.preview);
        } catch (cleanupError) {
          console.warn('Failed to cleanup tile background blob URL on unmount:', cleanupError);
        }
      }
      
      if (projectForm.pageBackgroundFile && projectForm.pageBackgroundFile.needsCleanup && projectForm.pageBackgroundFile.preview && projectForm.pageBackgroundFile.preview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(projectForm.pageBackgroundFile.preview);
        } catch (cleanupError) {
          console.warn('Failed to cleanup page background blob URL on unmount:', cleanupError);
        }
      }
    };
  }, [projectForm.tileBackgroundFile, projectForm.pageBackgroundFile]);

  const handleDragStart = (e, index, page = 1) => {
    console.log('🟢 Drag started for item at index:', index, 'from page', page);
    setDraggedItem(index);
    setDraggedPage(page);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, index, page = 1) => {
    e.preventDefault();
    if (draggedItem !== null && !(draggedItem === index && draggedPage === page)) {
      setDragOverIndex(index);
      setDragOverPage(page);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDragOverPage(null);
  };

  const handleDrop = (e, dropIndex, dropPage = 1) => {
    e.preventDefault();
    console.log('🟢 Drop event - moving from page', draggedPage, 'index', draggedItem, 'to page', dropPage, 'index', dropIndex);
    
    if (draggedItem === null) {
      console.log('❌ Invalid drop - no dragged item');
      handleDragEnd();
      return;
    }

    // Same page, same position - no change needed
    if (draggedPage === dropPage && draggedItem === dropIndex) {
      console.log('❌ No change needed - same position');
      handleDragEnd();
      return;
    }

    const projectStatus = getProjectCountStatus();
    
    // Check capacity limits for cross-page moves
    if (draggedPage !== dropPage) {
      if (dropPage === 1 && projectStatus.page1.atLimit) {
        alert('Page 1 is full! Cannot move project there.');
        handleDragEnd();
        return;
      }
      
      if (dropPage === 2 && projectStatus.page2.atLimit) {
        alert('Page 2 is full! Cannot move project there.');
        handleDragEnd();
        return;
      }
    }
    
    // Handle reordering logic
    if (draggedPage === dropPage) {
      // Same page reordering
      const currentProjects = draggedPage === 1 ? [...projects] : [...page2Projects];
      const draggedProject = currentProjects[draggedItem];
      
      // Remove the dragged item
      const newProjects = currentProjects.filter((_, index) => index !== draggedItem);
      
      // Calculate insertion index
      let insertIndex = dropIndex;
      if (draggedItem < dropIndex) {
        insertIndex = dropIndex - 1;
      }
      
      // Insert at the new position
      newProjects.splice(insertIndex, 0, draggedProject);
      
      // Update state
      if (draggedPage === 1) {
        setProjects(newProjects);
      } else {
        setPage2Projects(newProjects);
      }
      
    } else {
      // Cross-page move
      const sourceProjects = draggedPage === 1 ? [...projects] : [...page2Projects];
      const targetProjects = dropPage === 1 ? [...projects] : [...page2Projects];
      
      const draggedProject = sourceProjects[draggedItem];
      
      // Remove from source
      const newSourceProjects = sourceProjects.filter((_, index) => index !== draggedItem);
      
      // Add to target at the correct position
      const newTargetProjects = [...targetProjects];
      newTargetProjects.splice(dropIndex, 0, draggedProject);
      
      // Update both arrays
      if (draggedPage === 1) {
        setProjects(newSourceProjects);
        setPage2Projects(newTargetProjects);
      } else {
        setPage2Projects(newSourceProjects);
        setProjects(newTargetProjects);
      }
      
      setSuccessMessage(`Moved "${draggedProject.title}" from Page ${draggedPage} to Page ${dropPage}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    
    console.log('✅ Move completed');
    handleDragEnd();
  };

  const handleDragEnd = () => {
    console.log('🔴 Drag ended, cleaning up');
    setDraggedItem(null);
    setDraggedPage(null);
    setDragOverIndex(null);
    setDragOverPage(null);
  };

  const moveProjectUp = (index) => {
    if (index === 0) return; // Already at top
    
    console.log('⬆️ Moving project up from index', index, 'to', index - 1);
    const newProjects = [...projects];
    const temp = newProjects[index];
    newProjects[index] = newProjects[index - 1];
    newProjects[index - 1] = temp;
    
    setProjects(newProjects);
    console.log('✅ New order:', newProjects.map(p => p.title));
  };

  const moveProjectDown = (index) => {
    if (index === projects.length - 1) return; // Already at bottom
    
    console.log('⬇️ Moving project down from index', index, 'to', index + 1);
    const newProjects = [...projects];
    const temp = newProjects[index];
    newProjects[index] = newProjects[index + 1];
    newProjects[index + 1] = temp;
    
    setProjects(newProjects);
    console.log('✅ New order:', newProjects.map(p => p.title));
  };

  // Page 2 project management functions
  const moveProject2Up = (index) => {
    if (index === 0) return; // Already at top
    
    const newProjects = [...page2Projects];
    const temp = newProjects[index];
    newProjects[index] = newProjects[index - 1];
    newProjects[index - 1] = temp;
    
    setPage2Projects(newProjects);
  };

  const moveProject2Down = (index) => {
    if (index === page2Projects.length - 1) return; // Already at bottom
    
    const newProjects = [...page2Projects];
    const temp = newProjects[index];
    newProjects[index] = newProjects[index + 1];
    newProjects[index + 1] = temp;
    
    setPage2Projects(newProjects);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Events': '#3bc310',
      'Video': '#ae52fb',
      'Design & Digital': '#ff0d46'
    };
    return colors[category] || '#666';
  };

  // Project Editor Functions
  const resetProjectForm = () => {
    const emptyForm = {
      title: '',
      category: 'Events',
      description: '',
      tags: [],
      tileBackgroundType: 'image',
      tileBackgroundFile: null,
      pageBackgroundFile: null,
      mediaItems: []
    };
    setProjectForm(emptyForm);
    setInitialFormState(JSON.stringify(emptyForm));
    setErrors({});
    setNewTag('');
    setHasUnsavedChanges(false);
  };

  const loadProjectForEdit = (project) => {
    console.log('🔍 DEBUG: Loading project for edit:', project);
    
    // Handle both old and new data structures
    const formData = {
      title: project.title || '',
      category: project.category || 'Events',
      description: project.description || '',
      tags: project.tags || [],
      tileBackgroundType: project.backgrounds?.tile?.type || project.tileBackgroundType || 'image',
      tileBackgroundFile: (() => {
        const tileBackground = project.backgrounds?.tile?.file || project.tileBackgroundFile;
        // If tile background exists but has a local file path (not Cloudinary URL), treat as null
        if (tileBackground && tileBackground.url && (tileBackground.url.startsWith('/images/') || tileBackground.url.startsWith('/videos/'))) {
          console.log('🔄 Ignoring invalid local tile background URL:', tileBackground.url);
          return null;
        }
        return tileBackground || null;
      })(),
      pageBackgroundFile: (() => {
        const pageBackground = project.backgrounds?.page || project.pageBackgroundFile;
        // If page background exists but has a local file path (not Cloudinary URL), treat as null
        if (pageBackground && pageBackground.url && pageBackground.url.startsWith('/images/')) {
          console.log('🔄 Ignoring invalid local page background URL:', pageBackground.url);
          return null;
        }
        return pageBackground || null;
      })(),
      mediaItems: (project.mediaItems || []).map(item => ({
        ...item,
        // Ensure both images and files arrays exist for backward compatibility
        images: item.images || item.files || [],
        files: item.files || item.images || []
      }))
    };

    console.log('📝 Loading project with media items:', {
      projectTitle: project.title,
      mediaItemsCount: project.mediaItems?.length || 0,
      mediaItems: project.mediaItems
    });

    setProjectForm(formData);
    setInitialFormState(JSON.stringify(formData));
    setErrors({});
    setHasUnsavedChanges(false);
  };

  // Track changes in form
  const updateFormField = (field, value) => {
    console.log(`🔍 DEBUG: Form field '${field}' changed to:`, value);
    
    const newForm = { ...projectForm, [field]: value };
    setProjectForm(newForm);
    
    console.log('🔍 DEBUG: Updated projectForm state:', newForm);
    
    // Check if form has changed from initial state
    const hasChanged = JSON.stringify(newForm) !== initialFormState;
    setHasUnsavedChanges(hasChanged);
  };

  const updateFormObject = (updates) => {
    const newForm = { ...projectForm, ...updates };
    setProjectForm(newForm);
    
    // Check if form has changed from initial state
    const hasChanged = JSON.stringify(newForm) !== initialFormState;
    setHasUnsavedChanges(hasChanged);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !projectForm.tags.includes(newTag.trim())) {
      updateFormObject({
        tags: [...projectForm.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    updateFormObject({
      tags: projectForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    // Prevent Chrome crashes with immediate safety checks
    try {
      // Check if file is corrupted or invalid
      if (!file.name || !file.type || file.size === 0) {
        throw new Error('Invalid file - file appears to be corrupted or empty');
      }
      
      // Memory safety check - Chrome can crash with very large files
      if (file.size > 200 * 1024 * 1024) { // 200MB absolute limit
        throw new Error('File too large. Maximum file size is 200MB to prevent browser crashes.');
      }
    } catch (safetyError) {
      setErrors(prev => ({
        ...prev,
        [type]: safetyError.message
      }));
      return;
    }

    // Validate file type
    const allowedTypes = {
      tileImage: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      tileVideo: ['video/mp4', 'video/webm', 'video/mov'],
      pageBackground: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      galleryImage: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      pdf: ['application/pdf']
    };

    if (allowedTypes[type] && !allowedTypes[type].includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [type]: `Invalid file type. Please upload: ${allowedTypes[type].map(t => t.split('/')[1].toUpperCase()).join(', ')}`
      }));
      return;
    }

    // Get storage method decision from hybrid service
    const storageDecision = HybridMediaService.getStorageMethod(file);
    console.log('📁 HYBRID MEDIA SERVICE ACTIVE! Storage decision for', file.name, ':', storageDecision);
    console.log('📁 File will be stored using:', storageDecision.method, '- Reason:', storageDecision.reason);

    // Adjust size limits based on storage method
    let sizeLimit;
    if (storageDecision.method === 'local') {
      // Local storage can handle much larger files
      sizeLimit = type.includes('Video') ? 500 * 1024 * 1024 : 100 * 1024 * 1024; // 500MB videos, 100MB images
    } else {
      // Cloudinary limits
      sizeLimit = type.includes('Video') ? 150 * 1024 * 1024 : 50 * 1024 * 1024; // 150MB videos, 50MB images
    }

    if (file.size > sizeLimit) {
      const limitMB = Math.round(sizeLimit / (1024 * 1024));
      setErrors(prev => ({
        ...prev,
        [type]: `File size must be less than ${limitMB}MB (${storageDecision.method} storage)`
      }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });

    // Create temporary preview for immediate feedback
    let tempPreview = null;
    try {
      // Only create blob URL for immediate preview, will be cleaned up quickly
      tempPreview = URL.createObjectURL(file);
    } catch (blobError) {
      console.warn('Failed to create temporary preview:', blobError);
      tempPreview = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkxvYWRpbmc8L3RleHQ+PC9zdmc+';
    }

    // Show loading state with temporary preview
    const loadingFile = {
      file,
      preview: tempPreview,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploading: true,
      temporaryPreview: tempPreview && tempPreview.startsWith('blob:') ? tempPreview : null
    };
    updateFileInForm(type, loadingFile);

    try {
      console.log(`🔄 Processing ${type} upload:`, file.name);
      console.log('🔄 Storage method will be:', storageDecision.method);
      
      // Generate predictable public_id for tile and background images to enable overwriting
      const getPublicId = () => {
        if (type.includes('tile')) {
          // Use project ID for tile backgrounds to enable overwriting
          const projectId = editingProject?.id || `project_${Date.now()}`;
          return `portfolio/tiles/tile_${projectId}`;
        } else if (type.includes('page')) {
          // Use project ID for page backgrounds to enable overwriting  
          const projectId = editingProject?.id || `project_${Date.now()}`;
          return `portfolio/backgrounds/bg_${projectId}`;
        }
        return null; // Let Cloudinary generate ID for media gallery items
      };

      const uploadOptions = {
        folder: `portfolio/${type.includes('tile') ? 'tiles' : type.includes('page') ? 'backgrounds' : 'gallery'}`,
        tags: ['portfolio', type, 'background']
      };

      // Add overwrite options for tile and background images
      const publicId = getPublicId();
      if (publicId) {
        uploadOptions.public_id = publicId;
        uploadOptions.overwrite = true;
        console.log(`🔄 Using overwrite with public_id: ${publicId}`);
      }

      // Use hybrid media service with project context - it will decide upload method
      const hybridOptions = {
        ...uploadOptions,
        projectId: editingProject?.id || `project_${Date.now()}`,
        type: type
      };
      
      console.log(`🚀 Starting ${storageDecision.method} upload via HybridMediaService`);
      const uploadPromise = HybridMediaService.uploadMedia(file, hybridOptions);
      
      // Add 30 second timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      );
      
      const result = await Promise.race([uploadPromise, timeoutPromise]);
      console.log(`✅ ${storageDecision.method} upload completed:`, result.url || result.localPath);

      // Clean up temporary preview blob URL
      if (tempPreview && tempPreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(tempPreview);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temporary preview:', cleanupError);
        }
      }

      // Create final file object with hybrid storage data
      const finalFileData = {
        file,
        preview: (() => {
          if (result.storageType === 'portfolio') {
            // For portfolio repository files, use the local path directly
            console.log('📁 Final portfolio file preview set to repository path:', result.localPath);
            return result.localPath || result.url;
          } else if (result.storageType === 'local') {
            // For browser-stored files, use the local path directly - no blob URLs in persistent state
            console.log('💾 Final local file preview set to local path:', result.localPath);
            return result.localPath || result.url;
          } else {
            // For Cloudinary, use direct URL
            console.log('☁️ Final Cloudinary file preview set to URL:', result.url);
            return result.url;
          }
        })(),
        name: file.name,
        size: result.bytes || file.size,
        type: file.type,
        url: result.url,
        cloudinaryId: result.publicId,
        uploadedAt: new Date().toISOString(),
        dimensions: result.width ? { width: result.width, height: result.height } : undefined,
        uploading: false,
        
        // Hybrid storage properties
        storageType: result.storageType || 'cloudinary', // 'cloudinary' or 'local'
        localPath: result.localPath || null,
        needsServerUpload: result.needsServerUpload || false,
        cloudinary: result.storageType === 'cloudinary' // Legacy compatibility
      };

      // Check dimensions for recommendations (for images)
      if (file.type.startsWith('image/') && result.width && result.height) {
        const recommendations = {
          tileImage: { width: 800, height: 800, ratio: '1:1' },
          pageBackground: { width: 1920, height: 1080, ratio: '16:9' },
          galleryImage: { width: 1920, height: 1080, ratio: '16:9' }
        };

        if (recommendations[type]) {
          const rec = recommendations[type];
          if (result.width !== rec.width || result.height !== rec.height) {
            console.warn(`Image dimensions: ${result.width}x${result.height}. Recommended: ${rec.width}x${rec.height} (${rec.ratio})`);
          }
        }
      }

      // For local and portfolio files, clean up any blob URLs that might be lingering
      if (result.storageType === 'local' || result.storageType === 'portfolio') {
        console.log('🧹 Cleaning up blob URLs after successful upload');
        HybridMediaService.cleanupProjectBlobs(hybridOptions.projectId);
      }

      console.log('🔄 DEBUG: Setting completed file state:', finalFileData);
      updateFileInForm(type, finalFileData);
      console.log(`✅ Successfully uploaded ${type}:`, result.url || result.localPath);
      
      // Show success message
      const fileTypeDisplay = type.includes('tile') ? 'tile background' : 'page background';
      const storageLocation = result.storageType === 'portfolio' ? 'portfolio repository' : 
                              result.storageType === 'local' ? 'local storage' : 'Cloudinary';
      setSuccessMessage(`✅ ${fileTypeDisplay} uploaded successfully to ${storageLocation}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${type}:`, error);
      
      // Clean up temporary preview on error
      if (tempPreview && tempPreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(tempPreview);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temporary preview on error:', cleanupError);
        }
      }
      
      // Show error and remove loading state
      setErrors(prev => ({
        ...prev,
        [type]: `Upload failed: ${error.message || 'Unknown error'}`
      }));
      
      // Remove the file from form
      updateFileInForm(type, null);
    }
  };

  const updateFileInForm = (type, fileWithPreview) => {
    console.log('🔄 DEBUG: updateFileInForm called with:', { type, fileWithPreview });
    
    if (type === 'tileImage' || type === 'tileVideo') {
      // Clean up previous temporary preview if exists
      const currentFile = projectForm.tileBackgroundFile;
      if (currentFile && currentFile.temporaryPreview && currentFile.temporaryPreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(currentFile.temporaryPreview);
        } catch (cleanupError) {
          console.warn('Failed to cleanup previous blob URL:', cleanupError);
        }
      }
      
      console.log('🔄 DEBUG: Updating tileBackgroundFile with:', fileWithPreview);
      updateFormObject({
        tileBackgroundFile: fileWithPreview
      });
    } else if (type === 'pageBackground') {
      // Clean up previous blob URL if exists
      const currentFile = projectForm.pageBackgroundFile;
      if (currentFile && currentFile.needsCleanup && currentFile.preview && currentFile.preview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(currentFile.preview);
        } catch (cleanupError) {
          console.warn('Failed to cleanup previous blob URL:', cleanupError);
        }
      }
      
      console.log('🔄 DEBUG: Updating pageBackgroundFile with:', fileWithPreview);
      updateFormObject({
        pageBackgroundFile: fileWithPreview
      });
    }
  };

  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileDragEnter = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFile(type);
  };

  const handleFileDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFile(null);
  };

  const handleFileDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFile(null);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const addMediaItem = () => {
    const newItem = {
      id: Date.now().toString(),
      type: 'gallery',
      title: '',
      files: []
    };
    setProjectForm(prev => ({
      ...prev,
      mediaItems: [...prev.mediaItems, newItem]
    }));
  };

  const updateMediaItem = (id, updates) => {
    setProjectForm(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const removeMediaItem = (id) => {
    setProjectForm(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.filter(item => item.id !== id)
    }));
    
    // CRITICAL: Also update the main projects state for auto-save and publish
    if (projectForm.id) {
      if (editingProjectPage === 1) {
        setProjects(prev => prev.map(project => 
          project.id === projectForm.id ? {
            ...project,
            mediaItems: project.mediaItems.filter(item => item.id !== id)
          } : project
        ));
      } else {
        setPage2Projects(prev => prev.map(project => 
          project.id === projectForm.id ? {
            ...project,
            mediaItems: project.mediaItems.filter(item => item.id !== id)
          } : project
        ));
      }
      
      console.log(`✅ Removed media item from page ${editingProjectPage} projects state for auto-save`);
    }
  };

  // Auto-group gallery images by filename patterns
  const autoGroupGalleryImages = (uploadedFile, projectId) => {
    const fileName = uploadedFile.name.toLowerCase();
    const isImageFile = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    
    if (!isImageFile) return null;
    
    // Detect gallery patterns: gallery1, gallery 1, gallery_1, etc.
    const galleryPattern = /^gallery[\s_-]*\d*/i;
    const isGalleryImage = galleryPattern.test(fileName);
    
    if (!isGalleryImage) return null;
    
    // Find existing gallery item or create new one
    let existingGallery = projectForm.mediaItems.find(item => 
      item.type === 'gallery' && 
      (item.title.toLowerCase().includes('gallery') || 
       item.title === '' || 
       item.title.toLowerCase() === 'untitled media')
    );
    
    if (!existingGallery) {
      // Create new gallery item
      const newGalleryId = `gallery-${Date.now()}`;
      existingGallery = {
        id: newGalleryId,
        type: 'gallery',
        title: 'Project Gallery',
        files: []
      };
      
      setProjectForm(prev => ({
        ...prev,
        mediaItems: [...prev.mediaItems, existingGallery]
      }));
      
      return newGalleryId;
    }
    
    return existingGallery.id;
  };
  
  // Enhanced media upload handler with auto-grouping
  const handleMediaUpload = async (file, mediaItemId) => {
    try {
      console.log('📁 Starting media upload:', file.name);
      
      // Check if this should be auto-grouped into gallery
      const galleryItemId = autoGroupGalleryImages(file, projectForm.id);
      const targetItemId = galleryItemId || mediaItemId;
      
      // Upload via hybrid service
      const result = await HybridMediaService.uploadMedia(file, { 
        projectId: projectForm.id || 'temp' 
      });
      
      console.log('✅ Media upload result:', result);
      
      // Add to appropriate media item
      setProjectForm(prev => ({
        ...prev,
        mediaItems: prev.mediaItems.map(item => 
          item.id === targetItemId ? {
            ...item,
            files: [...(item.files || []), result]
          } : item
        )
      }));
      
      return result;
    } catch (error) {
      console.error('❌ Media upload failed:', error);
      throw error;
    }
  };

  // Handle gallery images upload via GalleryBuilder
  const handleGalleryUpload = async (images, galleryId) => {
    try {
      console.log(`📸 Uploading ${images.length} images to gallery ${galleryId}...`);
      setGalleryUploading(true);
      
      const uploadedFiles = [];
      
      for (const image of images) {
        try {
          // Upload via hybrid service
          const result = await HybridMediaService.uploadMedia(image, { 
            projectId: projectForm.id || 'temp',
            type: 'gallery-image'
          });
          
          // Add gallery-specific metadata
          const galleryFile = {
            ...result,
            id: `gallery-img-${Date.now()}-${Math.random()}`,
            name: image.name,
            size: image.size,
            uploadedAt: new Date().toISOString(),
            storageType: result.storageType || 'cloudinary'
          };
          
          uploadedFiles.push(galleryFile);
          console.log('✅ Gallery image uploaded:', galleryFile.name);
        } catch (error) {
          console.error('❌ Failed to upload gallery image:', image.name, error);
          // Continue with other images
        }
      }
      
      // Update the gallery with new images
      if (uploadedFiles.length > 0) {
        // Update projectForm for current editing
        setProjectForm(prev => ({
          ...prev,
          mediaItems: prev.mediaItems.map(item => 
            item.id === galleryId ? {
              ...item,
              images: [...(item.images || []), ...uploadedFiles],
              files: [...(item.images || []), ...uploadedFiles], // Keep both arrays in sync
              title: `🖼️ Project Gallery (${(item.images?.length || 0) + uploadedFiles.length} images)`
            } : item
          )
        }));
        
        // CRITICAL: Also update the main projects state for auto-save
        if (projectForm.id) {
          if (editingProjectPage === 1) {
            setProjects(prev => prev.map(project => 
              project.id === projectForm.id ? {
                ...project,
                mediaItems: project.mediaItems.map(item => 
                  item.id === galleryId ? {
                    ...item,
                    images: [...(item.images || []), ...uploadedFiles],
                    files: [...(item.images || []), ...uploadedFiles], // Keep both arrays in sync
                    title: `🖼️ Project Gallery (${(item.images?.length || 0) + uploadedFiles.length} images)`
                  } : item
                )
              } : project
            ));
          } else {
            setPage2Projects(prev => prev.map(project => 
              project.id === projectForm.id ? {
                ...project,
                mediaItems: project.mediaItems.map(item => 
                  item.id === galleryId ? {
                    ...item,
                    images: [...(item.images || []), ...uploadedFiles],
                    files: [...(item.images || []), ...uploadedFiles], // Keep both arrays in sync
                    title: `🖼️ Project Gallery (${(item.images?.length || 0) + uploadedFiles.length} images)`
                  } : item
                )
              } : project
            ));
          }
          
          console.log(`✅ Updated page ${editingProjectPage} projects state for auto-save`);
        }
        
        console.log(`✅ Added ${uploadedFiles.length} images to gallery`);
      }
      
      return uploadedFiles;
    } catch (error) {
      console.error('❌ Gallery upload failed:', error);
      throw error;
    } finally {
      setGalleryUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!projectForm.title.trim()) {
      newErrors.title = 'Project title is required';
    }
    
    if (!projectForm.description.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    if (!projectForm.pageBackgroundFile) {
      newErrors.pageBackground = 'Project page background is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSaveProject = async (saveAndClose = true) => {
    if (!validateForm()) return;

    console.log('🔍 DEBUG: Starting project save...');
    console.log('🔍 DEBUG: Current projectForm data:', projectForm);
    console.log('🔍 DEBUG: editingProject:', editingProject);
    console.log('🔍 DEBUG: editingProjectPage:', editingProjectPage);

    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Organize project data for publishing
      const newProject = {
        id: editingProject?.id || Date.now().toString(),
        title: projectForm.title,
        category: projectForm.category,
        description: projectForm.description,
        tags: projectForm.tags,
        hasVideo: projectForm.tileBackgroundType === 'video' || projectForm.mediaItems.some(item => item.type === 'video'),
        
        // Background files structured for publishing
        backgrounds: {
          tile: projectForm.tileBackgroundFile ? {
            type: projectForm.tileBackgroundType,
            file: {
              name: projectForm.tileBackgroundFile.name,
              size: projectForm.tileBackgroundFile.size,
              type: projectForm.tileBackgroundFile.type,
              dimensions: projectForm.tileBackgroundFile.dimensions,
              uploadedAt: projectForm.tileBackgroundFile.uploadedAt,
              cloudinary: projectForm.tileBackgroundFile.cloudinary || false,
              cloudinaryId: projectForm.tileBackgroundFile.cloudinaryId || null,
              // Use Cloudinary URL if available, otherwise preview
              url: projectForm.tileBackgroundFile.url || projectForm.tileBackgroundFile.preview
            }
          } : {
            type: projectForm.tileBackgroundType,
            file: null
          },
          page: projectForm.pageBackgroundFile ? {
            name: projectForm.pageBackgroundFile.name,
            size: projectForm.pageBackgroundFile.size,
            type: projectForm.pageBackgroundFile.type,
            dimensions: projectForm.pageBackgroundFile.dimensions,
            uploadedAt: projectForm.pageBackgroundFile.uploadedAt,
            cloudinary: projectForm.pageBackgroundFile.cloudinary || false,
            cloudinaryId: projectForm.pageBackgroundFile.cloudinaryId || null,
            // Use Cloudinary URL if available, otherwise preview
            url: projectForm.pageBackgroundFile.url || projectForm.pageBackgroundFile.preview
          } : null
        },
        
        // Media items structured for publishing
        mediaItems: projectForm.mediaItems.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          files: item.files || [],
          images: item.images || [], // Add images array for gallery items
          order: projectForm.mediaItems.indexOf(item)
        })),
        
        // Metadata for publishing system
        metadata: {
          createdAt: editingProject?.metadata?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: (editingProject?.metadata?.version || 0) + 1,
          status: 'draft' // ready, published
        },

        // Legacy fields for backward compatibility
        tileBackgroundType: projectForm.tileBackgroundType,
        tileBackgroundFile: projectForm.tileBackgroundFile,
        pageBackgroundFile: projectForm.pageBackgroundFile
      };

      console.log('🔍 DEBUG: New project data being saved:', newProject);
      console.log('🔍 DEBUG: Tile background in new project:', {
        'backgrounds.tile.file': newProject.backgrounds.tile.file,
        'tileBackgroundFile': newProject.tileBackgroundFile
      });

      if (editingProject) {
        // Update existing project - check which page it's on
        if (editingProjectPage === 1) {
          setProjects(prev => prev.map(p => {
            if (p.id === editingProject.id) {
              return {
                ...p, // Preserve existing project structure
                ...newProject, // Override with new data
                metadata: {
                  ...p.metadata,
                  ...newProject.metadata,
                  updatedAt: new Date().toISOString()
                }
              };
            }
            return p;
          }));
        } else {
          setPage2Projects(prev => prev.map(p => {
            if (p.id === editingProject.id) {
              return {
                ...p,
                ...newProject,
                metadata: {
                  ...p.metadata,
                  ...newProject.metadata,
                  updatedAt: new Date().toISOString()
                }
              };
            }
            return p;
          }));
        }
        
        console.log('🔍 DEBUG: Project updated successfully');
        console.log('🔍 DEBUG: Current projects after update:', editingProjectPage === 1 ? projects : page2Projects);
        
        setSuccessMessage(`Project "${newProject.title}" has been updated successfully.`);
      } else {
        // Add new project - determine which page to add to
        const projectStatus = getProjectCountStatus();
        if (!projectStatus.page1.atLimit) {
          setProjects(prev => [...prev, newProject]);
          setSuccessMessage(`Project "${newProject.title}" has been created successfully.`);
        } else if (!projectStatus.page2.atLimit) {
          setPage2Projects(prev => [...prev, newProject]);
          setSuccessMessage(`Project "${newProject.title}" has been created on Page 2.`);
        } else {
          setErrors({ general: 'All project pages are full. Delete a project to add a new one.' });
          return;
        }
      }

      // Update form state to reflect saved data
      setInitialFormState(JSON.stringify(projectForm));
      setHasUnsavedChanges(false);

      // Verify state after React update cycle
      setTimeout(() => {
        console.log('🔍 DEBUG: State verification after save (async check):');
        console.log('🔍 DEBUG: Projects after 100ms:', editingProjectPage === 1 ? projects : page2Projects);
      }, 100);

      if (saveAndClose) {
        setCurrentView('dashboard');
        resetProjectForm();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving project:', error);
      setErrors({ general: 'Failed to save project. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewProject = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  // eslint-disable-next-line no-unused-vars
  const handleDeleteProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setDeleteConfirm({ id: projectId, title: project.title });
    }
  };

  const confirmDeleteProject = () => {
    if (deleteConfirm) {
      setProjects(prev => prev.filter(p => p.id !== deleteConfirm.id));
      setSuccessMessage(`Project "${deleteConfirm.title}" has been deleted successfully.`);
      setDeleteConfirm(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const cancelDeleteProject = () => {
    setDeleteConfirm(null);
  };

  const getProjectCountStatus = () => {
    const page1Count = projects.length;
    const page2Count = page2Projects.length;
    const page1Max = 10;
    const page2Max = 12;
    return { 
      page1: { count: page1Count, max: page1Max, atLimit: page1Count >= page1Max },
      page2: { count: page2Count, max: page2Max, atLimit: page2Count >= page2Max },
      showPage2: page1Count >= page1Max || page2Count > 0
    };
  };

  // Publish System Functions
  const generateProjectFilePath = (projectId, filename, type = 'image') => {
    if (!filename) {
      console.warn('⚠️ generateProjectFilePath called with undefined filename');
      return `/projects/unknown/media/unknown-file`;
    }
    
    const sanitizedId = projectId.toString().toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileExtension = filename.split('.').pop().toLowerCase();
    
    switch (type) {
      case 'tileBackground':
        return `/images/tiles/${sanitizedId}.${fileExtension}`;
      case 'pageBackground':
        return `/images/backgrounds/${sanitizedId}.${fileExtension}`;
      case 'media':
        return `/projects/${sanitizedId}/media/${filename}`;
      default:
        return `/images/${filename}`;
    }
  };

  const convertProjectToPortfolioFormat = (project, index) => {
    console.log(`🔍 DEBUG: Converting project #${index} for portfolio:`, project);
    
    const converted = {
      id: project.id,
      title: project.title,
      category: project.category,
      description: project.description,
      tags: project.tags || [],
      order: index,
      slug: project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      
      // Background files - handle both Cloudinary and local storage
      tileBackground: {
        type: project.backgrounds?.tile?.type || project.tileBackgroundType || 'image',
        url: (() => {
          const fileData = project.backgrounds?.tile?.file || project.tileBackgroundFile;
          if (!fileData) return null;
          
          // Use appropriate URL based on storage type
          let baseUrl = fileData.url || fileData.localPath;
          if (!baseUrl) return null;
          
          // Add cache busting for Cloudinary URLs only (local URLs are served fresh)
          if (fileData.storageType === 'cloudinary' || fileData.cloudinary) {
            return `${baseUrl}?v=${cacheVersion}`;
          }
          
          return baseUrl;
        })(),
        storageType: (project.backgrounds?.tile?.file || project.tileBackgroundFile)?.storageType || 'cloudinary'
      },
      
      pageBackground: {
        url: (() => {
          const fileData = project.backgrounds?.page || project.pageBackgroundFile;
          if (!fileData) return null;
          
          // Use appropriate URL based on storage type
          let baseUrl = fileData.url || fileData.localPath;
          if (!baseUrl) return null;
          
          // Add cache busting for Cloudinary URLs only
          if (fileData.storageType === 'cloudinary' || fileData.cloudinary) {
            return `${baseUrl}?v=${cacheVersion}`;
          }
          
          return baseUrl;
        })(),
        dimensions: (project.backgrounds?.page || project.pageBackgroundFile)?.dimensions || null,
        storageType: (project.backgrounds?.page || project.pageBackgroundFile)?.storageType || 'cloudinary'
      },
      
      // Media items
      mediaItems: (project.mediaItems || []).map(item => {
        // Handle gallery items specially - they may have both files and images arrays
        if (item.type === 'gallery') {
          // Combine files from both 'files' and 'images' arrays for galleries
          const allFiles = [
            ...(item.files || []),
            ...(item.images || [])
          ].filter(file => file && file.name);
          
          console.log(`🖼️ GALLERY CONVERSION: Processing ${allFiles.length} gallery files:`, {
            galleryId: item.id,
            filesCount: (item.files || []).length,
            imagesCount: (item.images || []).length,
            allFilesCount: allFiles.length
          });
          
          return {
            id: item.id,
            type: item.type,
            title: item.title,
            files: allFiles.map(file => ({
              // CRITICAL FIX: Preserve Cloudinary URLs for gallery images
              url: (() => {
                if (file.url && file.url.includes('cloudinary.com')) {
                  console.log(`🖼️ PRESERVING Cloudinary URL for gallery image:`, {
                    fileName: file.name,
                    originalUrl: file.url,
                    storageType: file.storageType
                  });
                  return file.url;
                }
                
                // For videos stored in repository, use the repository path  
                if (file.url && file.url.startsWith('/videos/')) {
                  console.log(`🎬 PRESERVING repository video path in gallery:`, {
                    fileName: file.name,
                    repositoryPath: file.url,
                    storageType: file.storageType
                  });
                  return file.url;
                }
                
                // For local files or files without URLs, use the generated path
                const localPath = generateProjectFilePath(project.id, file.name, 'media');
                console.log(`📁 USING local path for gallery file:`, {
                  fileName: file.name,
                  localPath: localPath,
                  originalUrl: file.url || 'none'
                });
                return localPath;
              })(),
              name: file.name,
              type: file.type
            })),
            order: item.order || 0
          };
        }
        
        // Handle non-gallery media items
        return {
          id: item.id,
          type: item.type,
          title: item.title,
          files: (item.files || []).filter(file => file && file.name).map(file => ({
            // CRITICAL FIX: Preserve Cloudinary URLs instead of forcing local paths
            url: (() => {
              // For files with Cloudinary URLs, preserve them
              if (file.url && file.url.includes('cloudinary.com')) {
                console.log(`☁️ PRESERVING Cloudinary URL for file:`, {
                  fileName: file.name,
                  originalUrl: file.url,
                  itemType: item.type,
                  storageType: file.storageType
                });
                return file.url;
              }
              
              // For videos stored in repository, use the repository path
              if (item.type === 'video' && file.url && file.url.startsWith('/videos/')) {
                console.log(`🎬 PRESERVING repository video path:`, {
                  fileName: file.name,
                  repositoryPath: file.url,
                  itemType: item.type,
                  storageType: file.storageType
                });
                return file.url;
              }
              
              // For local files or files without URLs, use the generated path
              const localPath = generateProjectFilePath(project.id, file.name, 'media');
              console.log(`📁 USING local path for file:`, {
                fileName: file.name,
                localPath: localPath,
                itemType: item.type,
                originalUrl: file.url || 'none'
              });
              return localPath;
            })(),
            name: file.name,
            type: file.type
          })),
          order: item.order || 0
        };
      }),
      
      // Metadata
      hasVideo: project.hasVideo || false,
      createdAt: project.metadata?.createdAt || new Date().toISOString(),
      updatedAt: project.metadata?.updatedAt || new Date().toISOString(),
      status: 'published'
    };
    
    console.log(`🔍 DEBUG: Converted project result:`, converted);
    return converted;
  };

  const generatePortfolioJSON = () => {
    console.log('🔍 DEBUG: Starting JSON generation...');
    console.log('🔍 DEBUG: Current projects state (page 1):', projects);
    console.log('🔍 DEBUG: Current projects state (page 2):', page2Projects);
    
    // Convert page 1 projects to portfolio format
    const portfolioProjects = projects.map((project, index) => 
      convertProjectToPortfolioFormat(project, index)
    );
    
    console.log('🔍 DEBUG: Converted page 1 projects for portfolio:', portfolioProjects);

    // Convert page 2 projects to portfolio format
    const page2PortfolioProjects = page2Projects.map((project, index) => 
      convertProjectToPortfolioFormat(project, index)
    );
    
    console.log('🔍 DEBUG: Converted page 2 projects for portfolio:', page2PortfolioProjects);

    // Generate projects.json (page 1)
    const projectsJSON = {
      projects: portfolioProjects,
      metadata: {
        totalProjects: portfolioProjects.length,
        categories: [...new Set(projects.map(p => p.category))],
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        page: 1
      }
    };

    // Generate page2-projects.json (page 2)
    const page2ProjectsJSON = {
      projects: page2PortfolioProjects,
      metadata: {
        totalProjects: page2PortfolioProjects.length,
        categories: [...new Set(page2Projects.map(p => p.category))],
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        page: 2
      }
    };

    // Generate testimonials.json
    const testimonialsJSON = {
      testimonials: testimonials,
      metadata: {
        totalTestimonials: testimonials.length,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    // Generate maintenance status
    const maintenanceJSON = {
      maintenanceMode: maintenanceMode,
      lastUpdated: new Date().toISOString()
    };

    const finalJSON = {
      projects: projectsJSON,
      page2Projects: page2ProjectsJSON,
      testimonials: testimonialsJSON,
      maintenance: maintenanceJSON
    };
    
    console.log('🔍 DEBUG: Final generated JSON data:', finalJSON);
    
    return finalJSON;
  };

  const validatePublishContent = () => {
    const errors = [];
    const warnings = [];
    
    console.log('🔍 DEBUG: Validating publish content...');
    console.log('🔍 DEBUG: Projects data:', projects);
    if (projects.length > 0) {
      console.log('🔍 DEBUG: First project structure:', projects[0]);
      console.log('🔍 DEBUG: First project tileBackgroundFile:', projects[0].tileBackgroundFile);
      console.log('🔍 DEBUG: First project backgrounds:', projects[0].backgrounds);
    }

    // Check if there are projects on page 1
    if (projects.length === 0) {
      errors.push('At least one project is required on Page 1 to publish');
    }

    // Validate page 1 projects
    projects.forEach((project, index) => {
      if (!project.title?.trim()) {
        errors.push(`Page 1 Project ${index + 1}: Title is required`);
      }
      
      if (!project.description?.trim()) {
        errors.push(`Page 1 Project ${index + 1}: Description is required`);
      }
      
      if (!project.backgrounds?.page && !project.pageBackgroundFile) {
        console.log(`🔍 DEBUG: Project ${index + 1} missing page background:`, {
          'backgrounds.page': project.backgrounds?.page,
          'pageBackgroundFile': project.pageBackgroundFile
        });
        errors.push(`Page 1 Project ${index + 1}: Page background is required`);
      }

      if (!project.backgrounds?.tile?.file && !project.tileBackgroundFile) {
        console.log(`🔍 DEBUG: Project ${index + 1} missing tile background:`, {
          'backgrounds.tile.file': project.backgrounds?.tile?.file,
          'tileBackgroundFile': project.tileBackgroundFile
        });
        warnings.push(`Page 1 Project ${index + 1}: Tile background recommended`);
      }
    });

    // Validate page 2 projects if any exist
    page2Projects.forEach((project, index) => {
      if (!project.title?.trim()) {
        errors.push(`Page 2 Project ${index + 1}: Title is required`);
      }
      
      if (!project.description?.trim()) {
        errors.push(`Page 2 Project ${index + 1}: Description is required`);
      }
      
      if (!project.backgrounds?.page && !project.pageBackgroundFile) {
        errors.push(`Page 2 Project ${index + 1}: Page background is required`);
      }

      if (!project.backgrounds?.tile?.file && !project.tileBackgroundFile) {
        warnings.push(`Page 2 Project ${index + 1}: Tile background recommended`);
      }
    });

    // Check testimonials
    if (testimonials.length === 0) {
      warnings.push('No testimonials found - consider adding some');
    }

    // Info about page 2
    if (page2Projects.length > 0) {
      warnings.push(`Publishing ${page2Projects.length} additional projects on Page 2`);
    }

    return { errors, warnings, isValid: errors.length === 0 };
  };

  // Configuration state for deployment settings
  const [deployConfig, setDeployConfig] = useState(() => {
    // Try to load from localStorage first, then fall back to env vars
    const savedConfig = localStorage.getItem('portfolio-cms-config');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.warn('Failed to parse saved config, using defaults');
      }
    }
    
    return {
      githubToken: process.env.REACT_APP_GITHUB_TOKEN || '',
      githubRepo: process.env.REACT_APP_GITHUB_REPO || 'evanreecewalker1/oursayso-sales-ipad',
      netlifyWebhook: process.env.REACT_APP_NETLIFY_WEBHOOK || 'https://api.netlify.com/build_hooks/689c758dc4139eee0c344a19',
      portfolioUrl: process.env.REACT_APP_PORTFOLIO_URL || 'https://oursayso-sales-ipad.netlify.app'
    };
  });

  // UTF-8 encoding utility (same as ProjectDataService)
  const utf8ToBase64 = (str) => {
    try {
      // First convert string to UTF-8 bytes, then to base64
      // This handles Unicode characters that btoa() can't handle
      return btoa(unescape(encodeURIComponent(str)));
    } catch (error) {
      console.error('❌ UTF-8 to Base64 encoding failed:', error);
      // Fallback: try to sanitize the string first
      const sanitized = str.replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII chars
      console.log('⚠️ Using sanitized ASCII-only version for GitHub publish');
      return btoa(sanitized);
    }
  };

  // GitHub API helper functions
  const uploadFileToGitHub = async (token, repo, path, content, message) => {
    const [owner, repoName] = repo.split('/');
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
    
    // First, try to get the current file to get its SHA if it exists
    let sha = null;
    try {
      const existingFile = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (existingFile.ok) {
        const fileData = await existingFile.json();
        sha = fileData.sha;
      }
    } catch (error) {
      console.log('File does not exist, creating new file');
    }

    // Upload or update the file
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message,
        content: utf8ToBase64(content), // Proper UTF-8 to Base64 encoding
        ...(sha && { sha }) // Include SHA if updating existing file
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API Error: ${error.message || response.statusText}`);
    }

    return await response.json();
  };

  const deployToNetlify = async (jsonData) => {
    console.log('🔍 DEBUG: Starting deployment to Netlify...');
    console.log('🔍 DEBUG: JSON data being deployed:', jsonData);
    
    const config = deployConfig;
    
    // Validate configuration
    if (!config.githubToken) {
      throw new Error('GitHub token is required. Please configure in Settings.');
    }
    if (!config.githubRepo) {
      throw new Error('GitHub repository is required. Please configure in Settings.');
    }
    if (!config.netlifyWebhook) {
      throw new Error('Netlify webhook URL is required. Please configure in Settings.');
    }
    
    // Validate webhook URL format
    if (!config.netlifyWebhook.startsWith('https://api.netlify.com/build_hooks/')) {
      throw new Error('Invalid Netlify webhook URL format. It should start with: https://api.netlify.com/build_hooks/');
    }

    // Step 1: Validate content
    setPublishProgress(prev => ({
      ...prev,
      step: 1,
      message: 'Validating content...'
    }));
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Generate JSON files
    setPublishProgress(prev => ({
      ...prev,
      step: 2,
      message: 'Generating JSON files...'
    }));
    await new Promise(resolve => setTimeout(resolve, 800));

    // Step 3: Upload files to GitHub repository
    setPublishProgress(prev => ({
      ...prev,
      step: 3,
      message: 'Uploading files to GitHub repository...'
    }));
    
    try {
      // Upload projects.json (page 1)
      const page1JSONContent = JSON.stringify(jsonData.projects, null, 2);
      console.log('🔍 DEBUG: Page 1 JSON content being uploaded to GitHub:', page1JSONContent);
      
      await uploadFileToGitHub(
        config.githubToken,
        config.githubRepo,
        'public/data/projects.json',
        page1JSONContent,
        '🤖 Update page 1 projects data from Portfolio CMS'
      );
      
      // Upload page2-projects.json (page 2)
      const page2JSONContent = JSON.stringify(jsonData.page2Projects, null, 2);
      console.log('🔍 DEBUG: Page 2 JSON content being uploaded to GitHub:', page2JSONContent);
      
      await uploadFileToGitHub(
        config.githubToken,
        config.githubRepo,
        'public/data/page2-projects.json',
        page2JSONContent,
        '🤖 Update page 2 projects data from Portfolio CMS'
      );
      
      // Upload testimonials.json
      await uploadFileToGitHub(
        config.githubToken,
        config.githubRepo,
        'public/data/testimonials.json',
        JSON.stringify(jsonData.testimonials, null, 2),
        '🤖 Update testimonials data from Portfolio CMS'
      );
      
      // Upload maintenance.json
      await uploadFileToGitHub(
        config.githubToken,
        config.githubRepo,
        'public/data/maintenance.json',
        JSON.stringify(jsonData.maintenance, null, 2),
        '🤖 Update maintenance mode from Portfolio CMS'
      );
      
      console.log('✅ Files uploaded successfully to GitHub');
    } catch (error) {
      console.error('❌ GitHub upload failed:', error);
      throw new Error(`Failed to upload files to GitHub: ${error.message}`);
    }

    // Step 4: Trigger Netlify deployment
    setPublishProgress(prev => ({
      ...prev,
      step: 4,
      message: 'Triggering Netlify deployment...'
    }));
    
    try {
      console.log('🌐 Triggering Netlify webhook:', config.netlifyWebhook);
      
      const netlifyResponse = await fetch(config.netlifyWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger_branch: 'main',
          trigger_title: 'Portfolio CMS Update',
          trigger_body: `Updated portfolio data at ${new Date().toISOString()}`
        })
      });

      if (!netlifyResponse.ok) {
        const errorText = await netlifyResponse.text().catch(() => 'No response body');
        throw new Error(`Netlify webhook failed: ${netlifyResponse.status} ${netlifyResponse.statusText}. Response: ${errorText}`);
      }

      console.log('✅ Netlify deployment triggered successfully');
    } catch (error) {
      console.error('❌ Netlify deployment failed:', error);
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Failed to connect to Netlify webhook. Please check:\n1. Webhook URL is correct\n2. Internet connection\n3. Netlify webhook is active');
      } else if (error.message.includes('CORS')) {
        throw new Error('CORS error when calling Netlify webhook. This may be a browser security restriction.');
      } else {
        throw new Error(`Failed to trigger Netlify deployment: ${error.message}`);
      }
    }

    // Step 5: Building portfolio site (monitoring)
    setPublishProgress(prev => ({
      ...prev,
      step: 5,
      message: 'Building portfolio site...'
    }));
    
    // Wait for build to complete (estimate)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 6: Deployment complete
    setPublishProgress(prev => ({
      ...prev,
      step: 6,
      message: 'Deployment complete!'
    }));

    return {
      success: true,
      deployUrl: config.portfolioUrl,
      deployId: 'deploy-' + Date.now(),
      timestamp: new Date().toISOString()
    };
  };

  // Settings Management Functions
  const openSettingsModal = () => {
    setSettingsForm({
      githubToken: deployConfig.githubToken,
      githubRepo: deployConfig.githubRepo,
      netlifyWebhook: deployConfig.netlifyWebhook,
      portfolioUrl: deployConfig.portfolioUrl
    });
    setSettingsErrors({});
    setShowSettingsModal(true);
  };

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
    setSettingsForm({
      githubToken: '',
      githubRepo: '',
      netlifyWebhook: '',
      portfolioUrl: ''
    });
    setSettingsErrors({});
  };

  const validateSettings = () => {
    const errors = {};
    
    if (!settingsForm.githubToken.trim()) {
      errors.githubToken = 'GitHub token is required';
    } else if (!settingsForm.githubToken.startsWith('ghp_')) {
      errors.githubToken = 'Invalid GitHub token format (should start with ghp_)';
    }
    
    if (!settingsForm.githubRepo.trim()) {
      errors.githubRepo = 'GitHub repository is required';
    } else if (!settingsForm.githubRepo.includes('/')) {
      errors.githubRepo = 'Repository should be in format: owner/repository';
    }
    
    if (!settingsForm.netlifyWebhook.trim()) {
      errors.netlifyWebhook = 'Netlify webhook URL is required';
    } else if (!settingsForm.netlifyWebhook.startsWith('https://api.netlify.com/build_hooks/')) {
      errors.netlifyWebhook = 'Invalid Netlify webhook URL format';
    }
    
    if (!settingsForm.portfolioUrl.trim()) {
      errors.portfolioUrl = 'Portfolio URL is required';
    } else if (!settingsForm.portfolioUrl.startsWith('https://')) {
      errors.portfolioUrl = 'Portfolio URL should start with https://';
    }
    
    setSettingsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const testGitHubConnection = async () => {
    if (!settingsForm.githubToken || !settingsForm.githubRepo) {
      setSettingsErrors({
        ...settingsErrors,
        test: 'GitHub token and repository are required for testing'
      });
      return;
    }

    setIsTestingConnection(true);
    setSettingsErrors({});
    
    try {
      const [owner, repo] = settingsForm.githubRepo.split('/');
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${settingsForm.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        setSettingsErrors({
          ...settingsErrors,
          test: 'success:GitHub connection successful!'
        });
      } else if (response.status === 401) {
        setSettingsErrors({
          ...settingsErrors,
          test: 'Authentication failed. Please check your GitHub token.'
        });
      } else if (response.status === 404) {
        setSettingsErrors({
          ...settingsErrors,
          test: 'Repository not found. Please check the repository name and your access permissions.'
        });
      } else {
        setSettingsErrors({
          ...settingsErrors,
          test: `Connection failed: ${response.status} ${response.statusText}`
        });
      }
    } catch (error) {
      setSettingsErrors({
        ...settingsErrors,
        test: `Connection failed: ${error.message}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveSettings = () => {
    if (!validateSettings()) return;
    
    const newConfig = {
      githubToken: settingsForm.githubToken.trim(),
      githubRepo: settingsForm.githubRepo.trim(),
      netlifyWebhook: settingsForm.netlifyWebhook.trim(),
      portfolioUrl: settingsForm.portfolioUrl.trim()
    };
    
    // Save to localStorage (Note: In production, use more secure storage)
    localStorage.setItem('portfolio-cms-config', JSON.stringify(newConfig));
    
    // Update the deployConfig state
    setDeployConfig(newConfig);
    
    // Close modal
    closeSettingsModal();
    
    // Show success message
    setSuccessMessage('Settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Testimonial Management Functions
  const openTestimonialModal = (testimonial = null) => {
    if (testimonial) {
      setTestimonialForm({
        text: testimonial.text,
        author: testimonial.author,
        project: testimonial.project || ''
      });
      setEditingTestimonial(testimonial);
    } else {
      setTestimonialForm({
        text: '',
        author: '',
        project: ''
      });
      setEditingTestimonial(null);
    }
    setShowTestimonialModal(true);
  };

  const closeTestimonialModal = () => {
    setShowTestimonialModal(false);
    setTestimonialForm({ text: '', author: '', project: '' });
    setEditingTestimonial(null);
  };

  const saveTestimonial = () => {
    if (!testimonialForm.text.trim() || !testimonialForm.author.trim()) {
      return;
    }

    if (editingTestimonial) {
      // Update existing testimonial
      setTestimonials(prev => prev.map(t => 
        t.id === editingTestimonial.id 
          ? { ...t, ...testimonialForm, date: new Date().toISOString().split('T')[0] }
          : t
      ));
      setSuccessMessage(`Testimonial from ${testimonialForm.author} updated successfully.`);
    } else {
      // Add new testimonial
      const newTestimonial = {
        id: Date.now().toString(),
        ...testimonialForm,
        date: new Date().toISOString().split('T')[0]
      };
      setTestimonials(prev => [...prev, newTestimonial]);
      setSuccessMessage(`Testimonial from ${testimonialForm.author} added successfully.`);
    }

    closeTestimonialModal();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const deleteTestimonial = (testimonialId) => {
    const testimonial = testimonials.find(t => t.id === testimonialId);
    if (testimonial && window.confirm(`Delete testimonial from ${testimonial.author}?`)) {
      setTestimonials(prev => prev.filter(t => t.id !== testimonialId));
      setSuccessMessage(`Testimonial deleted successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handlePublishToNetlify = async () => {
    // Validate content first
    const validation = validatePublishContent();
    
    if (!validation.isValid) {
      setPublishProgress({
        step: 0,
        message: '',
        error: validation.errors.join('\n'),
        isPublishing: false,
        errorType: 'validation'
      });
      setShowPublishModal(true);
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Validation warnings:', validation.warnings);
    }

    // Show publish modal and start process
    setShowPublishModal(true);
    setPublishProgress({
      step: 0,
      message: 'Starting publish process...',
      error: null,
      isPublishing: true,
      errorType: null,
      warnings: validation.warnings
    });

    try {
      // Verify current state before JSON generation
      console.log('🔍 DEBUG: About to generate JSON - Current state check:');
      console.log('🔍 DEBUG: Projects (page 1) before JSON generation:', projects);
      console.log('🔍 DEBUG: Page2Projects before JSON generation:', page2Projects);
      
      // Generate JSON data
      const jsonData = generatePortfolioJSON();
      
      // Deploy to Netlify
      const result = await deployToNetlify(jsonData);
      
      if (result.success) {
        setPublishProgress(prev => ({
          ...prev,
          step: 6,
          message: `Successfully deployed to ${result.deployUrl}`,
          isPublishing: false,
          deployUrl: result.deployUrl,
          timestamp: result.timestamp
        }));
        
        // Update project statuses to 'published'
        setProjects(prev => prev.map(project => ({
          ...project,
          metadata: {
            ...project.metadata,
            status: 'published',
            lastPublished: result.timestamp
          }
        })));
      }
      
    } catch (error) {
      console.error('Publish error:', error);
      
      let errorMessage = 'Failed to publish portfolio. Please try again.';
      let errorType = 'unknown';
      
      if (error.message.includes('GitHub')) {
        errorType = 'github';
        errorMessage = `GitHub Error: ${error.message}`;
      } else if (error.message.includes('Netlify')) {
        errorType = 'netlify';
        errorMessage = `Netlify Error: ${error.message}`;
      } else if (error.message.includes('token')) {
        errorType = 'auth';
        errorMessage = 'Authentication failed. Please check your GitHub token in Settings.';
      } else if (error.message.includes('rate limit')) {
        errorType = 'rate_limit';
        errorMessage = 'GitHub API rate limit exceeded. Please try again later.';
      } else if (error.message.includes('network') || error.name === 'TypeError') {
        errorType = 'network';
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setPublishProgress({
        step: 0,
        message: '',
        error: errorMessage,
        isPublishing: false,
        errorType: errorType,
        originalError: error.message
      });
    }
  };

  const closePublishModal = () => {
    if (!publishProgress.isPublishing) {
      setShowPublishModal(false);
      setPublishProgress({
        step: 0,
        message: '',
        error: null,
        isPublishing: false
      });
    }
  };

  // Development helper to preview generated JSON
  const previewGeneratedJSON = () => {
    const jsonData = generatePortfolioJSON();
    console.log('Generated Portfolio JSON:', jsonData);
    
    // Create a downloadable JSON file for testing
    const dataStr = JSON.stringify(jsonData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'portfolio-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (currentView === 'edit-project') {
    return (
      <div className="cms-container">
        <div className="cms-header">
          <button 
            className="back-btn"
            onClick={() => {
              setCurrentView('dashboard');
              resetProjectForm();
            }}
          >
            ← Back to Dashboard
          </button>
          <div className="editor-title">
            <h1>{editingProject ? 'Edit Project' : 'New Project'}</h1>
            {hasUnsavedChanges && <span className="unsaved-indicator">• Unsaved changes</span>}
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={handlePreviewProject}
            >
              Preview Project
            </button>
          </div>
        </div>
        
        <div className="edit-content">
          {errors.general && (
            <div className="error-banner">
              {errors.general}
            </div>
          )}

          {/* Basic Info Section */}
          <div className="form-section">
            <div className="section-header">
              <h2>Basic Information</h2>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Project Title *</label>
                <input
                  id="title"
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => updateFormField('title', e.target.value)}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Enter project title"
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={projectForm.category}
                  onChange={(e) => updateFormField('category', e.target.value)}
                  className="form-select"
                >
                  <option value="Events">Events</option>
                  <option value="Video">Video</option>
                  <option value="Design & Digital">Design & Digital</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  value={projectForm.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  className={`form-textarea ${errors.description ? 'error' : ''}`}
                  placeholder="Describe your project in detail..."
                  rows="4"
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
            </div>
          </div>

          {/* Deliverable Tags Section */}
          <div className="form-section">
            <div className="section-header">
              <h2>Deliverable Tags</h2>
              <p className="section-description">Add specific deliverables for this project</p>
            </div>
            
            <div className="tags-container">
              <div className="tag-input-group">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag (e.g., animation, website, branding)"
                  className="tag-input"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <button 
                  type="button"
                  onClick={handleAddTag}
                  className="btn-add-tag"
                  disabled={!newTag.trim()}
                >
                  Add Tag
                </button>
              </div>
              
              <div className="tags-list">
                {projectForm.tags.map((tag, index) => (
                  <span key={index} className="tag-pill">
                    {tag}
                    <button 
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Background Settings Section */}
          <div className="form-section">
            <div className="section-header">
              <h2>Background Settings</h2>
            </div>
            
            <div className="background-settings">
              {/* Tile Background */}
              <div className="bg-setting-group">
                <h3>Tile Background</h3>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tileBackgroundType"
                      value="image"
                      checked={projectForm.tileBackgroundType === 'image'}
                      onChange={(e) => updateFormField('tileBackgroundType', e.target.value)}
                    />
                    <span>Image</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tileBackgroundType"
                      value="video"
                      checked={projectForm.tileBackgroundType === 'video'}
                      onChange={(e) => updateFormField('tileBackgroundType', e.target.value)}
                    />
                    <span>Video</span>
                  </label>
                </div>

                {/* Current File Preview */}
                {projectForm.tileBackgroundFile && (projectForm.tileBackgroundFile.url || projectForm.tileBackgroundFile.preview) && (
                  <div className="current-file-preview">
                    <h4>Current File:</h4>
                    <div className="current-file">
                      {projectForm.tileBackgroundFile.uploading ? (
                        <div className="upload-progress-container">
                          {/* Visual Progress Bar */}
                          <div className="upload-progress-header">
                            <div className="upload-spinner"></div>
                            <span className="upload-title">
                              {(() => {
                                const isVideo = projectForm.tileBackgroundFile.name.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv|m4v)$/);
                                return isVideo ? 
                                  `🎬 Uploading Video to Portfolio Repository` :
                                  `📸 Optimizing Image via Cloudinary`;
                              })()}
                            </span>
                          </div>
                          
                          {/* Animated Progress Bar */}
                          <div className="progress-bar-container">
                            <div className="progress-bar">
                              <div className="progress-fill"></div>
                            </div>
                          </div>
                          
                          <div className="upload-details">
                            <span className="file-name-detail">{projectForm.tileBackgroundFile.name}</span>
                            <span className="upload-status-detail">
                              {(() => {
                                const isVideo = projectForm.tileBackgroundFile.name.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv|m4v)$/);
                                return isVideo ? 
                                  "Will be available for offline iPad access" :
                                  "Optimizing and storing to CDN";
                              })()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {projectForm.tileBackgroundType === 'image' ? (
                            <div className="image-preview-container">
                              {/* Upload Success Badge for Images */}
                              <div className="upload-success-badge">
                                <div className="success-icon">✅</div>
                                <span>Image Upload Complete!</span>
                              </div>
                              
                              {/* Enhanced Image Display */}
                              <div className="image-preview-wrapper">
                                <img 
                                  src={(() => {
                                    let displayUrl;
                                    if (projectForm.tileBackgroundFile.storageType === 'portfolio') {
                                      // For portfolio repository files, use local path directly
                                      displayUrl = projectForm.tileBackgroundFile.localPath || projectForm.tileBackgroundFile.url;
                                      console.log('📁 Portfolio tile image display URL:', displayUrl);
                                    } else if (projectForm.tileBackgroundFile.storageType === 'local') {
                                      // For browser-stored files, get fresh display URL from hybrid service
                                      displayUrl = HybridMediaService.getDisplayUrl(projectForm.tileBackgroundFile) || projectForm.tileBackgroundFile.url;
                                      console.log('🖼️ Local tile image display URL:', displayUrl);
                                    } else {
                                      // For Cloudinary, use direct URL (never blob URLs for Cloudinary)
                                      displayUrl = projectForm.tileBackgroundFile.url;
                                      console.log('☁️ Cloudinary tile image display URL:', displayUrl);
                                    }
                                    
                                    // Defensive check: never render blob URLs that might be invalid
                                    if (displayUrl && displayUrl.startsWith('blob:')) {
                                      console.warn('⚠️ Preventing display of potentially invalid blob URL:', displayUrl);
                                      return projectForm.tileBackgroundFile.url || '/placeholder-image.png';
                                    }
                                    
                                    return displayUrl || '/placeholder-image.png';
                                  })()} 
                                  alt="Current tile background"
                                  className="enhanced-image-preview"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                    border: '2px solid #e5e7eb'
                                  }}
                                />
                              </div>
                              
                              {/* Image Info Panel */}
                              <div className="image-info-panel">
                                <div className="image-status">
                                  <span className="status-text">
                                    {projectForm.tileBackgroundFile.storageType === 'cloudinary' ? 
                                      '☁️ Optimized via Cloudinary CDN' : 
                                      '💾 Stored locally'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="video-preview-container">
                              {/* Upload Success Badge */}
                              <div className="upload-success-badge">
                                <div className="success-icon">✅</div>
                                <span>Video Upload Complete!</span>
                              </div>
                              
                              {/* Enhanced Video Player */}
                              <video 
                                src={(() => {
                                  let displayUrl;
                                  if (projectForm.tileBackgroundFile.storageType === 'portfolio') {
                                    // For portfolio repository files, construct the GitHub raw URL 
                                    // The fileName should be available from the GitHub upload result
                                    const fileName = projectForm.tileBackgroundFile.fileName || 
                                                   projectForm.tileBackgroundFile.localPath?.split('/').pop() ||
                                                   projectForm.tileBackgroundFile.name;
                                    displayUrl = `https://raw.githubusercontent.com/evanreecewalker1/oursayso-sales-ipad/main/public/videos/${fileName}`;
                                    console.log('🎯 GitHub video preview URL:', displayUrl);
                                  } else if (projectForm.tileBackgroundFile.storageType === 'local') {
                                    displayUrl = HybridMediaService.getDisplayUrl(projectForm.tileBackgroundFile);
                                    console.log('💾 Local video preview URL:', displayUrl);
                                  } else {
                                    displayUrl = projectForm.tileBackgroundFile.url;
                                    console.log('☁️ Cloudinary video preview URL:', displayUrl);
                                  }
                                  
                                  return displayUrl;
                                })()}
                                className="video-preview-player"
                                controls
                                muted
                                preload="metadata"
                                style={{
                                  width: '100%',
                                  maxWidth: '400px',
                                  height: '225px',
                                  borderRadius: '8px',
                                  background: '#000'
                                }}
                                onLoadStart={() => console.log('🎬 Video loading started')}
                                onLoadedData={() => console.log('✅ Video loaded successfully')}
                                onError={(e) => console.error('❌ Video load error:', e)}
                              />
                              
                              {/* Video Info Panel */}
                              <div className="video-info-panel">
                                <div className="video-status">
                                  <span className="status-text">🎯 Ready for iPad offline access</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="current-file-info">
                            <span className="file-name">
                              {projectForm.tileBackgroundFile.name}
                              {/* Enhanced storage type badges */}
                              {(() => {
                                const storageType = projectForm.tileBackgroundFile.storageType;
                                if (storageType === 'portfolio') {
                                  return <span className="storage-badge portfolio-badge">🎯 iPad Ready</span>;
                                } else if (storageType === 'cloudinary' || projectForm.tileBackgroundFile.cloudinary) {
                                  return <span className="storage-badge cloudinary-badge">☁️ Cloudinary</span>;
                                } else if (storageType === 'local') {
                                  return <span className="storage-badge local-badge">💾 Local</span>;
                                }
                                return null;
                              })()}
                            </span>
                            {projectForm.tileBackgroundFile.dimensions && (
                              <span className="file-dims">
                                {projectForm.tileBackgroundFile.dimensions.width}x{projectForm.tileBackgroundFile.dimensions.height}
                              </span>
                            )}
                            <button 
                              onClick={() => updateFormObject({ tileBackgroundFile: null })}
                              className="current-file-delete"
                              title="Remove current file"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Tile Upload Zone */}
                <div className="upload-section">
                  {(!projectForm.tileBackgroundFile || (!projectForm.tileBackgroundFile.url && !projectForm.tileBackgroundFile.preview)) && projectForm.tileBackgroundType === 'image' ? (
                    <div
                      className={`upload-zone ${dragOverFile === 'tileImage' ? 'drag-over' : ''} ${errors.tileImage ? 'error' : ''}`}
                      onDragEnter={(e) => handleFileDragEnter(e, 'tileImage')}
                      onDragOver={handleFileDragOver}
                      onDragLeave={handleFileDragLeave}
                      onDrop={(e) => handleFileDrop(e, 'tileImage')}
                      onClick={() => {
                        console.log('🔄 DEBUG: Upload zone clicked, attempting to trigger file input');
                        tileImageRef.current?.click();
                      }}
                    >
                      <div className="upload-placeholder">
                        <FileImage size={48} />
                        <p>Drop image here or click to browse</p>
                        <small>Recommended: 800x800px (1:1 ratio)</small>
                        <small>JPG, PNG, GIF up to 10MB</small>
                      </div>
                      <input
                        ref={tileImageRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          console.log('🔄 DEBUG: File input onChange triggered:', e.target.files);
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0], 'tileImage');
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : (!projectForm.tileBackgroundFile || (!projectForm.tileBackgroundFile.url && !projectForm.tileBackgroundFile.preview)) && projectForm.tileBackgroundType === 'video' ? (
                    <div
                      className={`upload-zone ${dragOverFile === 'tileVideo' ? 'drag-over' : ''} ${errors.tileVideo ? 'error' : ''}`}
                      onDragEnter={(e) => handleFileDragEnter(e, 'tileVideo')}
                      onDragOver={handleFileDragOver}
                      onDragLeave={handleFileDragLeave}
                      onDrop={(e) => handleFileDrop(e, 'tileVideo')}
                      onClick={() => tileVideoRef.current?.click()}
                    >
                      <div className="upload-placeholder">
                        <FileVideo size={48} />
                        <p>Drop video here or click to browse</p>
                        <small>Recommended: 800x800px, under 5MB</small>
                        <small>MP4, WebM, MOV formats</small>
                      </div>
                      <input
                        ref={tileVideoRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'tileVideo')}
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : null}
                  {(errors.tileImage || errors.tileVideo) && (
                    <span className="error-text">{errors.tileImage || errors.tileVideo}</span>
                  )}
                  
                </div>
              </div>

              {/* Page Background */}
              <div className="bg-setting-group">
                <h3>Project Page Background *</h3>
                <p className="bg-description">Background image for the project detail page (recommended: 1920x1080)</p>
                
                {/* Current Page Background Preview */}
                {projectForm.pageBackgroundFile && (projectForm.pageBackgroundFile.url || projectForm.pageBackgroundFile.preview) && (
                  <div className="current-file-preview">
                    <h4>Current Background:</h4>
                    <div className="current-file">
                      {projectForm.pageBackgroundFile.uploading ? (
                        <div className="upload-progress">
                          <div className="upload-spinner"></div>
                          <div className="upload-info">
                            <span className="file-name">
                              {(() => {
                                const isVideo = projectForm.pageBackgroundFile.name.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv|m4v)$/);
                                return isVideo ? 
                                  `🎬 Uploading ${projectForm.pageBackgroundFile.name} to portfolio repository...` :
                                  `📸 Uploading ${projectForm.pageBackgroundFile.name}...`;
                              })()}
                            </span>
                            <span className="upload-status">
                              {(() => {
                                const isVideo = projectForm.pageBackgroundFile.name.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv|m4v)$/);
                                return isVideo ? 
                                  "Video will be available for offline access on iPad" :
                                  "Image being optimized via Cloudinary CDN";
                              })()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <img 
                            src={(() => {
                              if (projectForm.pageBackgroundFile.storageType === 'local') {
                                // For local files, get fresh display URL from hybrid service  
                                return HybridMediaService.getDisplayUrl(projectForm.pageBackgroundFile) || projectForm.pageBackgroundFile.url;
                              } else {
                                // For Cloudinary, use direct URL
                                return projectForm.pageBackgroundFile.url || projectForm.pageBackgroundFile.preview;
                              }
                            })()} 
                            alt="Current page background"
                            className="current-thumbnail"
                          />
                          <div className="current-file-info">
                            <span className="file-name">
                              {projectForm.pageBackgroundFile.name}
                              {/* Enhanced storage type badges */}
                              {(() => {
                                const storageType = projectForm.pageBackgroundFile.storageType;
                                if (storageType === 'portfolio') {
                                  return <span className="storage-badge portfolio-badge">🎯 iPad Ready</span>;
                                } else if (storageType === 'cloudinary' || projectForm.pageBackgroundFile.cloudinary) {
                                  return <span className="storage-badge cloudinary-badge">☁️ Cloudinary</span>;
                                } else if (storageType === 'local') {
                                  return <span className="storage-badge local-badge">💾 Local</span>;
                                }
                                return null;
                              })()}
                            </span>
                            {projectForm.pageBackgroundFile.dimensions && (
                              <span className="file-dims">
                                {projectForm.pageBackgroundFile.dimensions.width}x{projectForm.pageBackgroundFile.dimensions.height}
                              </span>
                            )}
                            <button 
                              onClick={() => updateFormObject({ pageBackgroundFile: null })}
                              className="current-file-delete"
                              title="Remove current background"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {(!projectForm.pageBackgroundFile || (!projectForm.pageBackgroundFile.url && !projectForm.pageBackgroundFile.preview)) && (
                  <div
                    className={`upload-zone ${dragOverFile === 'pageBackground' ? 'drag-over' : ''} ${errors.pageBackground ? 'error' : ''}`}
                    onDragEnter={(e) => handleFileDragEnter(e, 'pageBackground')}
                    onDragOver={handleFileDragOver}
                    onDragLeave={handleFileDragLeave}
                    onDrop={(e) => handleFileDrop(e, 'pageBackground')}
                    onClick={() => pageBackgroundRef.current?.click()}
                  >
                    <div className="upload-placeholder">
                      <FileImage size={48} />
                      <p>Drop page background image here or click to browse</p>
                      <small>Recommended: 1920x1080px (16:9 ratio)</small>
                      <small>JPG, PNG, GIF up to 10MB</small>
                    </div>
                  <input
                    ref={pageBackgroundRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], 'pageBackground');
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  </div>
                )}
                {errors.pageBackground && <span className="error-text">{errors.pageBackground}</span>}
              </div>
            </div>
          </div>


          {/* Media Items Section */}
          <div className="form-section">
            <div className="section-header">
              <h2>Media Items</h2>
              <button 
                type="button"
                onClick={addMediaItem}
                className="btn btn-secondary"
              >
                <Plus size={16} />
                Add Media Item
              </button>
            </div>

            
            <div className="media-items">
              {projectForm.mediaItems.map((item) => {
                // Render GalleryBuilder for gallery items
                if (item.type === 'gallery') {
                  return (
                    <div key={item.id} className="media-item gallery-item">
                      {/* Add type selection header for gallery items too */}
                      <div className="media-item-header">
                        <GripVertical size={16} className="drag-handle" />
                        <select
                          value={item.type}
                          onChange={(e) => updateMediaItem(item.id, { type: e.target.value })}
                          className="media-type-select"
                        >
                          <option value="gallery">Gallery</option>
                          <option value="video">Video</option>
                          <option value="pdf">PDF</option>
                          <option value="case-study">Case Study</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Gallery title"
                          value={item.title}
                          onChange={(e) => updateMediaItem(item.id, { title: e.target.value })}
                          className="media-title-input"
                        />
                        <button
                          onClick={() => removeMediaItem(item.id)}
                          className="btn-icon btn-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <GalleryBuilder 
                        gallery={{
                          ...item,
                          images: item.images || item.files || [] // Support both new images array and legacy files array
                        }}
                        onGalleryUpdate={(updatedGallery) => {
                          updateMediaItem(item.id, {
                            ...updatedGallery,
                            images: updatedGallery.images || [],
                            files: updatedGallery.images || [] // Keep legacy files array in sync
                          });
                        }}
                        onUploadImages={(images) => handleGalleryUpload(images, item.id)}
                        isUploading={galleryUploading}
                      />
                    </div>
                  );
                }
                
                // Render traditional media item UI for non-gallery items  
                return (
                  <div key={item.id} className="media-item">
                    <div className="media-item-header">
                      <GripVertical size={16} className="drag-handle" />
                      <select
                        value={item.type}
                        onChange={(e) => updateMediaItem(item.id, { type: e.target.value })}
                        className="media-type-select"
                      >
                        <option value="gallery">Gallery</option>
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                        <option value="case-study">Case Study</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Media item title"
                        value={item.title}
                        onChange={(e) => updateMediaItem(item.id, { title: e.target.value })}
                        className="media-title-input"
                      />
                      <button
                        onClick={() => removeMediaItem(item.id)}
                        className="btn-icon btn-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="media-upload-area">
                    {/* Show uploaded files if any exist */}
                    {item.files && item.files.length > 0 ? (
                      <div className="uploaded-files">
                        <div className="files-grid">
                          {item.files.map((file, fileIndex) => (
                            <div key={fileIndex} className="file-preview">
                              {file.resourceType === 'image' || item.type === 'gallery' ? (
                                <img 
                                  src={file.url || file.preview} 
                                  alt={file.name}
                                  className="file-thumbnail"
                                />
                              ) : file.resourceType === 'video' || item.type === 'video' ? (
                                <div className="media-video-preview">
                                  <video 
                                    src={(() => {
                                      // For GitHub portfolio videos, use raw URL
                                      if (file.storageType === 'portfolio' && file.fileName) {
                                        return `https://raw.githubusercontent.com/evanreecewalker1/oursayso-sales-ipad/main/public/videos/${file.fileName}`;
                                      }
                                      return file.url || file.preview;
                                    })()}
                                    className="media-video-player"
                                    controls
                                    muted
                                    preload="metadata"
                                    style={{
                                      width: '100%',
                                      height: '80px',
                                      borderRadius: '4px',
                                      background: '#000'
                                    }}
                                    onLoadedData={() => console.log('✅ Media video preview loaded:', file.name)}
                                    onError={(e) => console.error('❌ Media video preview error:', file.name, e)}
                                  />
                                  <div className="video-upload-success">
                                    <span className="success-indicator">✅ {file.storageType === 'portfolio' ? 'iPad Ready' : 'Uploaded'}</span>
                                  </div>
                                </div>
                              ) : (file.resourceType === 'raw' && file.name?.toLowerCase().endsWith('.pdf')) || (item.type === 'pdf' && file.url) ? (
                                <div className="pdf-preview">
                                  <iframe
                                    src={`${file.url || file.preview}#view=FitH`}
                                    className="pdf-viewer"
                                    title={`PDF Preview: ${file.name}`}
                                    onLoad={() => console.log('✅ PDF preview loaded:', file.name)}
                                    onError={(e) => console.error('❌ PDF preview error:', file.name, e)}
                                  />
                                  <div className="pdf-info">
                                    <div className="pdf-icon">📄</div>
                                    <span className="pdf-name">{file.name}</span>
                                    <div className="pdf-upload-success">
                                      <span className="success-indicator">✅ PDF Ready</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="file-icon-preview">
                                  <File size={32} />
                                  <span className="file-name">{file.name}</span>
                                </div>
                              )}
                              <button
                                className="remove-file-btn"
                                onClick={() => {
                                  const updatedFiles = item.files.filter((_, index) => index !== fileIndex);
                                  updateMediaItem(item.id, { files: updatedFiles });
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button 
                          className="add-more-files-btn"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = item.type === 'gallery';
                            input.accept = item.type === 'gallery' ? 'image/*' : item.type === 'video' ? 'video/*' : '*/*';
                            input.onchange = async (e) => {
                              const files = Array.from(e.target.files || []);
                              for (const file of files) {
                                try {
                                  const result = await HybridMediaService.uploadMedia(file, { projectId: projectForm.id });
                                  
                                  // Check for gallery auto-grouping for images
                                  const fileName = file.name.toLowerCase();
                                  const isImageFile = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                  const galleryPattern = /^gallery[\s_-]*\d*/i;
                                  const isGalleryImage = isImageFile && galleryPattern.test(fileName);
                                  
                                  if (isGalleryImage && item.type === 'gallery') {
                                    // Update gallery title with image count
                                    const newCount = (item.files?.length || 0) + 1;
                                    const updatedFiles = [...(item.files || []), result];
                                    updateMediaItem(item.id, { 
                                      files: updatedFiles,
                                      title: `🖼️ Project Gallery (${newCount} images)`
                                    });
                                  } else {
                                    const updatedFiles = [...(item.files || []), result];
                                    updateMediaItem(item.id, { files: updatedFiles });
                                  }
                                } catch (error) {
                                  console.error('Upload failed:', error);
                                }
                              }
                            };
                            input.click();
                          }}
                        >
                          <Plus size={16} /> Add {item.type === 'gallery' ? 'More Images' : 'File'}
                        </button>
                      </div>
                    ) : (
                      <div className="upload-zone small"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = item.type === 'gallery';
                          input.accept = item.type === 'gallery' ? 'image/*' : item.type === 'video' ? 'video/*' : '*/*';
                          input.onchange = async (e) => {
                            const files = Array.from(e.target.files || []);
                            const uploadedFiles = [];
                            for (const file of files) {
                              try {
                                const result = await HybridMediaService.uploadMedia(file, { projectId: projectForm.id });
                                uploadedFiles.push(result);
                              } catch (error) {
                                console.error('Upload failed:', error);
                              }
                            }
                            if (uploadedFiles.length > 0) {
                              // Check if this is gallery images and update title accordingly
                              if (item.type === 'gallery') {
                                const imageCount = uploadedFiles.length;
                                updateMediaItem(item.id, { 
                                  files: uploadedFiles,
                                  title: `🖼️ Project Gallery (${imageCount} image${imageCount > 1 ? 's' : ''})`
                                });
                              } else {
                                updateMediaItem(item.id, { files: uploadedFiles });
                              }
                            }
                          };
                          input.click();
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <File size={32} />
                        <p>Upload {item.type === 'gallery' ? 'images' : 'files'} for this {item.type}</p>
                        {item.type === 'gallery' && (
                          <>
                            <small>📸 Upload multiple images at once</small>
                            <small>Recommended: 1920x1080px or larger</small>
                          </>
                        )}
                        {item.type === 'video' && <small>Recommended: MP4, under 50MB</small>}
                        {item.type === 'pdf' && <small>PDF documents up to 10MB</small>}
                        <small>Click to {item.type === 'gallery' ? 'select images' : 'add files'}</small>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
              
              {projectForm.mediaItems.length === 0 && (
                <div className="empty-state">
                  <File size={48} />
                  <p>No media items yet</p>
                  <small>Add media items to showcase your project content</small>
                </div>
              )}
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="bottom-cta">
            <div className="cta-content">
              <div className="cta-left">
                <button 
                  className="btn btn-secondary"
                  onClick={handlePreviewProject}
                >
                  Preview Project
                </button>
              </div>
              <div className="cta-right">
                <button 
                  className="btn btn-outline"
                  onClick={() => handleSaveProject(false)}
                  disabled={isSaving || !hasUnsavedChanges}
                >
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleSaveProject(true)}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save & Close'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Modal */}
          {showPreview && (
            <div className="modal-overlay" onClick={closePreview}>
              <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
                <div className="preview-header">
                  <h3>Project Preview</h3>
                  <button onClick={closePreview} className="close-preview">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="preview-content">
                  {/* Tile Preview */}
                  <div className="preview-section">
                    <h4>Portfolio Tile</h4>
                    <div className="tile-preview">
                      <div 
                        className="project-tile"
                        style={{
                          backgroundImage: projectForm.tileBackgroundFile && projectForm.tileBackgroundType === 'image' 
                            ? `url(${projectForm.tileBackgroundFile.preview})` 
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {projectForm.tileBackgroundFile && projectForm.tileBackgroundType === 'video' && (
                          <video 
                            src={(() => {
                              let displayUrl;
                              if (projectForm.tileBackgroundFile.storageType === 'portfolio') {
                                // For portfolio repository files, use local path directly
                                displayUrl = projectForm.tileBackgroundFile.localPath || projectForm.tileBackgroundFile.url;
                                console.log('📁 Portfolio tile preview video display URL:', displayUrl);
                              } else if (projectForm.tileBackgroundFile.storageType === 'local') {
                                // For browser-stored files, get fresh display URL from hybrid service
                                displayUrl = HybridMediaService.getDisplayUrl(projectForm.tileBackgroundFile);
                                console.log('🎬 Local tile preview video display URL:', displayUrl);
                              } else {
                                // For Cloudinary, use direct URL (never blob URLs for Cloudinary)
                                displayUrl = projectForm.tileBackgroundFile.url;
                                console.log('☁️ Cloudinary tile preview video display URL:', displayUrl);
                              }
                              
                              // Defensive check: never render blob URLs that might be invalid
                              if (displayUrl && displayUrl.startsWith('blob:')) {
                                console.warn('⚠️ Preventing display of potentially invalid blob URL for tile preview video:', displayUrl);
                                return null; // Return null to prevent video from loading
                              }
                              
                              return displayUrl;
                            })()}
                            autoPlay
                            loop
                            muted
                            className="tile-video"
                          />
                        )}
                        <div className="tile-overlay">
                          <h3 className="tile-title">{projectForm.title || 'Project Title'}</h3>
                          <span 
                            className="tile-category"
                            style={{ backgroundColor: getCategoryColor(projectForm.category) }}
                          >
                            {projectForm.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Page Preview */}
                  <div className="preview-section">
                    <h4>Project Page</h4>
                    <div className="page-preview">
                      <div 
                        className="page-hero"
                        style={{
                          backgroundImage: projectForm.pageBackgroundFile 
                            ? `url(${projectForm.pageBackgroundFile.preview})` 
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="page-hero-content">
                          <h1 className="page-title">{projectForm.title || 'Project Title'}</h1>
                          <div className="page-tags">
                            {projectForm.tags.map((tag, index) => (
                              <span key={index} className="page-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="page-content">
                        <p className="page-description">
                          {projectForm.description || 'Project description will appear here...'}
                        </p>
                        
                        {projectForm.mediaItems.length > 0 && (
                          <div className="page-media">
                            <h5>Media Items</h5>
                            <div className="media-list-enhanced">
                              {projectForm.mediaItems.map((item) => (
                                <div key={item.id} className="media-item-preview-enhanced">
                                  {/* Media Type Header */}
                                  <div className="media-header">
                                    <div className="media-type-badge">
                                      {item.type === 'gallery' && '🖼️ Gallery'}
                                      {item.type === 'video' && '🎬 Video'}
                                      {item.type === 'pdf' && '📄 PDF'}
                                      {item.type === 'case-study' && '📊 Case Study'}
                                    </div>
                                    <div className="media-title">
                                      {item.title || 'Untitled Media'}
                                      {item.files && item.files.length > 0 && item.type === 'gallery' && (
                                        <span className="media-count">({item.files.length} images)</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Visual Preview */}
                                  {item.files && item.files.length > 0 ? (
                                    <div className="media-preview-content">
                                      {item.type === 'gallery' ? (
                                        <div className="gallery-thumbnail-grid">
                                          {item.files.slice(0, 4).map((file, index) => (
                                            <div key={index} className="gallery-thumb">
                                              <img 
                                                src={file.url || file.preview} 
                                                alt={`Gallery ${index + 1}`}
                                                style={{
                                                  width: '100%',
                                                  height: '60px',
                                                  objectFit: 'cover',
                                                  borderRadius: '4px'
                                                }}
                                              />
                                            </div>
                                          ))}
                                          {item.files.length > 4 && (
                                            <div className="gallery-more">+{item.files.length - 4}</div>
                                          )}
                                        </div>
                                      ) : item.type === 'video' ? (
                                        <div className="video-thumbnail-enhanced">
                                          <video 
                                            src={(() => {
                                              const videoFile = item.files[0];
                                              if (videoFile.storageType === 'portfolio' && videoFile.fileName) {
                                                // Use GitHub raw URL for immediate preview
                                                return `https://raw.githubusercontent.com/evanreecewalker1/oursayso-sales-ipad/main/public/videos/${videoFile.fileName}`;
                                              }
                                              return videoFile.url || videoFile.preview;
                                            })()}
                                            style={{
                                              width: '100%',
                                              height: '120px',
                                              objectFit: 'cover',
                                              borderRadius: '8px',
                                              border: '2px solid #e5e7eb'
                                            }}
                                            controls
                                            muted
                                            preload="metadata"
                                            onLoadedData={() => console.log('✅ Video preview loaded')}
                                            onError={(e) => console.error('❌ Video preview error:', e)}
                                          />
                                          <div className="video-info-overlay">
                                            <div className="video-title">{item.title}</div>
                                            <div className="video-status">
                                              {item.files[0].storageType === 'portfolio' ? 
                                                '🎯 iPad Ready' : 
                                                '☁️ Cloudinary'
                                              }
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="file-icon">📁 {item.files.length} file(s)</div>
                                      )}
                                      
                                      {/* Upload Success Badge */}
                                      <div className="upload-success-mini">
                                        <span className="success-check">✅</span>
                                        <span>Uploaded</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="empty-media-preview">
                                      <span>No files uploaded yet</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const projectStatus = getProjectCountStatus();
  
  // Check if deployment is configured
  const isConfigured = deployConfig.githubToken && deployConfig.githubRepo && deployConfig.netlifyWebhook;
  
  // Helper function to edit project from either page
  const editProject = (project, page) => {
    console.log('🔍 DEBUG: Edit project triggered for:', project.title, 'on page', page);
    setEditingProject(project);
    setEditingProjectPage(page);
    loadProjectForEdit(project);
    setCurrentView('edit-project');
  };
  
  // Helper function to delete project from either page
  const deleteProject = (projectId, page) => {
    const projectsList = page === 1 ? projects : page2Projects;
    const project = projectsList.find(p => p.id === projectId);
    if (project) {
      if (window.confirm(`Delete project "${project.title}"? This action cannot be undone.`)) {
        if (page === 1) {
          setProjects(prev => prev.filter(p => p.id !== projectId));
        } else {
          setPage2Projects(prev => prev.filter(p => p.id !== projectId));
        }
        setSuccessMessage(`Project "${project.title}" has been deleted successfully.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };
  
  return (
    <div className="cms-container">
      {/* Header */}
      <div className="cms-header">
        <div className="header-left">
          <div className="logo-section">
            <img 
              src="/images/oursayso-logo.svg" 
              alt="OurSayso"
              className="header-logo"
            />
            <h1>Sales iPad App CMS</h1>
          </div>
          <div className={`config-status ${isConfigured ? 'configured' : 'not-configured'}`}>
            {isConfigured ? (
              <span className="status-indicator">✅ Deployment Ready</span>
            ) : (
              <span className="status-indicator">⚠️ Configure Deployment</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={clearAppCache}
            title="Clear all app cache and data"
          >
            🗑️ Clear Cache
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => window.open('https://oursayso-sales-ipad.netlify.app/', '_blank')}
          >
            <Eye size={18} />
            Preview
          </button>
          <button 
            className={`btn ${isConfigured ? 'btn-success' : 'btn-warning'}`}
            onClick={isConfigured ? handlePublishToNetlify : openSettingsModal}
            disabled={publishProgress.isPublishing}
            title={isConfigured ? 'Publish to Netlify' : 'Configure deployment settings first'}
          >
            <Upload size={18} />
            {publishProgress.isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="cms-content">
        {/* Success Message */}
        {successMessage && (
          <div className="success-banner">
            {successMessage}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Delete Project</h3>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"?</p>
                <p className="warning">This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={cancelDeleteProject}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={confirmDeleteProject}
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Publish Modal */}
        {showPublishModal && (
          <div className="modal-overlay">
            <div className="publish-modal">
              <div className="modal-header">
                <div className="header-content">
                  <h3>Publish to Netlify</h3>
                </div>
                <button onClick={closePublishModal} className="close-button">
                  <X size={20} />
                </button>
              </div>

              {/* Cloudinary Usage Meter */}
              <div className="usage-meter-section">
                <div className="usage-meter">
                  <div className="usage-header">
                    <div className="usage-title">
                      <span className="cloudinary-icon">☁️</span>
                      <span>Cloudinary Usage</span>
                    </div>
                    <span className="usage-percentage">
                      {Math.round(CloudinaryService.getUsageStats().monthly.percentage)}%
                    </span>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-progress"
                      style={{ 
                        width: `${Math.min(CloudinaryService.getUsageStats().monthly.percentage, 100)}%`,
                        backgroundColor: CloudinaryService.getUsageStats().monthly.percentage > 80 ? '#ef4444' : 
                                       CloudinaryService.getUsageStats().monthly.percentage > 60 ? '#f59e0b' : '#10b981'
                      }}
                    />
                  </div>
                  <div className="usage-details">
                    <span className="usage-text">
                      {(CloudinaryService.getUsageStats().monthly.used / (1024 * 1024 * 1024)).toFixed(2)} GB / {(CloudinaryService.getUsageStats().monthly.limit / (1024 * 1024 * 1024)).toFixed(0)} GB used this month
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="modal-body">
                {publishProgress.error ? (
                  <div className="publish-error">
                    <h4>
                      {publishProgress.errorType === 'validation' ? '❌ Validation Failed' : 
                       publishProgress.errorType === 'github' ? '🔗 GitHub Error' :
                       publishProgress.errorType === 'netlify' ? '🌐 Netlify Error' :
                       publishProgress.errorType === 'auth' ? '🔐 Authentication Error' :
                       publishProgress.errorType === 'rate_limit' ? '⏰ Rate Limit Error' :
                       publishProgress.errorType === 'network' ? '🌐 Network Error' :
                       '❌ Deployment Failed'}
                    </h4>
                    <div className="error-message">
                      <pre>{publishProgress.error}</pre>
                    </div>
                    
                    {publishProgress.errorType === 'validation' && (
                      <p>Please fix these issues before publishing.</p>
                    )}
                    
                    {publishProgress.errorType === 'auth' && (
                      <div className="error-actions">
                        <p>Check your credentials and try again.</p>
                        <button 
                          className="btn btn-outline"
                          onClick={() => {
                            closePublishModal();
                            openSettingsModal();
                          }}
                        >
                          Open Settings
                        </button>
                      </div>
                    )}
                    
                    {publishProgress.errorType === 'github' && (
                      <div className="error-help">
                        <p><strong>Common GitHub issues:</strong></p>
                        <ul>
                          <li>Invalid or expired token</li>
                          <li>Insufficient repository permissions</li>
                          <li>Repository not found or private</li>
                          <li>Network connectivity issues</li>
                        </ul>
                      </div>
                    )}
                    
                    {publishProgress.errorType === 'netlify' && (
                      <div className="error-help">
                        <p><strong>Common Netlify issues:</strong></p>
                        <ul>
                          <li>Invalid webhook URL</li>
                          <li>Site build hook disabled</li>
                          <li>Netlify service temporarily unavailable</li>
                        </ul>
                      </div>
                    )}
                    
                    {publishProgress.errorType === 'rate_limit' && (
                      <div className="error-help">
                        <p><strong>Rate Limit Info:</strong></p>
                        <ul>
                          <li>GitHub API allows 5,000 requests per hour for authenticated requests</li>
                          <li>Wait about 10-15 minutes before trying again</li>
                          <li>Consider using a different GitHub token if available</li>
                        </ul>
                      </div>
                    )}
                    
                    {process.env.NODE_ENV === 'development' && publishProgress.originalError && (
                      <details className="debug-info">
                        <summary>Debug Information</summary>
                        <pre>{publishProgress.originalError}</pre>
                      </details>
                    )}
                  </div>
                ) : (
                  <div className="publish-progress">
                    <div className="progress-steps">
                      {[
                        'Validating content',
                        'Generating JSON files',
                        'Uploading to repository', 
                        'Triggering deployment',
                        'Building portfolio',
                        'Deployment complete'
                      ].map((step, index) => (
                        <div 
                          key={index}
                          className={`progress-step ${
                            publishProgress.step > index ? 'completed' : 
                            publishProgress.step === index + 1 ? 'active' : 'pending'
                          }`}
                        >
                          <div className="step-indicator">
                            {publishProgress.step > index ? '✓' : index + 1}
                          </div>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    
                    {publishProgress.message && (
                      <div className="current-step">
                        <div className="step-message">{publishProgress.message}</div>
                        {publishProgress.isPublishing && (
                          <div className="loading-spinner"></div>
                        )}
                      </div>
                    )}

                    {publishProgress.step === 6 && !publishProgress.isPublishing && (
                      <div className="publish-success">
                        <h4>🎉 Portfolio Published Successfully!</h4>
                        <p className="live-url">
                          <strong>Live at:</strong>{' '}
                          <a 
                            href="https://oursayso-sales-ipad.netlify.app"
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="deployment-link"
                          >
                            oursayso-sales-ipad.netlify.app
                          </a>
                        </p>
                        <div className="success-details">
                          <p><strong>Deployment Status:</strong> ✅ Live and active</p>
                          <p><strong>Published At:</strong> {new Date(publishProgress.timestamp || Date.now()).toLocaleString()}</p>
                          <p><strong>Page 1 Projects:</strong> {projects.length}</p>
                          {page2Projects.length > 0 && (
                            <p><strong>Page 2 Projects:</strong> {page2Projects.length}</p>
                          )}
                          <p><strong>Testimonials:</strong> {testimonials.length}</p>
                          <p><strong>Maintenance Mode:</strong> {maintenanceMode ? '🔧 Enabled' : '✅ Disabled'}</p>
                        </div>
                        
                        {publishProgress.warnings && publishProgress.warnings.length > 0 && (
                          <div className="warnings-section">
                            <h5>⚠️ Warnings (Non-blocking):</h5>
                            <ul>
                              {publishProgress.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="success-actions">
                          <a 
                            href="https://oursayso-sales-ipad.netlify.app"
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                          >
                            🔗 View Live Portfolio
                          </a>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => {
                              // Open GitHub repo to show the updated files
                              window.open(`https://github.com/${deployConfig.githubRepo}/tree/main/public/data`, '_blank');
                            }}
                          >
                            📁 View Source Files
                          </button>
                        </div>
                        
                        <div className="publish-help-section">
                          <button 
                            className="help-toggle"
                            onClick={() => setShowPublishHelp(!showPublishHelp)}
                            type="button"
                          >
                            <span>What happens next?</span>
                            <span className={`arrow ${showPublishHelp ? 'expanded' : ''}`}>▼</span>
                          </button>
                          
                          {showPublishHelp && (
                            <div className="help-content">
                              <ul>
                                <li>Netlify builds your updated portfolio</li>
                                <li>New content appears on your live site (usually within 2-5 minutes)</li>
                                <li>Changes are automatically backed up in your GitHub repository</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {publishProgress.error && (
                <div className="modal-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={closePublishModal}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="modal-overlay">
            <div className="settings-modal">
              <div className="modal-header">
                <h3>Deployment Settings</h3>
                <button onClick={closeSettingsModal} className="close-preview">
                  <X size={24} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="settings-form">
                  <div className="form-group">
                    <label htmlFor="githubToken">GitHub Personal Access Token *</label>
                    <input
                      id="githubToken"
                      type="password"
                      value={settingsForm.githubToken}
                      onChange={(e) => setSettingsForm({...settingsForm, githubToken: e.target.value})}
                      className={`form-input ${settingsErrors.githubToken ? 'error' : ''}`}
                      placeholder="ghp_..."
                    />
                    {settingsErrors.githubToken && <span className="error-text">{settingsErrors.githubToken}</span>}
                    <small className="form-help">Personal access token with repository write permissions</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="githubRepo">GitHub Repository *</label>
                    <input
                      id="githubRepo"
                      type="text"
                      value={settingsForm.githubRepo}
                      onChange={(e) => setSettingsForm({...settingsForm, githubRepo: e.target.value})}
                      className={`form-input ${settingsErrors.githubRepo ? 'error' : ''}`}
                      placeholder="username/repository-name"
                    />
                    {settingsErrors.githubRepo && <span className="error-text">{settingsErrors.githubRepo}</span>}
                    <small className="form-help">Repository where portfolio data will be stored</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="netlifyWebhook">Netlify Build Hook URL *</label>
                    <input
                      id="netlifyWebhook"
                      type="url"
                      value={settingsForm.netlifyWebhook}
                      onChange={(e) => setSettingsForm({...settingsForm, netlifyWebhook: e.target.value})}
                      className={`form-input ${settingsErrors.netlifyWebhook ? 'error' : ''}`}
                      placeholder="https://api.netlify.com/build_hooks/..."
                    />
                    {settingsErrors.netlifyWebhook && <span className="error-text">{settingsErrors.netlifyWebhook}</span>}
                    <small className="form-help">Build hook URL from your Netlify site settings</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="portfolioUrl">Portfolio Site URL *</label>
                    <input
                      id="portfolioUrl"
                      type="url"
                      value={settingsForm.portfolioUrl}
                      onChange={(e) => setSettingsForm({...settingsForm, portfolioUrl: e.target.value})}
                      className={`form-input ${settingsErrors.portfolioUrl ? 'error' : ''}`}
                      placeholder="https://your-site.netlify.app"
                    />
                    {settingsErrors.portfolioUrl && <span className="error-text">{settingsErrors.portfolioUrl}</span>}
                    <small className="form-help">URL of your live portfolio site</small>
                  </div>

                  <div className="test-connection">
                    <button 
                      className="btn btn-outline"
                      onClick={testGitHubConnection}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? 'Testing...' : 'Test GitHub Connection'}
                    </button>
                    
                    {settingsErrors.test && (
                      <div className={`test-result ${
                        settingsErrors.test.startsWith('success:') ? 'success' : 'error'
                      }`}>
                        {settingsErrors.test.replace('success:', '')}
                      </div>
                    )}
                  </div>

                  <div className="maintenance-section">
                    <h4>🔧 Maintenance Mode</h4>
                    <div className="maintenance-toggle">
                      <label className="toggle-label">
                        <input 
                          type="checkbox" 
                          checked={maintenanceMode}
                          onChange={(e) => setMaintenanceMode(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        {maintenanceMode ? 'Portfolio is in maintenance mode' : 'Portfolio is live'}
                      </label>
                    </div>
                    <p className="maintenance-help">
                      When enabled, visitors will see a maintenance page instead of your portfolio.
                    </p>
                  </div>

                  <div className="security-notice">
                    <h4>🔒 Security Notes</h4>
                    <ul>
                      <li>Credentials are stored locally in your browser</li>
                      <li>Never share your GitHub token with others</li>
                      <li>Use tokens with minimal required permissions</li>
                      <li>Regularly rotate your access tokens</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={closeSettingsModal}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={saveSettings}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Testimonial Modal */}
        {showTestimonialModal && (
          <div className="modal-overlay">
            <div className="testimonial-modal">
              <div className="modal-header">
                <h3>{editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</h3>
                <button onClick={closeTestimonialModal} className="close-preview">
                  <X size={24} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="testimonial-form">
                  <div className="form-group">
                    <label htmlFor="testimonialText">Testimonial Text *</label>
                    <textarea
                      id="testimonialText"
                      value={testimonialForm.text}
                      onChange={(e) => setTestimonialForm({...testimonialForm, text: e.target.value})}
                      className="form-textarea"
                      placeholder="Enter the client testimonial..."
                      rows="4"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="testimonialAuthor">Author *</label>
                    <input
                      id="testimonialAuthor"
                      type="text"
                      value={testimonialForm.author}
                      onChange={(e) => setTestimonialForm({...testimonialForm, author: e.target.value})}
                      className="form-input"
                      placeholder="Client Name, Company/Title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="testimonialProject">Related Project (Optional)</label>
                    <input
                      id="testimonialProject"
                      type="text"
                      value={testimonialForm.project}
                      onChange={(e) => setTestimonialForm({...testimonialForm, project: e.target.value})}
                      className="form-input"
                      placeholder="Project name this testimonial relates to"
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={closeTestimonialModal}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={saveTestimonial}
                  disabled={!testimonialForm.text.trim() || !testimonialForm.author.trim()}
                >
                  {editingTestimonial ? 'Update Testimonial' : 'Add Testimonial'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Section */}
        <div className="section">
          <div className="section-header">
            <div className="section-title">
              <h2>Page 1 Projects ({projectStatus.page1.count}/{projectStatus.page1.max})</h2>
              {projectStatus.page1.atLimit && (
                <span className="limit-warning">Page 1 full</span>
              )}
            </div>
            <button 
              className={`btn btn-primary ${projectStatus.page1.atLimit && projectStatus.page2.atLimit ? 'disabled' : ''}`}
              onClick={() => {
                setEditingProject(null);
                setEditingProjectPage(1);
                resetProjectForm();
                setCurrentView('edit-project');
              }}
              disabled={projectStatus.page1.atLimit && projectStatus.page2.atLimit}
              title={projectStatus.page1.atLimit ? (projectStatus.page2.atLimit ? 'All pages full' : 'Will be added to Page 2') : 'Add to Page 1'}
            >
              <Plus size={18} />
              Add New Project
            </button>
          </div>

          <div className="project-list">
            {/* Render actual projects */}
            {projects.map((project, index) => (
              <div
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index, 1)}
                onDragOver={(e) => handleDragOver(e, index, 1)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index, 1)}
                onDragEnd={handleDragEnd}
                className={`project-item ${
                  draggedItem === index && draggedPage === 1 ? 'dragging' : ''
                } ${
                  dragOverIndex === index && dragOverPage === 1 && !(draggedItem === index && draggedPage === 1) ? 'drag-over' : ''
                }`}
              >
                <div className="project-drag">
                  <div className="drag-left">
                    <Menu size={20} />
                    <span className="project-number">{index + 1}</span>
                  </div>
                  <div className="arrow-controls">
                    <button 
                      className={`btn-icon btn-arrow ${index === 0 ? 'disabled' : ''}`}
                      onClick={() => moveProjectUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button 
                      className={`btn-icon btn-arrow ${index === projects.length - 1 ? 'disabled' : ''}`}
                      onClick={() => moveProjectDown(index)}
                      disabled={index === projects.length - 1}
                      title="Move down"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
                
                <div 
                  className="project-info clickable"
                  onClick={() => editProject(project, 1)}
                  title="Click to edit project"
                >
                  <h3>{project.title}</h3>
                  <div className="project-meta">
                    <span 
                      className="category-tag"
                      style={{ backgroundColor: getCategoryColor(project.category) }}
                    >
                      {project.category}
                    </span>
                    {project.hasVideo && <span className="video-indicator">📹 Video</span>}
                  </div>
                </div>

                <div className="project-actions">
                  <button 
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      editProject(project, 1);
                    }}
                    title="Edit project"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn-icon btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id, 1);
                    }}
                    title="Delete project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* Render empty placeholders for Page 1 (up to 10 total) */}
            {Array.from({ length: Math.max(0, 10 - projects.length) }, (_, index) => {
              const emptyIndex = projects.length + index;
              return (
                <div
                  key={`empty-${emptyIndex}`}
                  onDragOver={(e) => handleDragOver(e, emptyIndex, 1)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, emptyIndex, 1)}
                  className={`project-item project-item-empty ${
                    dragOverIndex === emptyIndex && dragOverPage === 1 ? 'drag-over' : ''
                  }`}
                >
                  <div className="project-drag">
                    <div className="drag-left">
                      <div className="empty-drag-indicator">⋮⋮</div>
                      <span className="project-number">{emptyIndex + 1}</span>
                    </div>
                  </div>
                  
                  <div className="project-info">
                    <div className="empty-placeholder">
                      <h3>Empty Slot</h3>
                      <p>Drag a project here</p>
                    </div>
                  </div>

                  <div className="project-actions">
                    <button 
                      className="btn-icon btn-add-empty"
                      onClick={() => {
                        setEditingProject(null);
                        setEditingProjectPage(1);
                        resetProjectForm();
                        setCurrentView('edit-project');
                      }}
                      title="Add new project here"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Page 2 Projects Section */}
        {projectStatus.showPage2 && (
          <div className="section">
            <div className="section-header">
              <div className="section-title">
                <h2>Page 2 Projects ({projectStatus.page2.count}/{projectStatus.page2.max})</h2>
                {projectStatus.page2.atLimit && (
                  <span className="limit-warning">Page 2 full</span>
                )}
              </div>
              <button 
                className={`btn btn-secondary ${projectStatus.page2.atLimit ? 'disabled' : ''}`}
                onClick={() => {
                  setEditingProject(null);
                  setEditingProjectPage(2);
                  resetProjectForm();
                  setCurrentView('edit-project');
                }}
                disabled={projectStatus.page2.atLimit}
                title={projectStatus.page2.atLimit ? 'Page 2 is full (12 projects max)' : 'Add to Page 2'}
              >
                <Plus size={18} />
                Add Page 2 Project
              </button>
            </div>

            <div className="project-list">
              {page2Projects.map((project, index) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, 2)}
                  onDragOver={(e) => handleDragOver(e, index, 2)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index, 2)}
                  onDragEnd={handleDragEnd}
                  className={`project-item ${
                    draggedItem === index && draggedPage === 2 ? 'dragging' : ''
                  } ${
                    dragOverIndex === index && dragOverPage === 2 && !(draggedItem === index && draggedPage === 2) ? 'drag-over' : ''
                  }`}
                >
                  <div className="project-drag">
                    <div className="drag-left">
                      <Menu size={20} />
                      <span className="project-number">{index + 1}</span>
                    </div>
                    <div className="arrow-controls">
                      <button 
                        className={`btn-icon btn-arrow ${index === 0 ? 'disabled' : ''}`}
                        onClick={() => moveProject2Up(index)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button 
                        className={`btn-icon btn-arrow ${index === page2Projects.length - 1 ? 'disabled' : ''}`}
                        onClick={() => moveProject2Down(index)}
                        disabled={index === page2Projects.length - 1}
                        title="Move down"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <div 
                    className="project-info clickable"
                    onClick={() => editProject(project, 2)}
                    title="Click to edit project"
                  >
                    <h3>{project.title}</h3>
                    <div className="project-meta">
                      <span 
                        className="category-tag"
                        style={{ backgroundColor: getCategoryColor(project.category) }}
                      >
                        {project.category}
                      </span>
                      {project.hasVideo && <span className="video-indicator">📹 Video</span>}
                    </div>
                  </div>

                  <div className="project-actions">
                    <button 
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        editProject(project, 2);
                      }}
                      title="Edit project"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn-icon btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id, 2);
                      }}
                      title="Delete project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              
              {page2Projects.length === 0 && (
                <div className="empty-state">
                  <div className="empty-content">
                    <h3>No Page 2 projects yet</h3>
                    <p>Page 2 can hold up to 12 additional projects for your extended portfolio.</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingProject(null);
                        setEditingProjectPage(2);
                        resetProjectForm();
                        setCurrentView('edit-project');
                      }}
                    >
                      <Plus size={18} />
                      Create First Page 2 Project
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Testimonials Section */}
        <div className="section">
          <div className="section-header">
            <h2>Testimonials ({testimonials.length})</h2>
            <button 
              className="btn btn-primary"
              onClick={() => openTestimonialModal()}
            >
              <Plus size={18} />
              Add Testimonial
            </button>
          </div>

          <div className="testimonial-list">
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.id} 
                className="testimonial-item"
                draggable
                onDragStart={(e) => handleTestimonialDragStart(e, index)}
                onDragOver={handleTestimonialDragOver}
                onDrop={(e) => handleTestimonialDrop(e, index)}
              >
                <div className="testimonial-drag-handle">
                  <GripVertical size={16} />
                </div>
                <div className="testimonial-number">{index + 1}</div>
                <div className="testimonial-content">
                  <p>"{testimonial.text}"</p>
                  <small>{testimonial.author}</small>
                </div>
                <div className="testimonial-actions">
                  <button 
                    className="btn-icon"
                    onClick={() => openTestimonialModal(testimonial)}
                    title="Edit testimonial"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn-icon btn-danger"
                    onClick={() => deleteTestimonial(testimonial.id)}
                    title="Delete testimonial"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <div className="section">
          <div className="section-header">
            <h2>Settings</h2>
            <button 
              className="btn btn-secondary"
              onClick={openSettingsModal}
            >
              <Settings size={18} />
              Configure Deployment
            </button>
          </div>
          <p>Portfolio settings, categories, and global configuration.</p>
        </div>
      </div>
    </div>
  );
};

// Main App component with authentication wrapper
const App = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

// Component that shows login or CMS based on auth state
const AuthenticatedApp = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Barlow, sans-serif',
        color: '#1652FB' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return isAuthenticated() ? <CMSApp /> : <LoginForm />;
};

export default App;