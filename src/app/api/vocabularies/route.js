import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Vocabulary from "@/models/Vocabulary";
import mongoose from "mongoose";

// GET: Lấy danh sách từ vựng theo lessonId
export async function GET(request) {
    try {
        await connectToDatabase();

        // Lấy lessonId từ query parameter
        const { searchParams } = new URL(request.url);
        console.log(searchParams);
        const lessonId = searchParams.get("lessonId");

        if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
            return NextResponse.json({ error: "Thiếu hoặc lessonId không hợp lệ" }, { status: 400 });
        }

        const vocabularies = await Vocabulary.find({ lessonId: new mongoose.Types.ObjectId(lessonId) });

        return NextResponse.json(vocabularies, { status: 200 });
    } catch (error) {
        console.error("Lỗi server:", error);
        return NextResponse.json({ error: "Lỗi server", details: error.message }, { status: 500 });
    }
}

// POST: Thêm từ vựng mới (nếu cần0
export async function POST(req, { params }) {
  try {
    await connectToDatabase();

    // Log params và body để debug
    console.log("Resolved Params in POST:", params);
    const body = await req.json();
    console.log("Body in POST:", body);

    const { term, definition, example, pronunciation, partOfSpeech, lessonId } = body;

    // Kiểm tra các trường bắt buộc
    if (!term || !definition || !lessonId) {
      return NextResponse.json(
        { success: false, message: "Thiếu các trường bắt buộc: term, definition, lessonId" },
        { status: 400 }
      );
    }

    // Kiểm tra lessonId
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      console.error("lessonId không hợp lệ:", lessonId);
      return NextResponse.json(
        { success: false, message: "lessonId không hợp lệ" },
        { status: 400 }
      );
    }

    // Tạo document Vocabulary mới
    const newVocab = new Vocabulary({
      term,
      definition,
      example,
      pronunciation,
      partOfSpeech,
      lessonId: new new mongoose.Types.ObjectId(lessonId), // Sử dụng lessonId từ body
    });
    console.log("New vocab:", newVocab);

    await newVocab.save();

    return NextResponse.json(
      { success: true, message: "Thêm từ mới thành công", vocabulary: newVocab },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi server:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", details: error.message },
      { status: 500 }
    );
  }
}