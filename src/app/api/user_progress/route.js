import connectToDatabase from "@/lib/mongodb";
import UserProgress from "@/models/User_progress";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User"; // Giả sử đường dẫn đến model User


export async function GET(req) {
    try {
      await connectToDatabase();
  
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get("userId");
      const lessonId = searchParams.get("lessonId");
  
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { success: false, message: "userId không hợp lệ" },
          { status: 400 }
        );
      }
  
      let progress;
  
      if (lessonId) {
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
          return NextResponse.json(
            { success: false, message: "lessonId không hợp lệ" },
            { status: 400 }
          );
        }
  
        // Lấy tất cả document theo userId và lessonId
        const progresses = await UserProgress.find({ userId, lessonId });
  
        if (!progresses || progresses.length === 0) {
          return NextResponse.json(
            { success: false, message: "Lần đầu học" },
            { status: 200 }
          );
        }
  
        // Trích xuất chỉ vocabularyId từ learnedWords
        progress = progresses.flatMap(doc => doc.learnedWords.map(word => word.vocabularyId));
  
        console.log("Vocabulary IDs:", JSON.stringify(progress, null, 2));
      } else {
        // Tìm toàn bộ tiến trình học của user (giữ nguyên)
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

export async function POST(req) {
    try {
        // Kết nối đến cơ sở dữ liệu
        await connectToDatabase();

        // Đọc dữ liệu từ request body
        const { userId, lessonId, vocabularies } = await req.json();

        if (!userId || !lessonId || !Array.isArray(vocabularies)) {
            return NextResponse.json(
                { success: false, message: "Dữ liệu không hợp lệ" },
                { status: 400 }
            );
        }

        const learnedWords = vocabularies.map((vocab) => ({
            vocabularyId: vocab._id, // Lấy ID của từ vựng
            state: vocab.state || "new", // Thêm state nếu có trong request
        }));

        // Tạo document mới mỗi lần POST, không kiểm tra tồn tại
        const progress = new UserProgress({
            userId,
            lessonId,
            learnedWords,
            status: "in-progress", // Giá trị mặc định, có thể thay đổi theo logic của bạn
        });

        await progress.save();

        await updateUserStats(userId);

        return NextResponse.json(
            {
                success: true,
                message: "Tiến trình học mới đã được tạo",
                progress,
            },
            { status: 201 } // 201 thay vì 200 để biểu thị tạo mới
        );
    } catch (error) {
        console.error("Lỗi khi tạo tiến trình học:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server" },
            { status: 500 }
        );
    }
}

async function updateUserStats(userId) {
    try {
      // Lấy tất cả tiến trình học của user
      const progresses = await UserProgress.find({ userId });
  
      // Tính total_words
      const allLearnedWords = progresses.flatMap(p => p.learnedWords);
      const totalWords = new Set(allLearnedWords.map(w => w.vocabularyId.toString())).size;
  
      // Tính days_learned (chỉ lấy ngày từ createdAt)
      const dates = progresses.map(p => p.createdAt.toISOString().split('T')[0]);
      const daysLearned = new Set(dates).size;
  
      // Tính streak
      const uniqueDates = [...new Set(dates)].sort();
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
  
      if (uniqueDates.length > 0) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prev = new Date(uniqueDates[i - 1]);
          const curr = new Date(uniqueDates[i]);
          const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) streak++;
          else if (diffDays > 1) {
            streak = 1; // Reset nếu đứt chuỗi
          }
        }
        const lastDate = uniqueDates[uniqueDates.length - 1];
        const diffFromToday = (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
        if (diffFromToday > 1) streak = 0; // Không học hôm nay, streak về 0
        else if (diffFromToday === 1 && dates.includes(today)) streak++;
      }
  
      // Cập nhật User
      await User.findOneAndUpdate(
        { _id: userId },
        { $set: { total_words: totalWords, streak: streak, days_learned: daysLearned } }
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật thống kê User:", error);
      throw error;
    }
  }

  export async function PUT(req) {
    try {
      await connectToDatabase();
      const { userId, lessonId } = await req.json();
  
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
  
      // Cập nhật tất cả document UserProgress phù hợp với userId và lessonId
      const updateResult = await UserProgress.updateMany(
        { userId, lessonId },
        {
          $set: {
            status: "completed",
            updatedAt: new Date(),
          },
        }
      );
  
      // Kiểm tra xem có document nào được cập nhật hay không
      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: "Không tìm thấy tiến trình học để cập nhật" },
          { status: 404 }
        );
      }
  
      // Lấy lại các document đã cập nhật để trả về trong response
      const updatedProgress = await UserProgress.find({ userId, lessonId });
  
      // Cập nhật thống kê người dùng
      await updateUserStats(userId);
  
      return NextResponse.json(
        {
          success: true,
          message: `Đã cập nhật trạng thái thành completed cho ${updateResult.modifiedCount} tiến trình học`,
          progress: updatedProgress,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái tiến trình học:", error);
      return NextResponse.json(
        { success: false, message: "Lỗi server", details: error.message },
        { status: 500 }
      );
    }
  }