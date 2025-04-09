import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Vocabulary from "@/models/Vocabulary";
import mongoose from "mongoose";

// Xử lý POST request: Lấy thông tin chi tiết của nhiều từ vựng dựa trên danh sách vocabIds
export async function POST(request) {
    try {
      await connectToDatabase();
      const { ids } = await request.json();
  
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { message: "Thiếu hoặc sai định dạng ids. Vui lòng cung cấp một mảng các vocabId." },
          { status: 400 }
        );
      }
  
      const vocabularies = await Vocabulary.find({ _id: { $in: ids } });
      if (!vocabularies || vocabularies.length === 0) {
        return NextResponse.json(
          { message: "Không tìm thấy từ vựng nào với các ID đã cung cấp." },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ vocabularies }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { message: error.message || "Lỗi khi lấy thông tin từ vựng" },
        { status: 500 }
      );
    }
  }