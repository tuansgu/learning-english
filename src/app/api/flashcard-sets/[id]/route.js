import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Flashcard from '@/models/Flashcard';

// Lấy thông tin FlashcardSet và các flashcard của nó
export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    console.log("FlashcardSet ID: ", id);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "flashcardSetId không hợp lệ" },
        { status: 400 }
      );
    }

    const flashcardSet = await FlashcardSet.findById(id);

    const flashcards = await Flashcard.find({ flashcardSetId: id });

    return NextResponse.json(
      { success: true, flashcardSet: { ...flashcardSet._doc, flashcards } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi lấy FlashcardSet:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", details: error.message },
      { status: 500 }
    );
  }
}