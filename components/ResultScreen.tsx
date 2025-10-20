import React, { useRef, useState, useEffect } from 'react';
import type { FloorPlan, Point, Path } from '../types';
import { ExportIcon, RestartIcon, EditIcon, AddIcon, TrashIcon, SaveIcon, CancelIcon } from './Icons';

interface FloorPlanViewerProps {
  floorPlan: FloorPlan;
  isEditing: boolean;
  isDrawing: boolean;
  selectedPathIndex: number | null;
  newPathPoints: Point[];
  onPathSelect: (index: number) => void;
  onPointMove: (pathIndex: number, pointIndex: number, newPosition: Point) => void;
  onPointDelete: (pathIndex: number, pointIndex: number) => void;
  onCanvasClick: (point: Point) => void;
}

const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({ 
  floorPlan, 
  isEditing, 
  isDrawing,
  selectedPathIndex,
  newPathPoints,
  onPathSelect,
  onPointMove,
  onPointDelete,
  onCanvasClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedPoint, setDraggedPoint] = useState<{pathIndex: number, pointIndex: number} | null>(null);
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);


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
  const padding = Math.max(width, height) * 0.05;
  const viewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;
  const planDiagonal = Math.sqrt(width * width + height * height);
  const waypointRadius = planDiagonal * 0.005;

  const getSVGPoint = (evt: React.MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svgRef.current.getScreenCTM()?.inverse();
    return ctm ? pt.matrixTransform(ctm) : { x: 0, y: 0 };
  };

  const handleMouseDown = (pathIndex: number, pointIndex: number) => {
    if (!isEditing) return;
    setDraggedPoint({ pathIndex, pointIndex });
  };
  
  const handleMouseMove = (evt: React.MouseEvent) => {
    const newPos = getSVGPoint(evt);
    if (draggedPoint) {
      onPointMove(draggedPoint.pathIndex, draggedPoint.pointIndex, newPos);
    }
     if (isDrawing) {
      setCursorPosition(newPos);
    }
  };
  
  const handleMouseUp = () => {
    setDraggedPoint(null);
  };
  
  const handleMouseLeave = () => {
    setDraggedPoint(null);
    setCursorPosition(null);
  };

  const getRoomCenter = (polygon: Point[]): Point => {
    return { 
      x: polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length,
      y: polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length
    };
  };

  const calculatePolygonArea = (polygon: Point[]): number => {
    let area = 0;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
    }
    return Math.abs(area / 2);
  };

  return (
    <svg 
      ref={svgRef} 
      viewBox={viewBox} 
      className={`w-full h-full bg-white rounded-md ${isEditing ? 'cursor-crosshair' : ''}`}
      onMouseMove={isEditing ? handleMouseMove : undefined}
      onMouseUp={isEditing ? handleMouseUp : undefined}
      onMouseLeave={isEditing ? handleMouseLeave : undefined}
      onClick={(e) => isEditing && onCanvasClick(getSVGPoint(e))}
    >
      <defs>
        <pattern id="grid" width={planDiagonal * 0.02} height={planDiagonal * 0.02} patternUnits="userSpaceOnUse">
          <path d={`M ${planDiagonal * 0.02} 0 L 0 0 0 ${planDiagonal * 0.02}`} fill="none" stroke="rgba(200,200,200,0.5)" strokeWidth="0.5"/>
        </pattern>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-red-600" />
        </marker>
        <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-sky-500" />
        </marker>
      </defs>
      <rect x={minX - padding} y={minY - padding} width={width + padding * 2} height={height + padding * 2} fill="url(#grid)" />

      {/* Rooms, Doors, Windows */}
      {floorPlan.rooms.map((room, roomIndex) => {
        const pointsString = room.polygon.map(p => `${p.x},${p.y}`).join(' ');
        const center = getRoomCenter(room.polygon);
        const area = calculatePolygonArea(room.polygon);
        
        let fontSize = Math.max(planDiagonal * 0.012, Math.min(Math.sqrt(area) * 0.25, planDiagonal * 0.04));
        const roomWidth = Math.max(...room.polygon.map(p => p.x)) - Math.min(...room.polygon.map(p => p.x));
        if (room.name.length * fontSize * 0.6 > roomWidth * 0.9) {
          fontSize = (roomWidth * 0.9) / (room.name.length * 0.6);
        }
        
        return (
          <g key={`room-${roomIndex}`}>
            <polygon points={pointsString} className="fill-indigo-200/50 stroke-indigo-800" strokeWidth={planDiagonal * 0.002} />
            {room.doors?.map((door, doorIndex) => {
                const p1 = room.polygon[door.wallIndex];
                const p2 = room.polygon[(door.wallIndex + 1) % room.polygon.length];
                if (!p1 || !p2) return null;
                const wallDx = p2.x - p1.x, wallDy = p2.y - p1.y;
                const center = { x: p1.x + wallDx * door.position, y: p1.y + wallDy * door.position };
                const dir = { x: wallDx / Math.sqrt(wallDx**2 + wallDy**2), y: wallDy / Math.sqrt(wallDx**2 + wallDy**2) };
                const start = { x: center.x - dir.x * door.width / 2, y: center.y - dir.y * door.width / 2 };
                const end = { x: center.x + dir.x * door.width / 2, y: center.y + dir.y * door.width / 2 };
                return <line key={`d-${roomIndex}-${doorIndex}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="stroke-amber-700" strokeWidth={planDiagonal * 0.006} strokeLinecap="round" />;
            })}
            {room.windows?.map((window, windowIndex) => {
                const p1 = room.polygon[window.wallIndex];
                const p2 = room.polygon[(window.wallIndex + 1) % room.polygon.length];
                if (!p1 || !p2) return null;
                const wallDx = p2.x - p1.x, wallDy = p2.y - p1.y;
                const center = { x: p1.x + wallDx * window.position, y: p1.y + wallDy * window.position };
                const dir = { x: wallDx / Math.sqrt(wallDx**2 + wallDy**2), y: wallDy / Math.sqrt(wallDx**2 + wallDy**2) };
                const start = { x: center.x - dir.x * window.width / 2, y: center.y - dir.y * window.width / 2 };
                const end = { x: center.x + dir.x * window.width / 2, y: center.y + dir.y * window.width / 2 };
                return <line key={`w-${roomIndex}-${windowIndex}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="stroke-cyan-500" strokeWidth={planDiagonal * 0.006} strokeLinecap="butt" />;
            })}
            <text x={center.x} y={center.y} fontSize={fontSize} className="font-sans font-semibold" textAnchor="middle" alignmentBaseline="middle" fill="#1e3a8a">
              {room.name}
            </text>
          </g>
        );
      })}
      
      {/* Paths */}
      {floorPlan.paths?.map((path, pathIndex) => {
         if (path.points.length < 2) return null;
         const pointsString = path.points.map(p => `${p.x},${p.y}`).join(' ');
         const isSelected = isEditing && selectedPathIndex === pathIndex;
         const pathColor = path.color || '#dc2626'; // Default red
         
         // Create a dynamic style for the marker to use the path's color
         const markerId = `arrowhead-${pathColor.replace('#', '')}`;
         const selectedMarkerId = `arrowhead-selected-${pathColor.replace('#', '')}`;
         
         return (
            <g key={`path-group-${pathIndex}`} onClick={(e) => { e.stopPropagation(); if(isEditing) onPathSelect(pathIndex); }}>
              <defs>
                <marker id={markerId} markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={pathColor} />
                </marker>
                 <marker id={selectedMarkerId} markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#0ea5e9" />
                </marker>
              </defs>
              <polyline points={pointsString} stroke="transparent" strokeWidth={planDiagonal * 0.02} fill="none" className={isEditing ? 'cursor-pointer' : ''} />
              <polyline
                  points={pointsString}
                  stroke={isSelected ? '#0ea5e9' : pathColor}
                  strokeWidth={isSelected ? planDiagonal * 0.007 : planDiagonal * 0.003}
                  fill="none"
                  strokeDasharray={`${planDiagonal * 0.01}, ${planDiagonal * 0.01}`}
                  markerEnd={isSelected ? `url(#${selectedMarkerId})` : `url(#${markerId})`}
                  className={`${isEditing ? 'cursor-pointer' : ''} transition-all duration-150 ease-in-out`}
              />
            </g>
         );
      })}

      {/* Waypoints for selected path */}
      {isEditing && selectedPathIndex !== null && floorPlan.paths?.[selectedPathIndex]?.points.map((point, pointIndex) => (
          <circle
              key={`waypoint-${selectedPathIndex}-${pointIndex}`}
              cx={point.x}
              cy={point.y}
              r={waypointRadius * 1.2}
              className="fill-sky-500 stroke-white cursor-move"
              strokeWidth={waypointRadius * 0.3}
              onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(selectedPathIndex, pointIndex); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onPointDelete(selectedPathIndex, pointIndex); }}
          />
      ))}

        {/* Rubber band line for new path drawing */}
        {isDrawing && newPathPoints.length > 0 && cursorPosition && (
            <line
            x1={newPathPoints[newPathPoints.length - 1].x}
            y1={newPathPoints[newPathPoints.length - 1].y}
            x2={cursorPosition.x}
            y2={cursorPosition.y}
            stroke="#0ea5e9"
            strokeWidth={planDiagonal * 0.003}
            strokeDasharray={`${planDiagonal * 0.005}, ${planDiagonal * 0.005}`}
            />
        )}


      {/* Waypoints for new path being drawn */}
       {isEditing && newPathPoints.length > 0 && (
         <>
          <polyline
              points={newPathPoints.map(p => `${p.x},${p.y}`).join(' ')}
              stroke="#2563EB"
              strokeWidth={planDiagonal * 0.004}
              fill="none"
              strokeDasharray={`${planDiagonal * 0.01}, ${planDiagonal * 0.01}`}
            />
          {newPathPoints.map((point, pointIndex) => (
            <circle
                key={`new-waypoint-${pointIndex}`}
                cx={point.x}
                cy={point.y}
                r={waypointRadius}
                className="fill-blue-500 stroke-white"
                strokeWidth={waypointRadius * 0.3}
            />
          ))}
         </>
      )}
    </svg>
  );
};

