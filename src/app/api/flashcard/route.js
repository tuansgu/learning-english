import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from "@/lib/mongodb";
import Flashcard from '@/models/Flashcard';
import FlashcardSet from '@/models/FlashcardSet';

// Tạo Flashcard mới
export async function POST(req) {
  try {
    await connectToDatabase();
    const { term, definition, example, pronunciation, partOfSpeech, flashcardSetId } = await req.json();

    if (!term || !definition || !flashcardSetId || !mongoose.Types.ObjectId.isValid(flashcardSetId)) {
      return NextResponse.json(
        { success: false, message: "Thiếu hoặc không hợp lệ: term, definition, flashcardSetId" },
        { status: 400 }
      );
    }

    const newFlashcard = new Flashcard({
      term,
      definition,
      example,
      pronunciation,
      partOfSpeech,
      flashcardSetId,
    });

    await newFlashcard.save();

    // Cập nhật FlashcardSet để thêm flashcard vào danh sách
    await FlashcardSet.findByIdAndUpdate(
      flashcardSetId,
      { $push: { flashcards: newFlashcard._id }, updatedAt: new Date() },
      { new: true }
    );

    return NextResponse.json(
      { success: true, message: "Tạo Flashcard thành công", flashcard: newFlashcard },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi khi tạo Flashcard:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", details: error.message },
      { status: 500 }
    );
  }
}