const API_KEY = process.env.YOUTUBE_API_KEY; // Đặt API_KEY vào .env.local
const CHANNEL_ID = "UCHaHD477h-FeBbVh9Sh7syA"; // BBC Learning English

export async function fetchLessons() {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=10`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return [];
  }
}