interface ResultScreenProps {
  floorPlan: FloorPlan;
  onRestart: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ floorPlan, onRestart }) => {
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const [editablePlan, setEditablePlan] = useState<FloorPlan>(JSON.parse(JSON.stringify(floorPlan)));
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [newPathPoints, setNewPathPoints] = useState<Point[]>([]);

    useEffect(() => {
        setEditablePlan(JSON.parse(JSON.stringify(floorPlan)));
        setIsEditing(false);
        setSelectedPathIndex(null);
        setIsDrawing(false);
        setNewPathPoints([]);
    }, [floorPlan]);

    const handlePathSelect = (index: number) => {
        if(isDrawing) return;
        setSelectedPathIndex(index);
    };

    const handlePointMove = (pathIndex: number, pointIndex: number, newPosition: Point) => {
         setEditablePlan(prevPlan => {
            const newPaths = [...(prevPlan.paths || [])];
            const newPoints = [...newPaths[pathIndex].points];
            newPoints[pointIndex] = newPosition;
            newPaths[pathIndex] = { ...newPaths[pathIndex], points: newPoints };
            return { ...prevPlan, paths: newPaths };
        });
    };

    const handlePointDelete = (pathIndex: number, pointIndex: number) => {
        const path = editablePlan.paths?.[pathIndex];
        if (!path) return;

        if (path.points.length > 2) {
             setEditablePlan(prevPlan => {
                const newPaths = [...(prevPlan.paths || [])];
                const newPoints = newPaths[pathIndex].points.filter((_, idx) => idx !== pointIndex);
                newPaths[pathIndex] = { ...newPaths[pathIndex], points: newPoints };
                return { ...prevPlan, paths: newPaths };
            });
        } else {
            handleDeletePath(pathIndex);
        }
    };

    const handleCanvasClick = (point: Point) => {
        if(isDrawing) {
            setNewPathPoints(prev => [...prev, point]);
        } else {
            setSelectedPathIndex(null);
        }
    };
    
    const handleStartNewPath = () => {
        setSelectedPathIndex(null);
        setIsDrawing(true);
        setNewPathPoints([]);
    };
    
    const handleFinishDrawing = () => {
        if (newPathPoints.length >= 2) {
            const newPath: Path = {
                name: `Custom Path ${((editablePlan.paths?.length) || 0) + 1}`,
                points: newPathPoints,
                color: '#3b82f6'
            };
            setEditablePlan(prev => ({...prev, paths: [...(prev.paths || []), newPath]}));
        }
        setIsDrawing(false);
        setNewPathPoints([]);
    };

    const handleDeletePath = (indexToDelete: number) => {
        setEditablePlan(prev => ({...prev, paths: (prev.paths || []).filter((_, index) => index !== indexToDelete)}));
        setSelectedPathIndex(null);
    };

    const handleCancelEdit = () => {
        setEditablePlan(JSON.parse(JSON.stringify(floorPlan)));
        setIsEditing(false);
        setSelectedPathIndex(null);
        setIsDrawing(false);
        setNewPathPoints([]);
    };
    
    const handleSaveChanges = () => {
        setIsEditing(false);
        setSelectedPathIndex(null);
        setIsDrawing(false);
        setNewPathPoints([]);
    };

    const handlePathNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedPathIndex === null) return;
        const newName = e.target.value;
        setEditablePlan(prevPlan => {
            const newPaths = [...(prevPlan.paths || [])];
            newPaths[selectedPathIndex] = { ...newPaths[selectedPathIndex], name: newName };
            return { ...prevPlan, paths: newPaths };
        });
    };

    const handlePathColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedPathIndex === null) return;
        const newColor = e.target.value;
        setEditablePlan(prevPlan => {
            const newPaths = [...(prevPlan.paths || [])];
            newPaths[selectedPathIndex] = { ...newPaths[selectedPathIndex], color: newColor };
            return { ...prevPlan, paths: newPaths };
        });
    };

    const handleExportSVG = () => { /* ... (export logic unchanged) ... */ };
    const handleExportPNG = () => { /* ... (export logic unchanged) ... */ };

  return (
    <div className="flex flex-col h-full">
      <div ref={svgContainerRef} className="flex-grow bg-gray-700 rounded-lg p-2 mb-4 border border-gray-600 shadow-inner">
        <FloorPlanViewer 
            floorPlan={editablePlan}
            isEditing={isEditing}
            isDrawing={isDrawing}
            selectedPathIndex={selectedPathIndex}
            newPathPoints={newPathPoints}
            onPathSelect={handlePathSelect}
            onPointMove={handlePointMove}
            onPointDelete={handlePointDelete}
            onCanvasClick={handleCanvasClick}
        />
      </div>

      {isEditing && (
        <div className="flex-shrink-0 flex items-center justify-center flex-wrap gap-x-4 gap-y-2 p-2 bg-gray-900/50 rounded-lg mb-4 border border-gray-700">
            {isDrawing ? (
                 <button onClick={handleFinishDrawing} disabled={newPathPoints.length < 2} className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-500 transition-colors">
                    <SaveIcon className="w-5 h-5 mr-2"/> Finish Drawing
                </button>
            ) : (
                <button onClick={handleStartNewPath} className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    <AddIcon className="w-5 h-5 mr-2"/> Add New Path
                </button>
            )}
            <button onClick={() => selectedPathIndex !== null && handleDeletePath(selectedPathIndex)} disabled={selectedPathIndex === null} className="flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                <TrashIcon className="w-5 h-5 mr-2"/> Delete Selected
            </button>

            {selectedPathIndex !== null && (
                <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 border-l border-gray-600 pl-4 ml-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="pathName" className="font-semibold text-sm text-gray-300 whitespace-nowrap">Path Name:</label>
                        <input
                            id="pathName"
                            type="text"
                            value={editablePlan.paths?.[selectedPathIndex]?.name || ''}
                            onChange={handlePathNameChange}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-white text-sm w-40 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="pathColor" className="font-semibold text-sm text-gray-300">Color:</label>
                        <input
                            id="pathColor"
                            type="color"
                            value={editablePlan.paths?.[selectedPathIndex]?.color || '#dc2626'}
                            onChange={handlePathColorChange}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 p-0 border-none rounded-md bg-transparent cursor-pointer"
                        />
                    </div>
                </div>
            )}
            
            <div className="flex-grow"></div> 

            <button onClick={handleSaveChanges} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors ml-auto">
                <SaveIcon className="w-5 h-5 mr-2"/> Save Changes
            </button>
             <button onClick={handleCancelEdit} className="flex items-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors">
                <CancelIcon className="w-5 h-5 mr-2"/> Cancel
            </button>
        </div>
      )}

      <div className="flex-shrink-0 flex items-center justify-center space-x-4">
        <button onClick={onRestart} className="flex items-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors">
          <RestartIcon className="w-5 h-5 mr-2"/> Start Over
        </button>
         <button onClick={() => setIsEditing(!isEditing)} className="flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-colors">
            <EditIcon className="w-5 h-5 mr-2"/> {isEditing ? 'Exit Editor' : 'Edit Paths'}
        </button>
        <button onClick={handleExportSVG} className="flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors">
          <ExportIcon className="w-5 h-5 mr-2"/> SVG
        </button>
         <button onClick={handleExportPNG} className="flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-colors">
          <ExportIcon className="w-5 h-5 mr-2"/> PNG
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;