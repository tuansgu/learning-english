// /src/app/api/achievements/route.js
import connectToDatabase from '@/lib/mongodb';
import Achievement from '@/models/Achievement';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAndAwardAchievements } from '@/lib/achievements';

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    console.log("UserID in achievement: ", userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId không hợp lệ' }, { status: 400 });
    }

    const user = await User.findById(userId).populate('earnedAchievements.achievementId');
    if (!user) {
      console.log(`Không tìm thấy user với _id: ${userId}`);
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
    }

    // Kiểm tra và gán thành tựu mới
    await checkAndAwardAchievements(userId);

    // Lấy lại dữ liệu user sau khi cập nhật
    const updatedUser = await User.findById(userId).populate('earnedAchievements.achievementId');
    const allAchievements = await Achievement.find({});

    // Tạo danh sách thành tựu với trạng thái và tiến trình
    const achievementsWithStatus = allAchievements.map(ach => {
      const earned = updatedUser.earnedAchievements.find(e => 
        e.achievementId && e.achievementId._id.toString() === ach._id.toString()
      );
      const { field, value } = ach.criteria;
      let progress = 0;

      switch (field) {
        case 'total_words':
          progress = Math.min(updatedUser.total_words || 0, value);
          break;
        case 'streak':
          progress = Math.min(updatedUser.streak || 0, value);
          break;
        case 'days_learned':
          progress = Math.min(updatedUser.days_learned || 0, value);
          break;
        case 'custom':
          progress = 0; // Placeholder
          break;
        default:
          progress = 0;
      }

      return {
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        criteria: ach.criteria,
        earned: !!earned,
        earnedAt: earned ? earned.earnedAt : null,
        progress,
        goal: value
      };
    });

    return NextResponse.json({
      user: {
        username: updatedUser.username,
        fullname: updatedUser.fullname,
        total_words: updatedUser.total_words || 0,
        streak: updatedUser.streak || 0,
        days_learned: updatedUser.days_learned || 0
      },
      achievements: achievementsWithStatus
    }, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thành tựu:', error);
    return NextResponse.json({ error: 'Lỗi server', details: error.message }, { status: 500 });
  }
}