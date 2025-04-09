import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// GET: Lấy danh sách từ đã học
export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Kiểm tra userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId không hợp lệ' }, { status: 400 });
    }

    // Tìm user
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
    }

    // Kiểm tra learnedVocabHistory
    const learnedVocabHistory = Array.isArray(user.learnedVocabHistory) ? user.learnedVocabHistory : [];

    // Sử dụng aggregation để lấy danh sách từ đã học
    const learnedVocabsAggregation = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: { path: '$learnedVocabHistory', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'vocabularies',
          localField: 'learnedVocabHistory.vocabId',
          foreignField: '_id',
          as: 'learnedVocabHistory.vocab',
        },
      },
      { $unwind: { path: '$learnedVocabHistory.vocab', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'lessons',
          localField: 'learnedVocabHistory.vocab.lessonId',
          foreignField: '_id',
          as: 'learnedVocabHistory.vocab.lesson',
        },
      },
      { $unwind: { path: '$learnedVocabHistory.vocab.lesson', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          vocabId: '$learnedVocabHistory.vocab',
          learnedAt: '$learnedVocabHistory.learnedAt',
        },
      },
      { $sort: { learnedAt: -1 } },
    ]);

    // Tính tổng số từ đã học
    const totalVocabs = learnedVocabHistory.length;

    // Định dạng kết quả
    const result = learnedVocabsAggregation.map((entry) => {
      // Kiểm tra nếu vocabId không tồn tại
      if (!entry.vocabId || !entry.vocabId._id) {
        return {
          _id: null, // Trả về _id là null nếu vocab không tồn tại
          term: 'Từ không tồn tại',
          meaning: 'N/A',
          example: 'N/A',
          lessonTitle: 'N/A',
          learnedAt: entry.learnedAt,
        };
      }
      return {
        _id: entry.vocabId._id.toString(), // Thêm _id của từ vựng
        term: entry.vocabId.term || 'Chưa có từ',
        meaning: entry.vocabId.meaning || 'Chưa có nghĩa',
        example: entry.vocabId.example || 'Không có ví dụ',
        lessonTitle: entry.vocabId.lesson?.title || 'Không có bài học',
        learnedAt: entry.learnedAt,
      };
    });

    return NextResponse.json({
      vocabs: result,
      totalVocabs,
    }, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách từ đã học:', error);
    return NextResponse.json({ error: 'Lỗi server', details: error.message }, { status: 500 });
  }
}

// POST: Thêm từ đã học
export async function POST(req) {
  try {
    await connectToDatabase();
    const { userId, vocabId } = await req.json();

    // Kiểm tra userId và vocabId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId không hợp lệ' }, { status: 400 });
    }
    if (!vocabId || !mongoose.Types.ObjectId.isValid(vocabId)) {
      return NextResponse.json({ error: 'vocabId không hợp lệ' }, { status: 400 });
    }

    // Tìm user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
    }

    // Kiểm tra xem từ đã được học chưa (dùng learnedVocabIds nếu có)
    if (user.learnedVocabIds && user.learnedVocabIds.includes(vocabId)) {
      return NextResponse.json({ message: 'Từ này đã được học' }, { status: 200 });
    }

    // Thêm từ vào learnedVocabHistory
    const learnedAt = new Date();
    user.learnedVocabHistory.push({
      vocabId,
      learnedAt,
    });

    // Thêm vào learnedVocabIds (nếu có)
    if (user.learnedVocabIds) {
      user.learnedVocabIds.push(vocabId);
    }

    // Cập nhật total_words
    user.total_words = (user.total_words || 0) + 1;

    // Cập nhật streak và days_learned
    const today = new Date().setHours(0, 0, 0, 0); // Đặt về đầu ngày
    const lastLearnedDate = user.learnedVocabHistory
      .filter((entry) => entry.learnedAt < learnedAt) // Lấy các entry trước đó
      .sort((a, b) => new Date(b.learnedAt) - new Date(a.learnedAt))[0]?.learnedAt;

    let lastLearnedDay = lastLearnedDate ? new Date(lastLearnedDate).setHours(0, 0, 0, 0) : null;

    // Cập nhật days_learned
    if (!lastLearnedDay || lastLearnedDay < today) {
      user.days_learned = (user.days_learned || 0) + 1;
    }

    // Cập nhật streak
    const oneDayInMs = 24 * 60 * 60 * 1000;
    if (!lastLearnedDay) {
      user.streak = 1; // Ngày đầu tiên học
    } else if (today - lastLearnedDay === oneDayInMs) {
      user.streak = (user.streak || 0) + 1; // Học liên tiếp
    } else if (today - lastLearnedDay > oneDayInMs) {
      user.streak = 1; // Bỏ lỡ một ngày, reset streak
    }

    // Lưu thay đổi
    await user.save();

    return NextResponse.json(
      {
        message: 'Học từ mới thành công',
        total_words: user.total_words,
        streak: user.streak,
        days_learned: user.days_learned,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi khi thêm từ đã học:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}