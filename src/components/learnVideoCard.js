'use client';
import React, { useState } from 'react';

const LessonCard = ({ lesson }) => {
  if (!lesson?.id?.videoId) return null;

  const [isExpanded, setIsExpanded] = useState(false);
  const videoUrl = `https://www.youtube.com/embed/${lesson.id.videoId}`;

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`card shadow-sm p-3 mx-auto ${isExpanded ? 'fullscreen' : 'h-100'}`} onClick={handleExpand}>
      <div className={`ratio ${isExpanded ? '' : 'ratio-16x9'}`}>
        <iframe
          className="w-100"
          src={videoUrl}
          title={lesson.snippet.title}
          allowFullScreen
          style={isExpanded ? { width: '1000px', height: '600px' } : {}}
        ></iframe>
      </div>
      <h5 className="mt-2 text-primary text-center">{lesson.snippet.title}</h5>
    </div>
  );
};

export default LessonCard;
