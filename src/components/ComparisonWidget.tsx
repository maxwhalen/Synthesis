import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { InteractionMode } from '../types/types'
import './ComparisonWidget.css'

interface Point {
  x: number
  y: number
}

interface Line {
  start: Point
  end: Point
  isCorrect?: boolean
  isDiscarding?: boolean
  type: 'top' | 'bottom'
}

interface StartBlock {
  stack: 'left' | 'right'
  type: 'top' | 'bottom'
  point: Point
}

export const ComparisonWidget: React.FC = () => {
  const [leftCount, setLeftCount] = useState(2)
  const [rightCount, setRightCount] = useState(4)
  const [showOperator, setShowOperator] = useState(false)
  const [showAnswerLines, setShowAnswerLines] = useState(false)
  const [studentLines, setStudentLines] = useState<Line[]>([])
  const [currentLine, setCurrentLine] = useState<Line | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [showResult, setShowResult] = useState<boolean | null>(null)
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none')
  const [isDrawing, setIsDrawing] = useState(false)
  const [startBlock, setStartBlock] = useState<StartBlock | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftEditing, setLeftEditing] = useState(false)
  const [rightEditing, setRightEditing] = useState(false)
  const [leftTempValue, setLeftTempValue] = useState(leftCount.toString())
  const [rightTempValue, setRightTempValue] = useState(rightCount.toString())

  // CSS constants from ComparisonWidget.css
  const BLOCK_WIDTH = 70 // .block { width: 70px }
  const BLOCK_HEIGHT = 40 // .block { height: 40px }
  const BLOCK_MARGIN = 4 // .block { margin: 4px 0 }
  const LEFT_STACK_POSITION = 0.35 // .block-stack.left { left: 35% }
  const RIGHT_STACK_POSITION = 0.65 // .block-stack.right { left: 65% }
  const LINE_EXTENSION = 20 // How far the line extends horizontally

  // Calculate dynamic spacing based on container height and larger stack
  const calculateBlockSpacing = (rect: DOMRect): number => {
    const maxStackSize = Math.max(leftCount, rightCount)
    const availableHeight = rect.height - 40 // Subtract padding
    const minSpacing = 4 // Minimum spacing between blocks
    const maxSpacing = 20 // Maximum spacing between blocks
    
    // Calculate optimal spacing
    const optimalSpacing = (availableHeight - (maxStackSize * BLOCK_HEIGHT)) / (maxStackSize - 1)
    
    // Clamp spacing between min and max
    return Math.max(minSpacing, Math.min(maxSpacing, optimalSpacing))
  }

  // Helper function to get connection points for a block
  const getConnectionPoint = (stack: 'left' | 'right', type: 'top' | 'bottom', rect: DOMRect): Point => {
    const spacing = calculateBlockSpacing(rect)
    const blockTotalHeight = BLOCK_HEIGHT + spacing
    
    // Calculate stack positions using the dynamic spacing
    const stackHeight = (stack === 'left' ? leftCount : rightCount) * blockTotalHeight - spacing // Subtract one spacing since we need n-1 spaces for n blocks
    const stackTop = rect.height / 2 - stackHeight / 2
    const stackBottom = stackTop + stackHeight
    
    // Calculate x position - always use left edge of blocks
    const stackCenterX = rect.width * (stack === 'left' ? LEFT_STACK_POSITION : RIGHT_STACK_POSITION)
    const blockLeftEdge = stackCenterX - (BLOCK_WIDTH / 2)
    const x = blockLeftEdge - (stack === 'left' ? LINE_EXTENSION : 0) // Only extend left side

    // Calculate y position
    const y = type === 'top' ? stackTop : stackBottom

    return { x, y }
  }

  // Check if a line already exists for a given type
  const hasLineOfType = (type: 'top' | 'bottom'): boolean => {
    return studentLines.some(line => line.type === type)
  }

  const handleMouseDown = (e: React.MouseEvent, stack: 'left' | 'right', index: number) => {
    if (interactionMode !== 'drawCompare') return
    e.preventDefault()
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // Determine if this is a top or bottom block
    const type = index === 0 ? 'top' : index === (stack === 'left' ? leftCount - 1 : rightCount - 1) ? 'bottom' : null
    console.log('Mouse down on block:', { stack, index, type })
    
    if (!type) return // Only allow connections from top or bottom blocks

    // Check if a line of this type already exists
    if (hasLineOfType(type)) {
      console.log('Line of type already exists:', type)
      return
    }

    const point = getConnectionPoint(stack, type, rect)
    console.log('Starting point:', point)
    
    setStartBlock({
      stack,
      type,
      point
    })
    
    const newLine = {
      start: point,
      end: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      type: type as 'top' | 'bottom',
      isDiscarding: false
    }
    console.log('Creating new line:', newLine)
    setCurrentLine(newLine)
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentLine || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    setCurrentLine(prev => prev ? {
      ...prev,
      end: { x: e.clientX - rect.left, y: e.clientY - rect.top }
    } : null)
  }

  const handleMouseUp = (e: React.MouseEvent, stack?: 'left' | 'right', index?: number) => {
    if (!isDrawing || !currentLine || !startBlock || !containerRef.current) {
      console.log('Invalid mouse up state:', { isDrawing, currentLine, startBlock })
      setCurrentLine(null)
      setIsDrawing(false)
      setStartBlock(null)
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    console.log('Mouse up on:', { stack, index })

    const animateLineFalling = () => {
      console.log('Animating line falling')
      setCurrentLine(prev => prev ? { ...prev, isDiscarding: true } : null)
      setTimeout(() => {
        setCurrentLine(null)
        setIsDrawing(false)
        setStartBlock(null)
      }, 300)
    }

    // If not dropped on a block, discard
    if (!stack || index === undefined) {
      console.log('No valid target block')
      animateLineFalling()
      return
    }

    // If trying to connect to the same stack, discard
    if (stack === startBlock.stack) {
      console.log('Cannot connect to same stack')
      animateLineFalling()
      return
    }

    // Check if this is a valid target block
    const targetType = index === 0 ? 'top' : index === (stack === 'left' ? leftCount - 1 : rightCount - 1) ? 'bottom' : null
    console.log('Target type:', targetType)
    
    if (!targetType || targetType !== startBlock.type) {
      console.log('Invalid target type:', { targetType, startType: startBlock.type })
      animateLineFalling()
      return
    }

    // Create the connection
    const endPoint = getConnectionPoint(stack, targetType, rect)
    console.log('End point:', endPoint)
    
    const newLine: Line = {
      start: startBlock.point,
      end: endPoint,
      type: startBlock.type,
      isCorrect: undefined
    }
    console.log('Creating final line:', newLine)

    setStudentLines(prev => {
      console.log('Current student lines:', prev)
      return [...prev, newLine]
    })
    setCurrentLine(null)
    setIsDrawing(false)
    setStartBlock(null)
  }

  const clearLines = () => {
    setStudentLines([])
    setShowComparison(false)
    setShowResult(null)
    setShowAnswerLines(false)
  }

  const compareLines = () => {
    if (studentLines.length !== 2) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // Sort student lines by type instead of Y position
    const sortedLines = [...studentLines].sort((a, b) => 
      a.type === 'top' ? -1 : 1
    )

    console.log('Sorted lines:', sortedLines)

    const topLine = sortedLines.find(line => line.type === 'top')
    const bottomLine = sortedLines.find(line => line.type === 'bottom')

    if (!topLine || !bottomLine) {
      console.log('Missing top or bottom line')
      return
    }

    // Calculate vertical distance between lines at start and end
    const startGap = Math.abs(topLine.start.y - bottomLine.start.y)
    const endGap = Math.abs(topLine.end.y - bottomLine.end.y)

    console.log('Line gaps:', { startGap, endGap })

    // If gaps are similar (parallel lines), stacks are equal
    if (Math.abs(startGap - endGap) < 10) {
      setStudentLines(sortedLines.map(line => ({ ...line, isCorrect: leftCount === rightCount })))
      setShowComparison(true)
      setShowResult(leftCount === rightCount)
      setShowAnswerLines(true)
      return
    }

    // The side with the larger gap is "greater than"
    const leftIsGreater = startGap > endGap
    const isCorrect = leftIsGreater ? leftCount > rightCount : leftCount < rightCount

    animateToCorrectPositions(sortedLines, isCorrect)
  }

  const animateToCorrectPositions = (sortedLines: Line[], isCorrect: boolean) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const leftX = rect.width * 0.35
    const rightX = rect.width * 0.65
    const blockHeight = 44 // 40 + 4 margin
    const verticalOffset = 20 // Offset for connection points

    const leftTopY = rect.height / 2 - (leftCount * blockHeight) / 2
    const leftBottomY = rect.height / 2 + (leftCount * blockHeight) / 2
    const rightTopY = rect.height / 2 - (rightCount * blockHeight) / 2
    const rightBottomY = rect.height / 2 + (rightCount * blockHeight) / 2

    console.log('Animation positions:', {
      leftTopY,
      leftBottomY,
      rightTopY,
      rightBottomY
    })

    setStudentLines(sortedLines.map(line => ({
      ...line,
      isCorrect,
      start: {
        x: leftX,
        y: line.type === 'top' ? leftTopY : leftBottomY
      },
      end: {
        x: rightX,
        y: line.type === 'top' ? rightTopY : rightBottomY
      }
    })))

    setShowComparison(true)
    setShowResult(isCorrect)
    setShowAnswerLines(true)
  }

  const handleInputChange = (side: 'left' | 'right', value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
      if (side === 'left') {
        setLeftCount(numValue)
        setLeftTempValue(value)
      } else {
        setRightCount(numValue)
        setRightTempValue(value)
      }
    } else {
      if (side === 'left') {
        setLeftTempValue(value)
      } else {
        setRightTempValue(value)
      }
    }
  }

  const handleInputBlur = (side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftEditing(false)
      setLeftTempValue(leftCount.toString())
    } else {
      setRightEditing(false)
      setRightTempValue(rightCount.toString())
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent, side: 'left' | 'right') => {
    if (e.key === 'Enter') {
      handleInputBlur(side)
    }
  }

  // Update the block rendering to include dynamic spacing
  const renderBlock = (stack: 'left' | 'right', index: number) => {
    const spacing = containerRef.current ? calculateBlockSpacing(containerRef.current.getBoundingClientRect()) : BLOCK_MARGIN * 2
    
    return (
      <motion.div
        key={index}
        className="block"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          marginTop: index === 0 ? 0 : spacing,
          marginBottom: 0
        }}
        onClick={(e) => {
          if (interactionMode === 'drawCompare') {
            if (!isDrawing) {
              handleMouseDown(e, stack, index)
            } else {
              handleMouseUp(e, stack, index)
            }
            e.stopPropagation()
          }
        }}
        onMouseEnter={(e) => {
          if (interactionMode === 'drawCompare' && isDrawing) {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect && currentLine) {
              const type = index === 0 ? 'top' : index === (stack === 'left' ? leftCount - 1 : rightCount - 1) ? 'bottom' : null
              if (type === currentLine.type && stack !== startBlock?.stack) {
                const point = getConnectionPoint(stack, type, rect)
                setCurrentLine(prev => prev ? {
                  ...prev,
                  end: point
                } : null)
              }
            }
          }
        }}
      />
    )
  }

  return (
    <div className="comparison-widget">
      <div className="mode-controls">
        <button 
          className={`mode-button ${interactionMode === 'none' ? 'active' : ''}`}
          onClick={() => setInteractionMode('none')}
        >
          None
        </button>
        <button 
          className={`mode-button ${interactionMode === 'addRemove' ? 'active' : ''}`}
          onClick={() => setInteractionMode('addRemove')}
        >
          Add/Remove
        </button>
        <button 
          className={`mode-button ${interactionMode === 'drawCompare' ? 'active' : ''}`}
          onClick={() => {
            setInteractionMode('drawCompare')
            clearLines()
          }}
        >
          Compare
        </button>
      </div>

      <div 
        ref={containerRef}
        className={`stacks-container ${interactionMode}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          if (isDrawing) {
            handleMouseUp(e)
          }
        }}
      >
        <div className="block-stack left">
          <div className="stack-controls">
            <button 
              className="stack-button"
              onClick={() => setLeftCount(Math.min(leftCount + 1, 10))}
              disabled={interactionMode !== 'addRemove'}
            >
              ▲
            </button>
            <div 
              className="stack-value"
              onClick={() => interactionMode === 'addRemove' && setLeftEditing(true)}
            >
              {leftEditing ? (
                <input
                  type="text"
                  value={leftTempValue}
                  onChange={(e) => handleInputChange('left', e.target.value)}
                  onBlur={() => handleInputBlur('left')}
                  onKeyDown={(e) => handleInputKeyDown(e, 'left')}
                  autoFocus
                  maxLength={2}
                />
              ) : (
                leftCount
              )}
            </div>
            <button 
              className="stack-button"
              onClick={() => setLeftCount(Math.max(leftCount - 1, 1))}
              disabled={interactionMode !== 'addRemove'}
            >
              ▼
            </button>
          </div>
          <div className="blocks-container">
            {Array.from({ length: leftCount }).map((_, i) => renderBlock('left', i))}
          </div>
        </div>
        
        {showOperator && (
          <div className="comparator">
            {leftCount === rightCount ? '=' : leftCount > rightCount ? '>' : '<'}
          </div>
        )}
        
        <div className="block-stack right">
          <div className="blocks-container">
            {Array.from({ length: rightCount }).map((_, i) => renderBlock('right', i))}
          </div>
          <div className="stack-controls">
            <button 
              className="stack-button"
              onClick={() => setRightCount(Math.min(rightCount + 1, 10))}
              disabled={interactionMode !== 'addRemove'}
            >
              ▲
            </button>
            <div 
              className="stack-value"
              onClick={() => interactionMode === 'addRemove' && setRightEditing(true)}
            >
              {rightEditing ? (
                <input
                  type="text"
                  value={rightTempValue}
                  onChange={(e) => handleInputChange('right', e.target.value)}
                  onBlur={() => handleInputBlur('right')}
                  onKeyDown={(e) => handleInputKeyDown(e, 'right')}
                  autoFocus
                  maxLength={2}
                />
              ) : (
                rightCount
              )}
            </div>
            <button 
              className="stack-button"
              onClick={() => setRightCount(Math.max(rightCount - 1, 1))}
              disabled={interactionMode !== 'addRemove'}
            >
              ▼
            </button>
          </div>
        </div>

        <svg 
          className="comparison-lines" 
          width="100%" 
          height="100%" 
          preserveAspectRatio="none"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'visible',
            pointerEvents: 'none'
          }}
        >
          {showAnswerLines && containerRef.current && (
            <>
              {(() => {
                const rect = containerRef.current.getBoundingClientRect()
                const spacing = calculateBlockSpacing(rect)
                const blockTotalHeight = BLOCK_HEIGHT + spacing
                return (
                  <>
                    <line
                      className="answer-line"
                      x1={rect.width * LEFT_STACK_POSITION - BLOCK_WIDTH/2 - LINE_EXTENSION}
                      y1={rect.height / 2 - (leftCount * blockTotalHeight - spacing) / 2}
                      x2={rect.width * RIGHT_STACK_POSITION - BLOCK_WIDTH/2}
                      y2={rect.height / 2 - (rightCount * blockTotalHeight - spacing) / 2}
                    />
                    <line
                      className="answer-line"
                      x1={rect.width * LEFT_STACK_POSITION - BLOCK_WIDTH/2 - LINE_EXTENSION}
                      y1={rect.height / 2 + (leftCount * blockTotalHeight - spacing) / 2}
                      x2={rect.width * RIGHT_STACK_POSITION - BLOCK_WIDTH/2}
                      y2={rect.height / 2 + (rightCount * blockTotalHeight - spacing) / 2}
                    />
                  </>
                )
              })()}
            </>
          )}

          {studentLines.map((line, index) => (
            <motion.line
              key={index}
              className={`student-line ${showComparison ? (line.isCorrect ? 'correct-line' : 'incorrect-line') : ''}`}
              x1={line.start.x}
              y1={line.start.y}
              x2={line.end.x}
              y2={line.end.y}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          ))}

          {currentLine && currentLine.start && currentLine.end && (
            <line
              className={`drawing-line ${currentLine.isDiscarding ? 'discarding' : ''}`}
              x1={currentLine.start.x}
              y1={currentLine.start.y}
              x2={currentLine.end.x}
              y2={currentLine.end.y}
            />
          )}
        </svg>

        {showResult !== null && (
          <motion.div
            className={`result-indicator ${showResult ? 'correct' : 'incorrect'}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {showResult ? '✓' : '✗'}
          </motion.div>
        )}
      </div>
      
      <div className="control-panel">
        <button 
          className={`mode-button ${showOperator ? 'active' : ''}`}
          onClick={() => setShowOperator(!showOperator)}
        >
          Show Operator
        </button>
        <button 
          className={`mode-button ${showAnswerLines ? 'active' : ''}`}
          onClick={() => setShowAnswerLines(!showAnswerLines)}
        >
          Show Answer
        </button>
        <button
          className="mode-button"
          onClick={clearLines}
          disabled={studentLines.length === 0}
        >
          Clear Lines
        </button>
        {studentLines.length === 2 && (
          <button
            className="mode-button"
            onClick={compareLines}
          >
            Check Answer
          </button>
        )}
      </div>
    </div>
  )
}