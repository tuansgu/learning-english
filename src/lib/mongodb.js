import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
console.log(uri);

if (!uri) {
  throw new Error('Vui lòng cấu hình biến môi trường MONGODB_URI');
}

const connectToDatabase = async () => {
  if (mongoose.connections[0].readyState) {
    // Nếu đã kết nối rồi, tránh kết nối lại
    return;
  }
  await mongoose.connect(uri); // Không cần truyền các tùy chọn không còn cần thiết
  console.log("Đã kết nối đến MongoDB");
};

export default connectToDatabase;
