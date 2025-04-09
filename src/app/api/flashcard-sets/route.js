import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from "@/lib/mongodb";
import FlashcardSet from '@/models/FlashcardSet';

// Tạo FlashcardSet mới
export async function POST(req) {
  try {
    await connectToDatabase();
    const { title, description, userId } = await req.json();

    if (!title || !userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Thiếu hoặc không hợp lệ: title, userId" },
        { status: 400 }
      );
    }

    const newFlashcardSet = new FlashcardSet({
      title,
      description,
      userId,
    });

    await newFlashcardSet.save();

    return NextResponse.json(
      { success: true, message: "Tạo FlashcardSet thành công", flashcardSet: newFlashcardSet },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi khi tạo FlashcardSet:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", details: error.message },
      { status: 500 }
    );
  }
}

// Lấy danh sách FlashcardSet của người dùng
export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    console.log(userId)

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "userId không hợp lệ" },
        { status: 400 }
      );
    }

    const flashcardSets = await FlashcardSet.find({ userId });
    return NextResponse.json({ success: true, flashcardSets }, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy FlashcardSet:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", details: error.message },
      { status: 500 }
    );
  }
}