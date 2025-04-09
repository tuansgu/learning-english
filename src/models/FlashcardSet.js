import mongoose from 'mongoose';

const flashcardSetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  flashcards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard', required: false }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.FlashcardSet || mongoose.model('FlashcardSet', flashcardSetSchema);