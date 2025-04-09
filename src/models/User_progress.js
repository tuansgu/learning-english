import mongoose, { Schema, model, models } from 'mongoose';

const LearningProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, },
    learnedWords: [{
      _id: false,
      vocabularyId: {
        type: Schema.Types.ObjectId,
        ref: 'Vocabulary',
        required: true
      },
      state: {
        type: String,
        enum: ['new', 'easy', 'medium', 'hard', 'skipped'],
        default: 'new'
      }
    }],
    
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
  },
  { timestamps: true }
);

const LearningProgress =
  models.LearningProgress || model('LearningProgress', LearningProgressSchema);

export default LearningProgress;

