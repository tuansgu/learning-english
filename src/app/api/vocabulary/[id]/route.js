import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Vocabulary from "@/models/Vocabulary";
import mongoose from "mongoose";

// Xử lý GET request: Lấy thông tin chi tiết của một từ vựng dựa trên vocabId
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id: vocabId } = params; // [id] là vocabId
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId'); // Tùy chọn: Nếu cần kiểm tra lessonId

    if (!vocabId) {
      return NextResponse.json({ message: "Thiếu vocabId" }, { status: 400 });
    }

    const query = { _id: vocabId };
    if (lessonId) {
      query.lessonId = lessonId; // Thêm điều kiện lessonId nếu có
    }

    const vocabulary = await Vocabulary.findOne(query);
    if (!vocabulary) {
      return NextResponse.json(
        { message: lessonId ? "Không tìm thấy từ vựng trong bài học này" : "Không tìm thấy từ vựng" },
        { status: 404 }
      );
    }

    return NextResponse.json({ vocabulary }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Lỗi khi lấy từ vựng" },
      { status: 500 }
    );
  }
}
