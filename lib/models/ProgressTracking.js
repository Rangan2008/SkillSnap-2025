import mongoose from 'mongoose';

const progressTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeAnalysis',
    required: true,
    index: true
  },
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resourceIndex: {
    type: Number,
    required: true
  },
  // Denormalized data for quick access
  skill: {
    type: String,
    required: true,
    trim: true
  },
  stepTitle: {
    type: String,
    required: true,
    trim: true
  },
  stepNumber: {
    type: Number,
    required: true
  },
  resourceTitle: {
    type: String,
    required: true,
    trim: true
  },
  resourceUrl: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    enum: ['course', 'documentation', 'project', 'tutorial', 'book', 'youtube', 'video', 'article'],
    required: true
  },
  resourceProvider: {
    type: String,
    default: null
  },
  clickedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
progressTrackingSchema.index({ userId: 1, clickedAt: -1 });
progressTrackingSchema.index({ analysisId: 1, clickedAt: -1 });

// Static method to get latest progress for a user
progressTrackingSchema.statics.getLatestForUser = async function(userId) {
  return await this.findOne({ userId })
    .sort({ clickedAt: -1 })
    .limit(1)
    .lean();
};

// Static method to get progress history for a user
progressTrackingSchema.statics.getHistoryForUser = async function(userId, limit = 10) {
  return await this.find({ userId })
    .sort({ clickedAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get progress for a specific analysis
progressTrackingSchema.statics.getProgressForAnalysis = async function(analysisId) {
  return await this.find({ analysisId })
    .sort({ clickedAt: -1 })
    .lean();
};

export default mongoose.models.ProgressTracking || mongoose.model('ProgressTracking', progressTrackingSchema);
