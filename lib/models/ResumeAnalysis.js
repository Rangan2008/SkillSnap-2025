import mongoose from 'mongoose';

const roadmapStepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  estimatedDuration: {
    type: String, // e.g., "2 weeks", "1 month"
    required: true
  },
  resources: [{
    type: {
      type: String,
      enum: ['course', 'documentation', 'project', 'tutorial', 'book', 'youtube', 'video', 'article'],
      required: true
    },
    title: String,
    url: String,
    provider: String
  }],
  skills: [{
    type: String
  }],
  // Progress tracking fields (mutable)
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  progressPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { _id: true });

const resumeAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Resume details
  resumeUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  // Job description details
  jobDescriptionUrl: {
    type: String,
    default: null
  },
  jobDescriptionPublicId: {
    type: String,
    default: null
  },
  // Job details
  jobRole: {
    type: String,
    required: true,
    trim: true
  },
  experienceLevel: {
    type: String,
    enum: ['intern', 'entry', 'mid', 'senior'],
    required: true
  },
  jobDescription: {
    type: String,
    default: null
  },
  // Analysis results (IMMUTABLE - generated once by LLM)
  analysis: {
    matchPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    similarityPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    atsScoreExplanation: {
      type: String,
      default: ''
    },
    skillsFound: [{
      type: String
    }],
    missingSkills: [{
      type: String
    }],
    suggestions: [{
      category: {
        type: String,
        enum: ['formatting', 'keywords', 'content', 'structure', 'general']
      },
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      title: String,
      description: String
    }],
    strengthAreas: [{
      type: String
    }],
    improvementAreas: [{
      type: String
    }]
  },
  // Roadmap (IMMUTABLE baseline - generated once by LLM)
  roadmap: {
    generatedAt: {
      type: Date,
      default: Date.now
    },
    totalEstimatedDuration: String, // e.g., "3-6 months"
    steps: [roadmapStepSchema]
  },
  // Overall progress summary (derived from roadmap.steps)
  overallProgress: {
    stepsCompleted: {
      type: Number,
      default: 0
    },
    stepsInProgress: {
      type: Number,
      default: 0
    },
    stepsNotStarted: {
      type: Number,
      default: 0
    },
    totalSteps: {
      type: Number,
      default: 0
    },
    percentComplete: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastProgressUpdate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ userId: 1, jobRole: 1 });

// Method to update overall progress based on steps
resumeAnalysisSchema.methods.calculateOverallProgress = function() {
  const steps = this.roadmap.steps || [];
  const totalSteps = steps.length;
  
  if (totalSteps === 0) {
    this.overallProgress = {
      stepsCompleted: 0,
      stepsInProgress: 0,
      stepsNotStarted: 0,
      totalSteps: 0,
      percentComplete: 0
    };
    return;
  }

  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  steps.forEach(step => {
    switch (step.status) {
      case 'completed':
        completed++;
        break;
      case 'in_progress':
        inProgress++;
        break;
      case 'not_started':
        notStarted++;
        break;
    }
  });

  const percentComplete = Math.round((completed / totalSteps) * 100);

  this.overallProgress = {
    stepsCompleted: completed,
    stepsInProgress: inProgress,
    stepsNotStarted: notStarted,
    totalSteps: totalSteps,
    percentComplete: percentComplete
  };
};

export default mongoose.models.ResumeAnalysis || mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
