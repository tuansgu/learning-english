import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Vocabulary from "@/models/Vocabulary";
import mongoose from "mongoose";
import UserProgress from "@/models/User_progress";
import User from "@/models/User";

export async function GET(req) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const lessonId = searchParams.get("lessonId");

        // Kiểm tra userId bắt buộc
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { success: false, message: "userId không hợp lệ" },
                { status: 400 }
            );
        }

        let progress;

        if (lessonId) {
            // Kiểm tra lessonId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(lessonId)) {
                return NextResponse.json(
                    { success: false, message: "lessonId không hợp lệ" },
                    { status: 400 }
                );
            }

            // Sửa từ findOne thành find để lấy tất cả document
            progress = await UserProgress.find({ userId, lessonId })
                .populate("learnedWords.vocabularyId");

            if (!progress || progress.length === 0) {
                return NextResponse.json(
                    { success: false, message: "Không tìm thấy tiến trình cho lesson này" },
                    { status: 404 }
                );
            }

            console.log("Progress for lesson:", progress);
        } else {
            // Tìm toàn bộ tiến trình học của user
            progress = await UserProgress.aggregate([
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
                    $unwind: "$lesson",
                },
                {
                    $lookup: {
                        from: "vocabularies",
                        localField: "learnedWords.vocabularyId",
                        foreignField: "_id",
                        as: "learnedWordsDetails",
                    },
                },
                {
                    $project: {
                        userId: 1,
                        lessonId: 1,
                        learnedWords: 1,
                        status: 1,
                        "lesson.title": 1,
                        createdAt: 1,
                        updatedAt: 1,
                    },
                },
            ]);

            if (!progress || progress.length === 0) {
                return NextResponse.json(
                    { success: false, message: "Không tìm thấy tiến trình học nào" },
                    { status: 404 }
                );
            }

            console.log("All progress:", progress);
        }

        return NextResponse.json({ success: true, progress }, { status: 200 });
    } catch (error) {
        console.error("Lỗi khi lấy tiến trình học(API1):", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server", details: error.message },
            { status: 500 }
        );
    }
}

// POST: Thêm từ vựng mới
export async function POST(request, { params }) {
    try {
        await connectToDatabase();

        // Nếu params là Promise, await nó
        const resolvedParams = await params;
        const { id } = resolvedParams || {}; // Lấy id từ params
        const body = await request.json();
        const { term, definition, example, pronunciation, partOfSpeech, lessonId: lessonIdFromBody } = body;

        console.log("Resolved Params in POST:", resolvedParams);
        console.log("Body in POST:", body);

        // Ưu tiên id từ params, nếu không có thì lấy lessonId từ body
        const lessonId = id || lessonIdFromBody;

        if (!lessonId) {
            return NextResponse.json({ error: "Thiếu lessonId trong params hoặc body" }, { status: 400 });
        }

        if (!term || !definition) {
            return NextResponse.json({ error: "Thiếu dữ liệu bắt buộc (term hoặc definition)" }, { status: 400 });
        }

        const newVocab = new Vocabulary({ 
            term, 
            definition, 
            example, 
            pronunciation, 
            partOfSpeech, 
            lessonId: new mongoose.Types.ObjectId(lessonId),
        });
        console.log("New vocab:", newVocab);

        await newVocab.save();

        return NextResponse.json(newVocab, { status: 201 });
    } catch (error) {
        console.error("Lỗi server:", error);
        return NextResponse.json({ error: "Lỗi server", details: error.message }, { status: 500 });
    }
}

async function updateUserStats(userId, lessonId) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("Không tìm thấy user");

    // Lấy tất cả tiến trình học của user
    const progresses = await UserProgress.find({ userId });

    // Tính total_words: Đếm số vocabularyId duy nhất
    const allLearnedWords = progresses.flatMap(p => p.learnedWords.map(w => w.vocabularyId.toString()));
    const totalWords = new Set(allLearnedWords).size;

    // Tính days_learned: Đếm số ngày duy nhất từ createdAt
    const dates = progresses.map(p => p.createdAt.toISOString().split('T')[0]);
    const daysLearned = new Set(dates).size;

    // Tính streak
    const uniqueDates = [...new Set(dates)].sort();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    if (uniqueDates.length > 0) {
      streak = 1; // Bắt đầu với 1 ngày
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) streak++;
        else if (diffDays > 1) {
          streak = 1; // Reset nếu đứt chuỗi
        }
      }
      // Kiểm tra hôm nay
      const lastDate = uniqueDates[uniqueDates.length - 1];
      const diffFromToday = (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
      if (diffFromToday > 1) streak = 0; // Đứt chuỗi nếu không học hôm nay
      else if (diffFromToday === 0 || (diffFromToday === 1 && dates.includes(today))) streak++;
    }

    // Cập nhật user
    user.total_words = totalWords;
    user.days_learned = daysLearned;
    user.streak = streak;
    await user.save();

    console.log("Updated user stats:", { total_words: totalWords, streak, days_learned: daysLearned });
  } catch (error) {
    console.error("Lỗi khi cập nhật user stats:", error);
    throw error;
  }
}