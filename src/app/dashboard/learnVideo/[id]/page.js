import React from "react";
import LessonVideo from "@/components/learnVideoCard";

export default function LessonDetail({ params }) {
  return (
    <div className="lesson-detail">
      <LessonVideo videoId={params.id} />
    </div>
  );
}
