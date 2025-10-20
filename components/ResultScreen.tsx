
import React, { useRef } from 'react';
import type { FloorPlan, Point } from '../types';
import { ExportIcon, RestartIcon } from './Icons';

interface ResultScreenProps {
  floorPlan: FloorPlan;
  onRestart: () => void;
}

const FloorPlanViewer: React.FC<{ floorPlan: FloorPlan }> = ({ floorPlan }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  if (!floorPlan.rooms || floorPlan.rooms.length === 0) {
    return <p className="text-center text-gray-400">No rooms to display.</p>;
  }

  const allPoints = floorPlan.rooms.flatMap(room => room.polygon);
  const minX = Math.min(...allPoints.map(p => p.x));
  const maxX = Math.max(...allPoints.map(p => p.x));
  const minY = Math.min(...allPoints.map(p => p.y));
  const maxY = Math.max(...allPoints.map(p => p.y));

  const width = maxX - minX;
  const height = maxY - minY;
  const padding = 20;
  
  const viewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;

  const getRoomCenter = (polygon: Point[]): Point => {
    let sumX = 0;
    let sumY = 0;
    for (const point of polygon) {
      sumX += point.x;
      sumY += point.y;
    }
    return { x: sumX / polygon.length, y: sumY / polygon.length };
  };

  return (
    <svg ref={svgRef} viewBox={viewBox} className="w-full h-full bg-gray-100 rounded-md">
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(200,200,200,0.5)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect x={minX - padding} y={minY - padding} width={width + padding * 2} height={height + padding * 2} fill="url(#grid)" />

      {floorPlan.rooms.map((room, roomIndex) => {
        const pointsString = room.polygon.map(p => `${p.x},${p.y}`).join(' ');
        const center = getRoomCenter(room.polygon);
        
        return (
          <g key={roomIndex}>
            <polygon 
              points={pointsString} 
              className="fill-indigo-200/50 stroke-indigo-800" 
              strokeWidth="1"
            />
            <text 
              x={center.x} 
              y={center.y}
              className="text-[8px] sm:text-[10px] md:text-[12px] font-sans font-semibold"
              textAnchor="middle"
              alignmentBaseline="middle"
              fill="#1e3a8a"
            >
              {room.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};


const ResultScreen: React.FC<ResultScreenProps> = ({ floorPlan, onRestart }) => {
    const svgContainerRef = useRef<HTMLDivElement>(null);

    const handleExport = () => {
        if (svgContainerRef.current) {
            const svgElement = svgContainerRef.current.querySelector('svg');
            if (svgElement) {
                const serializer = new XMLSerializer();
                let source = serializer.serializeToString(svgElement);
                source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
                const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
                const a = document.createElement("a");
                a.href = url;
                a.download = "floor-plan.svg";
                a.click();
            }
        }
    };

  return (
    <div className="flex flex-col h-full">
      <div ref={svgContainerRef} className="flex-grow bg-gray-700 rounded-lg p-2 mb-4 border border-gray-600 shadow-inner">
        <FloorPlanViewer floorPlan={floorPlan} />
      </div>
      <div className="flex-shrink-0 flex items-center justify-center space-x-4">
        <button
          onClick={onRestart}
          className="flex items-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors"
        >
          <RestartIcon className="w-5 h-5 mr-2"/>
          Start Over
        </button>
        <button
          onClick={handleExport}
          className="flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors"
        >
          <ExportIcon className="w-5 h-5 mr-2"/>
          Export as SVG
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
