'use client';
import React from "react";

export default function LessonVideo({ videoId }) {
  return (
    <div className="lesson-video">
      <iframe
        width="1000"
        height="400"
        src={`https://www.youtube.com/embed/${videoId}`}
        allowFullScreen
      ></iframe>
    </div>
  );
}
