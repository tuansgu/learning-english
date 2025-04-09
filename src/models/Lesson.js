import { Schema, model, models } from 'mongoose';

const LessonSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    isPublic: { type: Boolean, default: false },
    level: {type: String, required: true},
  },
  { timestamps: true }
);

const Lesson = models.Lesson || model('Lesson', LessonSchema);

export default Lesson;
