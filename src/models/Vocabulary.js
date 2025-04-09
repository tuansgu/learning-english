import { Schema, model, models } from 'mongoose';

const VocabularySchema = new Schema(
  {
    term: { type: String, required: true },
    definition: { type: String, required: true },
    example: { type: String },
    pronunciation: { type: String },
    partOfSpeech: { type: String },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  },
  { timestamps: true }
);

const Vocabulary = models.Vocabulary || model('Vocabulary', VocabularySchema);
export default Vocabulary;
