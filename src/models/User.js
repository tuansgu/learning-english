import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: { type: String, required: true },
    total_words: { type: Number, default: 0 }, // Tổng số từ đã học
    streak: { type: Number, default: 0 }, // Chuỗi ngày liên tục
    days_learned: { type: Number, default: 0 }, // Tổng số ngày đã học
    earnedAchievements: [
      {
        achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement' },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    learnedVocabIds: [{ type: Schema.Types.ObjectId, ref: 'Vocabulary' }], // Mã từ đã học
    learnedVocabHistory: [
      {
        vocabId: { type: Schema.Types.ObjectId, ref: 'Vocabulary' },
        learnedAt: { type: Date, default: Date.now }, // Thời gian học cụ thể
      },
    ],
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);


const User = models.User || model('User', UserSchema);
export default User;