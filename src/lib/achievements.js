import Achievement from '@/models/Achievement';
import User from '@/models/User';

export async function checkAndAwardAchievements(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('Không tìm thấy user');

    const allAchievements = await Achievement.find({});
    const earnedIds = user.earnedAchievements.map(e => e.achievementId.toString());
    const newAchievements = [];

    for (const ach of allAchievements) {
      if (!earnedIds.includes(ach._id.toString())) {
        const { field, value } = ach.criteria;
        let achieved = false;

        switch (field) {
          case 'total_words':
            achieved = user.total_words >= value;
            break;
          case 'streak':
            achieved = user.streak >= value;
            break;
          case 'days_learned':
            achieved = user.days_learned >= value;
            break;
          case 'custom':
            // Logic cho custom (ví dụ: cần thêm field trong User như quizzesCompleted)
            achieved = false; // Placeholder, cần logic cụ thể
            break;
          default:
            achieved = false;
        }

        if (achieved) {
          newAchievements.push({
            achievementId: ach._id,
            earnedAt: new Date()
          });
        }
      }
    }

    if (newAchievements.length > 0) {
      user.earnedAchievements.push(...newAchievements);
      await user.save();
      console.log(`Đã gán ${newAchievements.length} thành tựu mới cho user ${userId}`);
    }

    return newAchievements;
  } catch (error) {
    console.error('Lỗi khi kiểm tra thành tựu:', error);
    throw error;
  }
}