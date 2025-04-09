import React from "react";
import { fetchLessons } from "./learnVideoService";
import LessonCard from "@/components/learnVideoCard";

export default async function learnVideoPage() {
  const lessonsVideo = await fetchLessons();
  console.log("LessonsVideo data:", lessonsVideo);

  return (
    <div className="mt-4 overflow-auto" style={{ maxHeight: "900px" }}>
      <div className="row g-4">
        {lessonsVideo.map((lesson) => (
          <div key={lesson.id.videoId} className="col-md-4">
            <LessonCard lesson={lesson} />
          </div>
        ))}
      </div>
    </div>
  );
};


