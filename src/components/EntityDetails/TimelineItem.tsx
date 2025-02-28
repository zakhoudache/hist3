import React from "react";

interface TimelineItemProps {
  date: string;
  title: string;
  description: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  date,
  title,
  description,
}) => {
  return (
    <div className="mb-6 relative">
      <div className="absolute -left-[25px] mt-1.5 h-4 w-4 rounded-full border border-white bg-gray-200"></div>
      <div className="text-xs text-muted-foreground mb-1">{date}</div>
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-sm">{description}</p>
    </div>
  );
};

export default TimelineItem;
