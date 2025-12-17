import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';

export const Heatmap = ({ 
  data, 
  type = 'habit',
  colorClass = "bg-green-500",
  title = "Activity History",
  maxValue = 4 // Default max value for scaling intensity (e.g. 4 tasks, or 60 minutes)
}: { 
  data: Record<string, number>, 
  type?: 'habit' | 'task',
  colorClass?: string,
  title?: string,
  maxValue?: number
}) => {
  const weeks = 20;
  const today = new Date();
  
  // Calculate range to end on nearest Saturday (to complete the grid columns)
  const currentDay = today.getDay(); // 0 (Sun) - 6 (Sat)
  const daysToSaturday = 6 - currentDay;
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + daysToSaturday);
  
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (weeks * 7) + 1);

  const dates = useMemo(() => {
    const d = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      d.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return d;
  }, []);

  return (
    <div className="w-full overflow-x-auto pb-2 animate-fade-in">
       <div className="flex justify-between items-center mb-3 sticky left-0">
          <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
            <Calendar size={12}/> {title}
          </h4>
          <div className="text-[10px] text-gray-400 flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-gray-100 dark:bg-gray-700/50"></div>
              <div className={`w-2.5 h-2.5 rounded-[2px] ${colorClass} opacity-40`}></div>
              <div className={`w-2.5 h-2.5 rounded-[2px] ${colorClass} opacity-70`}></div>
              <div className={`w-2.5 h-2.5 rounded-[2px] ${colorClass}`}></div>
            </div>
            <span>More</span>
          </div>
       </div>
       
       <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
          {dates.map((date, i) => {
            const isFuture = date > today;
            let count = 0;

            // Key matching based on type
            if (type === 'habit') {
               count = data[date.toDateString()] ? 1 : 0;
            } else {
               // For tasks, use YYYY-MM-DD
               const y = date.getFullYear();
               const m = String(date.getMonth() + 1).padStart(2, '0');
               const d = String(date.getDate()).padStart(2, '0');
               const isoDate = `${y}-${m}-${d}`;
               count = data[isoDate] || 0;
            }

            // Calculate Intensity (0-4)
            let intensity = 0;
            if (type === 'habit') {
                intensity = count > 0 ? 1 : 0;
            } else {
                // Scale count based on maxValue to a 1-4 range
                // e.g. if maxValue is 60 (mins), 15 mins -> 1, 60 mins -> 4
                intensity = Math.ceil((count / maxValue) * 4);
                intensity = Math.min(intensity, 4);
            }
            
            let bgClass = "bg-gray-100 dark:bg-gray-700/50";
            if (intensity > 0) {
                if (type === 'habit') {
                    // Binary for habits
                    bgClass = colorClass;
                } else {
                   // Gradient for tasks/intensity
                   const opacities = ["opacity-40", "opacity-60", "opacity-80", "opacity-100"];
                   // Map intensity 1->0, 2->1, 3->2, 4->3
                   const idx = Math.max(0, intensity - 1);
                   bgClass = `${colorClass} ${opacities[idx]}`;
                }
            }
            if (isFuture) bgClass = "bg-transparent border border-dashed border-gray-100 dark:border-gray-800";

            return (
              <div 
                key={i} 
                className={`w-2.5 h-2.5 rounded-[2px] transition-colors relative group/cell ${bgClass}`}
              >
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                    {date.toLocaleDateString()}
                    {intensity > 0 && <span className="block font-bold">{type === 'habit' ? 'Completed' : `${count}`}</span>}
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );
};