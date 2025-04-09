import { Schema, model, models } from 'mongoose';

const AchievementSchema = new Schema({
  title: { type: String, required: true, unique: true }, // Tên thành tựu, e.g., "Learned 10 Words"
  description: { type: String, required: true },         // Mô tả, e.g., "Bạn đã học 10 từ mới!"
  icon: { type: String },                               // Biểu tượng, e.g., "🏅"
  criteria: {                                           // Tiêu chí để đạt
    field: { type: String, required: true, enum: ['total_words', 'streak', 'days_learned', 'custom'] }, // Field so sánh
    value: { type: Number, required: true }             // Giá trị cần đạt
  }
});

const Achievement = models.Achievement || model('Achievement', AchievementSchema);
export default Achievement;