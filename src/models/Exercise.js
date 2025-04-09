import { Schema, model, models } from 'mongoose';

const ExerciseSchema = new Schema(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    title: { type: String, required: true },
    description: { type: String },
    questions: [
      {
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        explanation: { type: String },
      },
    ],
  },
  { timestamps: true } // Tự động thêm createdAt, updatedAt
);

const Exercise = models.Exercise || model('Exercise', ExerciseSchema);

export default Exercise;
