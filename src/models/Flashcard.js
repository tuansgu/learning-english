import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  term: { type: String, required: true },
  definition: { type: String, required: true },
  example: { type: String },
  pronunciation: { type: String },
  partOfSpeech: { type: String },
  flashcardSetId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardSet', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Flashcard || mongoose.model('Flashcard', flashcardSchema);