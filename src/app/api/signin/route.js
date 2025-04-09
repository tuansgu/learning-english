import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';


export async function POST(req) {
  try {
    await connectToDatabase();

    const { email, password } = await req.json();

    // Tìm người dùng theo email
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Tạo token JWT
    const token = jwt.sign(
      { userId: user._id, },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return NextResponse.json({ message: 'Sign in success', token }, { status: 200 });
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json({ message: 'Error during sign in', error: error.message }, { status: 500 });
  }
}
