import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, Menu, Settings, Eye, Upload, ChevronUp, ChevronDown, X, FileImage, FileVideo, File, GripVertical } from 'lucide-react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import MediaUploader from './components/MediaUploader';
import BandwidthMonitor from './components/BandwidthMonitor';
import CloudinaryService from './services/cloudinaryConfig';

// Main CMS Component (authenticated)
const CMSApp = () => {
  console.log('🔍 DEBUG: CMS App is loading - if you see this, debugging is working!');
  const { user, logout } = useAuth();
  
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'edit-project', 'edit-testimonials', 'settings'
  const [editingProjectPage, setEditingProjectPage] = useState(1); // Track which page the project being edited is on
  // eslint-disable-next-line no-unused-vars
  const [editingProject, setEditingProject] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedPage, setDraggedPage] = useState(null); // Track which page the dragged item is from
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragOverPage, setDragOverPage] = useState(null); // Track which page we're dragging over

  // Real portfolio data from oursayso-sales-ipad repository
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem('portfolio-cms-projects');
    console.log('🔍 Loading projects from localStorage:', savedProjects ? 'Found saved data' : 'No saved data');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        console.log('✅ Loaded', parsed.length, 'projects from localStorage');
        console.log('✅ First project title:', parsed[0]?.title);
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved projects, using defaults');
      }
    }
    console.log('📝 Using hardcoded default projects');
    return [
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
  ];
  });

  // Page 2 projects - additional portfolio projects
  const [page2Projects, setPage2Projects] = useState(() => {
    const savedPage2Projects = localStorage.getItem('portfolio-cms-page2-projects');
    if (savedPage2Projects) {
      try {
        return JSON.parse(savedPage2Projects);
      } catch (e) {
        console.warn('Failed to parse saved page 2 projects, using defaults');
      }
    }
    return [];
  });

  // Real client testimonials from portfolio
  // eslint-disable-next-line no-unused-vars
  const [testimonials, setTestimonials] = useState(() => {
    const savedTestimonials = localStorage.getItem('portfolio-cms-testimonials');
    if (savedTestimonials) {
      try {
        return JSON.parse(savedTestimonials);
      } catch (e) {
        console.warn('Failed to parse saved testimonials, using defaults');
      }
    }
    return [
    {
      id: '1',
      text: 'Their work is memorable, relevant, entertaining, thought provoking, and above all highly effective.',
      author: 'Faye Frater, InterContinental Hotels Group',
      project: 'Hotel Training Materials',
      date: '2024-01-15'
    },
    {
      id: '2',
      text: 'Oursayso are great to work with both from the quality of their work and the enthusiasm and commitment that they put into it.',
      author: 'Alan Long, Executive Director, Mears Group',
      project: 'Corporate Communications',
      date: '2024-02-20'
    },
    {
      id: '3',
      text: 'Oursayso work hard with the leadership of the business to deliver appropriate, simple and direct messages that will see an immediate response.',
      author: 'Paul Mildenstein, CEO, Atkore',
      project: 'Leadership Training Program',
      date: '2024-03-10'
    },
    {
      id: '4',
      text: 'The conference transformation exceeded all expectations. Our executives are already asking about next year.',
      author: 'Sarah Mitchell, Chief Learning Officer, Lovell Corporation',
      project: 'Lovell Leadership Conferences',
      date: '2024-01-30'
    }
  ];
  });

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
  
  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('portfolio-cms-projects', JSON.stringify(projects));
    console.log('💾 Projects saved to localStorage:', projects.length, 'projects');
    console.log('💾 First project title:', projects[0]?.title);
  }, [projects]);
  
  useEffect(() => {
    localStorage.setItem('portfolio-cms-page2-projects', JSON.stringify(page2Projects));
    console.log('💾 Page 2 projects saved to localStorage');
  }, [page2Projects]);

  useEffect(() => {
    localStorage.setItem('portfolio-cms-testimonials', JSON.stringify(testimonials));
    console.log('💾 Testimonials saved to localStorage');
  }, [testimonials]);

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
      tileBackgroundFile: project.backgrounds?.tile?.file || project.tileBackgroundFile || null,
      pageBackgroundFile: project.backgrounds?.page || project.pageBackgroundFile || null,
      mediaItems: project.mediaItems || []
    };
    
    console.log('🔍 DEBUG: Form data prepared for editing:', formData);
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

    // Validate file size limits (increased for Cloudinary)
    const sizeLimit = type.includes('Video') ? 100 * 1024 * 1024 : 50 * 1024 * 1024; // 100MB for videos, 50MB for images
    if (file.size > sizeLimit) {
      const limitMB = Math.round(sizeLimit / (1024 * 1024));
      setErrors(prev => ({
        ...prev,
        [type]: `File size must be less than ${limitMB}MB`
      }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });

    // Create blob URL safely and store it for cleanup
    let blobUrl = null;
    try {
      blobUrl = URL.createObjectURL(file);
    } catch (blobError) {
      console.warn('Failed to create blob URL, using placeholder:', blobError);
      blobUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkxvYWRpbmc8L3RleHQ+PC9zdmc+';
    }

    // Show loading state with safe blob URL
    const loadingFile = {
      file,
      preview: blobUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploading: true,
      needsCleanup: blobUrl && blobUrl.startsWith('blob:') // Flag for cleanup
    };
    console.log('🔄 DEBUG: Setting loading file state:', loadingFile);
    updateFileInForm(type, loadingFile);

    try {
      console.log(`🔄 Uploading ${type} to Cloudinary:`, file.name);
      console.log('🔄 DEBUG: Cloudinary config:', {
        cloudName: CloudinaryService.cloudName,
        uploadPreset: CloudinaryService.uploadPreset,
        hasApiKey: !!CloudinaryService.apiKey
      });
      
      // Check if Cloudinary is configured
      if (!CloudinaryService.cloudName || !CloudinaryService.uploadPreset) {
        throw new Error('Cloudinary not configured properly. Please check your environment variables.');
      }
      
      // Wrap upload in error boundary to prevent crashes
      let result;
      try {
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

        const uploadPromise = CloudinaryService.uploadMedia(file, uploadOptions);
        
        // Add 30 second timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
        );
        
        result = await Promise.race([uploadPromise, timeoutPromise]);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message || 'Unknown error'}`);
      }

      // Clean up blob URL before creating final object
      if (blobUrl && blobUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (cleanupError) {
          console.warn('Failed to cleanup blob URL:', cleanupError);
        }
      }

      // Create final file object with Cloudinary data
      const fileWithCloudinary = {
        file,
        preview: result.url, // Use Cloudinary URL instead of local blob
        name: file.name,
        size: result.bytes || file.size,
        type: file.type,
        url: result.url,
        cloudinaryId: result.publicId,
        uploadedAt: new Date().toISOString(),
        dimensions: result.width ? { width: result.width, height: result.height } : undefined,
        uploading: false,
        cloudinary: true, // Flag to indicate this is a Cloudinary file
        needsCleanup: false // No cleanup needed for Cloudinary URLs
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

      console.log('🔄 DEBUG: Setting completed file state:', fileWithCloudinary);
      updateFileInForm(type, fileWithCloudinary);
      console.log(`✅ Successfully uploaded ${type}:`, result.url);
      
      // Show success message
      const fileTypeDisplay = type.includes('tile') ? 'tile background' : 'page background';
      setSuccessMessage(`✅ ${fileTypeDisplay} uploaded successfully to Cloudinary!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${type}:`, error);
      
      // Clean up blob URL on error
      if (blobUrl && blobUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (cleanupError) {
          console.warn('Failed to cleanup blob URL on error:', cleanupError);
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
      // Clean up previous blob URL if exists
      const currentFile = projectForm.tileBackgroundFile;
      if (currentFile && currentFile.needsCleanup && currentFile.preview && currentFile.preview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(currentFile.preview);
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
            // In a real app, this would be the uploaded file URL
            url: projectForm.pageBackgroundFile.preview
          } : null
        },
        
        // Media items structured for publishing
        mediaItems: projectForm.mediaItems.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          files: item.files || [],
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
      
      // Background files
      tileBackground: {
        type: project.backgrounds?.tile?.type || project.tileBackgroundType || 'image',
        url: project.backgrounds?.tile?.file 
          ? (project.backgrounds.tile.file.cloudinary && project.backgrounds.tile.file.url) 
            ? project.backgrounds.tile.file.url  // Use Cloudinary URL if available
            : generateProjectFilePath(project.id, project.backgrounds.tile.file.name, 'tileBackground') // Fallback to local
          : project.tileBackgroundFile?.cloudinary && project.tileBackgroundFile?.url
            ? project.tileBackgroundFile.url  // Direct Cloudinary URL from form
            : project.tileBackgroundFile 
              ? generateProjectFilePath(project.id, project.tileBackgroundFile.name, 'tileBackground') // Fallback
              : null
      },
      
      pageBackground: {
        url: project.backgrounds?.page 
          ? generateProjectFilePath(project.id, project.backgrounds.page.name, 'pageBackground')
          : null,
        dimensions: project.backgrounds?.page?.dimensions || null
      },
      
      // Media items
      mediaItems: (project.mediaItems || []).map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        files: (item.files || []).map(file => ({
          url: generateProjectFilePath(project.id, file.name, 'media'),
          name: file.name,
          type: file.type
        })),
        order: item.order || 0
      })),
      
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
        content: btoa(encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1))), // Base64 encode UTF-8 content
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
                {projectForm.tileBackgroundFile && (
                  <div className="current-file-preview">
                    <h4>Current File:</h4>
                    <div className="current-file">
                      {projectForm.tileBackgroundFile.uploading ? (
                        <div className="upload-progress">
                          <div className="upload-spinner"></div>
                          <div className="upload-info">
                            <span className="file-name">Uploading {projectForm.tileBackgroundFile.name}...</span>
                            <span className="upload-status">Please wait while we upload to Cloudinary</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {projectForm.tileBackgroundType === 'image' ? (
                            <img 
                              src={projectForm.tileBackgroundFile.preview || projectForm.tileBackgroundFile.url} 
                              alt="Current tile background"
                              className="current-thumbnail"
                            />
                          ) : (
                            <video 
                              src={projectForm.tileBackgroundFile.preview || projectForm.tileBackgroundFile.url}
                              className="current-thumbnail"
                              muted
                            />
                          )}
                          <div className="current-file-info">
                            <span className="file-name">
                              {projectForm.tileBackgroundFile.name}
                              {projectForm.tileBackgroundFile.cloudinary && (
                                <span className="cloudinary-badge">☁️ Cloudinary</span>
                              )}
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
                  {!projectForm.tileBackgroundFile && projectForm.tileBackgroundType === 'image' ? (
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
                  ) : !projectForm.tileBackgroundFile && projectForm.tileBackgroundType === 'video' ? (
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
                {projectForm.pageBackgroundFile && (
                  <div className="current-file-preview">
                    <h4>Current Background:</h4>
                    <div className="current-file">
                      {projectForm.pageBackgroundFile.uploading ? (
                        <div className="upload-progress">
                          <div className="upload-spinner"></div>
                          <div className="upload-info">
                            <span className="file-name">Uploading {projectForm.pageBackgroundFile.name}...</span>
                            <span className="upload-status">Please wait while we upload to Cloudinary</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <img 
                            src={projectForm.pageBackgroundFile.preview || projectForm.pageBackgroundFile.url} 
                            alt="Current page background"
                            className="current-thumbnail"
                          />
                          <div className="current-file-info">
                            <span className="file-name">
                              {projectForm.pageBackgroundFile.name}
                              {projectForm.pageBackgroundFile.cloudinary && (
                                <span className="cloudinary-badge">☁️ Cloudinary</span>
                              )}
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
                
                {!projectForm.pageBackgroundFile && (
                  <div
                    className={`upload-zone ${dragOverFile === 'pageBackground' ? 'drag-over' : ''} ${errors.pageBackground ? 'error' : ''}`}
                    onDragEnter={(e) => handleFileDragEnter(e, 'pageBackground')}
                    onDragOver={handleFileDragOver}
                    onDragLeave={handleFileDragLeave}
                    onDrop={(e) => handleFileDrop(e, 'pageBackground')}
                    onClick={() => {
                      console.log('🔄 DEBUG: Page background upload zone clicked');
                      pageBackgroundRef.current?.click();
                    }}
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
                      console.log('🔄 DEBUG: Page background file input onChange triggered:', e.target.files);
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

            {/* Cloudinary Media Upload */}
            <div className="cloudinary-upload-section">
              <h3>Upload Media to Cloudinary</h3>
              <MediaUploader 
                onUploadComplete={(result, item) => {
                  // Add uploaded media to project
                  const newMediaItem = {
                    id: Date.now().toString(),
                    type: item.file.type.startsWith('video/') ? 'video' : 'image',
                    title: item.name.replace(/\.[^/.]+$/, ''), // Remove file extension
                    files: [{
                      id: Date.now().toString(),
                      name: item.name,
                      type: item.file.type,
                      url: result.url,
                      cloudinaryId: result.publicId,
                      size: result.bytes,
                      uploadedAt: new Date().toISOString()
                    }]
                  };
                  
                  setProjectForm(prev => ({
                    ...prev,
                    mediaItems: [...prev.mediaItems, newMediaItem]
                  }));
                  
                  console.log('✅ Media uploaded and added to project:', newMediaItem);
                }}
                maxFiles={5}
                acceptedTypes="image/*,video/*"
              />
            </div>
            
            <div className="media-items">
              {projectForm.mediaItems.map((item, index) => (
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
                    <div className="upload-zone small">
                      <File size={32} />
                      <p>Upload files for this {item.type}</p>
                      {item.type === 'gallery' && <small>Recommended: 1920x1080px or larger</small>}
                      {item.type === 'video' && <small>Recommended: MP4, under 50MB</small>}
                      {item.type === 'pdf' && <small>PDF documents up to 10MB</small>}
                      <small>Click to add files</small>
                    </div>
                  </div>
                </div>
              ))}
              
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
                            src={projectForm.tileBackgroundFile.preview}
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
                            <div className="media-list">
                              {projectForm.mediaItems.map((item) => (
                                <div key={item.id} className="media-item-preview">
                                  <span className="media-type">{item.type}</span>
                                  <span className="media-title">{item.title || 'Untitled Media'}</span>
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