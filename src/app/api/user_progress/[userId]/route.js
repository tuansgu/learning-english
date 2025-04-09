import connectToDatabase from "@/lib/mongodb";
import UserProgress from "@/models/User_progress";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// GET: Lấy tiến trình học theo userId từ URL
export async function GET(req, { params }) {
  try {
    await connectToDatabase();

    // Lấy userId từ dynamic route (params)
    const { userId } = await params;

    // Kiểm tra userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "userId không hợp lệ" },
        { status: 400 }
      );
    }

    // Lấy tiến trình học theo userId
    const progress = await UserProgress.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "lessons",
          localField: "lessonId",
          foreignField: "_id",
          as: "lesson",
        },
      },
      {
        $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$learnedWords", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "vocabularies",
          localField: "learnedWords.vocabularyId",
          foreignField: "_id",
          as: "learnedWords.vocab",
        },
      },
      {
        $unwind: { path: "$learnedWords.vocab", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          lessonId: { $first: "$lessonId" },
          lessonTitle: { $first: "$lesson.title" },
          learnedWords: {
            $push: {
              vocabularyId: "$learnedWords.vocabularyId",
              state: "$learnedWords.state",
              vocab: "$learnedWords.vocab",
            },
          },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
      {
        $project: {
          userId: 1,
          lessonId: 1,
          lessonTitle: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          learnedWords: {
            $map: {
              input: "$learnedWords",
              as: "word",
              in: {
                vocabularyId: "$$word.vocabularyId",
                state: "$$word.state",
                word: "$$word.vocab.word",
                meaning: "$$word.vocab.meaning",
                pronunciation: "$$word.vocab.pronunciation",
                example: "$$word.vocab.example",
              },
            },
          },
        },
      },
    ]);

    if (!progress || progress.length === 0) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy tiến trình học nào" },
        { status: 404 }
      );
    }

    // Lọc bỏ các learnedWords không hợp lệ (nếu không có vocabularyId)
    const filteredProgress = progress.map(item => ({
      ...item,
      learnedWords: item.learnedWords.filter(word => word.vocabularyId),
    }));

    return NextResponse.json({ success: true, progress: filteredProgress }, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy tiến trình học theo userId:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", details: error.message },
      { status: 500 }
    );
  }
}