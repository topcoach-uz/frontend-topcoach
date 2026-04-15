import React from 'react';
import { Progress, Tag } from 'antd';
import { CheckCircle2, Clock } from 'lucide-react';
import './ProgressTracker.scss';

interface ProgressTrackerProps {
  lessonId: string;
  userProgress: any;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ lessonId, userProgress }) => {
  // Find progress for this specific lesson
  const lessonProgress = userProgress?.progress?.find((p: any) => p.lessonId === lessonId);
  
  const isCompleted = lessonProgress?.isCompleted || false;
  const progressPercentage = lessonProgress?.progressPercentage || 0;
  const timeWatched = lessonProgress?.timeWatched || 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="progress-tracker">
      <div className="progress-status">
        {isCompleted ? (
          <Tag color="success" icon={<CheckCircle2 size={16} />}>
            Completed
          </Tag>
        ) : progressPercentage > 0 ? (
          <Tag color="processing" icon={<Clock size={16} />}>
            In Progress
          </Tag>
        ) : (
          <Tag color="default">
            Not Started
          </Tag>
        )}
      </div>

      <div className="progress-details">
        <div className="progress-bar">
          <Progress 
            percent={progressPercentage} 
            size="small"
            strokeColor={isCompleted ? "#16a34a" : "#dc2626"}
            showInfo={false}
          />
          <span className="progress-text">
            {progressPercentage}% complete
          </span>
        </div>

        {timeWatched > 0 && (
          <div className="time-watched">
            <Clock size={16} />
            <span>{formatTime(timeWatched)} watched</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker; 