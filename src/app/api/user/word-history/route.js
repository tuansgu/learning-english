import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId không hợp lệ' }, { status: 400 });
    }

    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Sử dụng aggregation để tính số từ học theo ngày
    const wordHistoryAggregation = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$learnedVocabHistory' },
      {
        $match: {
          'learnedVocabHistory.learnedAt': {
            $gte: sevenDaysAgo,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$learnedVocabHistory.learnedAt' },
          },
          words: { $sum: 1 },
        },
      },
      {
        $project: {
          date: '$_id',
          words: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Lấy 7 ngày gần nhất
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    // Đảm bảo tất cả 7 ngày đều có dữ liệu (nếu không có thì words = 0)
    const wordHistory = dates.map((date) => {
      const entry = wordHistoryAggregation.find((e) => e.date === date) || { words: 0 };
      return { date, words: entry.words };
    });

    return NextResponse.json(wordHistory, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử học từ:', error);
    return NextResponse.json({ error: 'Lỗi server', details: error.message }, { status: 500 });
  }
}