import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Thư viện để mã hóa và kiểm tra mật khẩu

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
    const { oldPassword, newPassword } = body;

    // Kiểm tra dữ liệu đầu vào
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Mật khẩu cũ và mật khẩu mới là bắt buộc' }, { status: 400 });
    }

    // Tìm user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Mật khẩu cũ không đúng' }, { status: 400 });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: 'Đổi mật khẩu thành công' }, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    return NextResponse.json({ error: 'Lỗi server', details: error.message }, { status: 500 });
  }
}