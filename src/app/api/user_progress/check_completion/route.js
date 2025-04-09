import connectToDatabase from "@/lib/mongodb";
import UserProgress from "@/models/User_progress";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// POST: Kiểm tra xem bài học đã hoàn thành chưa
export async function POST(req) {
  try {
    await connectToDatabase();
    const { userId, lessonId, vocalInLesson } = await req.json();

    // Kiểm tra userId và lessonId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "userId không hợp lệ" },
        { status: 400 }
      );
    }
    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return NextResponse.json(
        { success: false, message: "lessonId không hợp lệ" },
        { status: 400 }
      );
    }
    if (!vocalInLesson || typeof vocalInLesson !== "number" || vocalInLesson <= 0) {
      return NextResponse.json(
        { success: false, message: "vocalInLesson không hợp lệ" },
        { status: 400 }
      );
    }

    // Lấy tất cả document UserProgress cho userId và lessonId
    const progresses = await UserProgress.find({ userId, lessonId });

    // Nếu không có document nào, bài học chưa bắt đầu
    if (progresses.length === 0) {
      return NextResponse.json(
        { success: true, status: "notStarted", totalLearnedWords: 0 },
        { status: 200 }
      );
    }

    // Tính tổng số từ đã học (tránh trùng lặp)
    const learnedVocabIds = new Set();
    progresses.forEach(progress => {
      progress.learnedWords.forEach(word => {
        learnedVocabIds.add(word.vocabularyId.toString());
      });
    });

    const totalLearnedWords = learnedVocabIds.size;
    const status = totalLearnedWords >= vocalInLesson ? "completed" : "in-progress";

    return NextResponse.json(
      {
        success: true,
        status,
        totalLearnedWords,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái hoàn thành:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", details: error.message },
      { status: 500 }
    );
  }
}