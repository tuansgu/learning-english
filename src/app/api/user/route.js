// /src/app/api/user/route.js
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAndAwardAchievements } from '@/lib/achievements';

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    console.log("userId:", userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId không hợp lệ' }, { status: 400 });
    }

    const user = await User.findById(userId).populate('earnedAchievements.achievementId');
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
    }

    // Kiểm tra và gán thành tựu mới
    await checkAndAwardAchievements(userId);

    // Lấy lại dữ liệu user sau khi cập nhật
    const updatedUser = await User.findById(userId).populate('earnedAchievements.achievementId');

    return NextResponse.json({
      username: updatedUser.username,
      email: updatedUser.email,
      fullname: updatedUser.fullname,
      total_words: updatedUser.total_words,
      streak: updatedUser.streak,
      days_learned: updatedUser.days_learned,
      earnedAchievements: updatedUser.earnedAchievements || []
    }, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi lấy user:', error);
    return NextResponse.json({ error: 'Lỗi server', details: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId không hợp lệ' }, { status: 400 });
    }

    // Lấy dữ liệu từ body request
    const body = await req.json();
    const { email, fullname } = body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !fullname) {
      return NextResponse.json({ error: 'Email và fullname là bắt buộc' }, { status: 400 });
    }

    // Tìm và cập nhật user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
    }

    // Cập nhật thông tin
    user.fullname = fullname;
    await user.save();

    // Kiểm tra và gán thành tựu mới (nếu cần)
    await checkAndAwardAchievements(userId);

    // Lấy lại dữ liệu user sau khi cập nhật
    const updatedUser = await User.findById(userId).populate('earnedAchievements.achievementId');

    return NextResponse.json({
      username: updatedUser.username,
      email: updatedUser.email,
      fullname: updatedUser.fullname,
      total_words: updatedUser.total_words,
      streak: updatedUser.streak,
      days_learned: updatedUser.days_learned,
      earnedAchievements: updatedUser.earnedAchievements || []
    }, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi cập nhật user:', error);
    return NextResponse.json({ error: 'Lỗi server', details: error.message }, { status: 500 });
  }
}