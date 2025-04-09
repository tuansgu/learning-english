import connectToDatabase from "@/lib/mongodb";
import Lesson from "@/models/Lesson";
import { NextResponse } from "next/server";

// Lấy danh sách Lesson
export async function GET() {
  try {
    await connectToDatabase();
    const lessons = await Lesson.find();
    return NextResponse.json(lessons, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching lessons" }, { status: 500 });
  }
}

// Thêm mới Lesson
export async function POST(req) {
  try {
    await connectToDatabase();
    const { title, description, isPublic } = await req.json();

    const lesson = new Lesson({ title, description, isPublic });
    await lesson.save();

    return NextResponse.json({ message: "Lesson created successfully", id: lesson._id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error creating lesson" }, { status: 500 });
  }
}
