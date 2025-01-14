import React from 'react';
import './Block3D.css';

interface Block3DProps {
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
}

const Block3D: React.FC<Block3DProps> = ({ className = '', onClick, style }) => {
  return (
    <div className={`block3d-container ${className}`} onClick={onClick} style={style}>
      <div className="block3d">
        <div className="face face--front"></div>
        <div className="face face--back"></div>
        <div className="face face--top"></div>
        <div className="face face--bottom"></div>
      </div>
    </div>
  );
};

export default Block3D; 