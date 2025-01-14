import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { WidgetState } from '../types/types'

interface ComparisonLinesProps {
  widgetState: WidgetState
}

interface Point {
  x: number
  y: number
}

interface Line {
  start: Point
  end: Point
  type: 'top' | 'bottom'
  isCorrect?: boolean
}

export const ComparisonLines: React.FC<ComparisonLinesProps> = ({
  widgetState
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [drawingLine, setDrawingLine] = useState<{
    start: Point | null
    current: Point | null
    type: 'top' | 'bottom' | null
    side: 'left' | 'right' | null
  }>({
    start: null,
    current: null,
    type: null,
    side: null
  })
  
  const [studentLines, setStudentLines] = useState<Line[]>([])

  const getStackPositions = () => {
    if (!containerRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    const leftX = rect.width * 0.33
    const rightX = rect.width * 0.67
    const topY = rect.height * 0.1
    const bottomY = rect.height * 0.9
    
    return {
      left: { x: leftX, top: topY, bottom: bottomY },
      right: { x: rightX, top: topY, bottom: bottomY }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (widgetState.interactionMode !== 'drawCompare') return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const positions = getStackPositions()
    if (!positions) return

    const side = x < rect.width / 2 ? 'left' : 'right'
    const type = y < rect.height / 2 ? 'top' : 'bottom'
    const startX = side === 'left' ? positions.left.x : positions.right.x
    const startY = type === 'top' ? positions[side].top : positions[side].bottom

    setDrawingLine({
      start: { x: startX, y: startY },
      current: { x, y },
      type,
      side
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawingLine.start) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDrawingLine(prev => ({ ...prev, current: { x, y } }))
  }

  const handleMouseUp = () => {
    if (!drawingLine.start || !drawingLine.current || !drawingLine.type || !drawingLine.side) return

    const positions = getStackPositions()
    if (!positions) return

    const oppositeX = drawingLine.side === 'left' ? positions.right.x : positions.left.x
    const oppositeY = drawingLine.type === 'top' ? positions[drawingLine.side === 'left' ? 'right' : 'left'].top : positions[drawingLine.side === 'left' ? 'right' : 'left'].bottom

    setStudentLines(prev => [
      ...prev,
      {
        start: drawingLine.start!,
        end: { x: oppositeX, y: oppositeY },
        type: drawingLine.type!
      }
    ])

    setDrawingLine({
      start: null,
      current: null,
      type: null,
      side: null
    })
  }

  return (
    <div
      ref={containerRef}
      className="comparison-lines"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        {studentLines.map((line, index) => (
          <motion.line
            key={index}
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            className={`student-line ${line.isCorrect ? 'correct-line' : 'incorrect-line'}`}
          />
        ))}
        {drawingLine.start && drawingLine.current && (
          <motion.line
            x1={drawingLine.start.x}
            y1={drawingLine.start.y}
            x2={drawingLine.current.x}
            y2={drawingLine.current.y}
            className="student-line"
          />
        )}
      </svg>
    </div>
  )
} 