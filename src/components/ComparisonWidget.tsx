import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { InteractionMode } from '../types/types'
import Block3D from './Block3D'
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
  originalStart?: Point
  originalEnd?: Point
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
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftEditing, setLeftEditing] = useState(false)
  const [rightEditing, setRightEditing] = useState(false)
  const [leftTempValue, setLeftTempValue] = useState(leftCount.toString())
  const [rightTempValue, setRightTempValue] = useState(rightCount.toString())
  const [isShapeComplete, setIsShapeComplete] = useState(false)

  // Initialize blocks and state on component mount
  useEffect(() => {
    // Set initial state
    setLeftCount(2)
    setRightCount(4)
    setInteractionMode('none')
    setShowOperator(false)
    setShowAnswerLines(false)
    setShowComparison(false)
    setShowResult(null)
    setStudentLines([])
  }, [])

  // CSS constants from ComparisonWidget.css
  const BLOCK_WIDTH = 70 // .block { width: 70px }
  const BLOCK_HEIGHT = 40 // .block { height: 40px }
  const BLOCK_MARGIN = 4 // .block { margin: 4px 0 }
  const LEFT_STACK_POSITION = 0.35 // .block-stack.left { left: 35% }
  const RIGHT_STACK_POSITION = 0.65 // .block-stack.right { left: 65% }
  const LINE_EXTENSION = 20 // How far the line extends horizontally

  // Calculate dynamic spacing based on container height and larger stack
  const calculateBlockSpacing = (rect: DOMRect): { spacing: number; scale: number } => {
    const maxStackSize = Math.max(leftCount, rightCount)
    const totalPadding = 80 // Reduced padding
    const minSpacing = 2 // Reduced minimum spacing
    const maxSpacing = 12 // Reduced maximum spacing
    
    // Calculate total height needed for blocks
    const totalBlockHeight = maxStackSize * BLOCK_HEIGHT
    const availableHeight = rect.height - totalPadding
    
    // Calculate scale if blocks would overflow, with a more gradual scale reduction
    let scale = 1
    const minHeightNeeded = totalBlockHeight + (maxStackSize - 1) * minSpacing
    if (minHeightNeeded > availableHeight) {
      // More aggressive scale reduction with a minimum scale of 0.6
      scale = Math.max(0.6, availableHeight / minHeightNeeded)
    }
    
    // Calculate optimal spacing with a preference for consistent spacing
    const optimalSpacing = scale === 1 
      ? Math.min(maxSpacing, (availableHeight - totalBlockHeight) / (maxStackSize + 1))
      : minSpacing // Use minimum spacing when scaled
    
    return {
      spacing: Math.max(minSpacing, Math.min(maxSpacing, optimalSpacing)),
      scale
    }
  }

  // Helper function to get connection points for a block
  const getConnectionPoint = (stack: 'left' | 'right', type: 'top' | 'bottom', rect: DOMRect): Point => {
    const spacing = calculateBlockSpacing(rect)
    const blockTotalHeight = BLOCK_HEIGHT + spacing.spacing
    
    // Calculate stack positions using the dynamic spacing
    const stackHeight = (stack === 'left' ? leftCount : rightCount) * blockTotalHeight - spacing.spacing // Subtract one spacing since we need n-1 spaces for n blocks
    const stackTop = rect.height / 2 - stackHeight / 2
    const stackBottom = stackTop + stackHeight
    
    // Calculate x position - always use left edge of blocks
    const stackCenterX = rect.width * (stack === 'left' ? LEFT_STACK_POSITION : RIGHT_STACK_POSITION)
    const blockLeftEdge = stackCenterX - (BLOCK_WIDTH / 2)
    const x = stack === 'left' ? 
      blockLeftEdge - LINE_EXTENSION : 
      blockLeftEdge + BLOCK_WIDTH + LINE_EXTENSION

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
    const newEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    
    // Only update if the position has changed significantly
    if (Math.abs(newEnd.x - currentLine.end.x) > 1 || Math.abs(newEnd.y - currentLine.end.y) > 1) {
      setCurrentLine(prev => prev ? { ...prev, end: newEnd } : null)
    }
  }

  const handleMouseUp = (e: React.MouseEvent, stack?: 'left' | 'right', index?: number) => {
    if (!isDrawing || !currentLine || !startBlock || !containerRef.current) {
      console.log('Invalid mouse up state:', { isDrawing, currentLine, startBlock })
      setIsDrawing(false)
      setCurrentLine(null)
      setStartBlock(null)
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const stackSize = stack === 'left' ? leftCount : rightCount

    // Only allow connections to top or bottom blocks
    const type = index === 0 ? 'top' : index === stackSize - 1 ? 'bottom' : null
    if (!type || type !== startBlock.type || stack === startBlock.stack) {
      console.log('Invalid connection:', { type, startBlock, stack, index })
      setCurrentLine(prev => prev ? { ...prev, isDiscarding: true } : null)
      setTimeout(() => {
        setCurrentLine(null)
        setIsDrawing(false)
        setStartBlock(null)
      }, 300)
      return
    }

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

    // Update all states in a single batch
    requestAnimationFrame(() => {
      setStudentLines(prev => [...prev, newLine])
      setCurrentLine(null)
      setIsDrawing(false)
      setStartBlock(null)
    })
  }

  const clearLines = () => {
    setStudentLines([])
    setShowComparison(false)
    setShowResult(null)
    setShowAnswerLines(false)
    setIsAnimating(false)
    setShowOperator(false)
    setCurrentLine(null)
    setIsDrawing(false)
    setStartBlock(null)
    setIsShapeComplete(false)
  }

  const animateComparison = () => {
    if (studentLines.length !== 2) return;
    
    setIsAnimating(true);
    setShowOperator(false);
    setIsShapeComplete(false);
    
    // Start glow effect after shape animation completes
    setTimeout(() => {
      setIsShapeComplete(true);
    }, 900);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Sort student lines by type
    const sortedLines = [...studentLines].sort((a, b) => 
      a.type === 'top' ? -1 : 1
    );

    const topLine = sortedLines.find(line => line.type === 'top');
    const bottomLine = sortedLines.find(line => line.type === 'bottom');

    if (!topLine || !bottomLine) return;

    // Calculate center point for the comparison
    const centerX = rect.width * 0.5;
    const centerY = rect.height * 0.5;
    
    // Fixed dimensions for the comparison shape
    const shapeWidth = 40; // Half width of the shape from center
    const shapeHeight = 30; // Half height of the shape from center

    // Determine the relationship between stacks
    const relationship = leftCount === rightCount ? 'equal' : leftCount > rightCount ? 'greater' : 'less';

    // Calculate the direction of the original lines
    const isLeftToRight = topLine.start.x < topLine.end.x;
    
    // Extend the lines slightly in their current direction
    const extendLines = (line: Line) => {
      const extension = 15; // How much to extend the lines
      const vector = {
        x: line.end.x - line.start.x,
        y: line.end.y - line.start.y
      };
      const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      const normalizedVector = {
        x: vector.x / length,
        y: vector.y / length
      };
      
      // Extend more on the outer ends, less on the meeting ends
      return {
        start: {
          x: line.start.x - normalizedVector.x * extension,
          y: line.start.y - normalizedVector.y * extension
        },
        end: {
          x: line.end.x + normalizedVector.x * (extension * 0.5),
          y: line.end.y + normalizedVector.y * (extension * 0.5)
        }
      };
    };

    // Update lines with new positions based on relationship
    setStudentLines(sortedLines.map(line => {
      const isTop = line.type === 'top';
      const originalLine = { ...line };
      const extendedLine = extendLines(line);
      
      if (relationship === 'equal') {
        // For equals, create parallel horizontal lines
        return {
          ...line,
          originalStart: extendedLine.start,
          originalEnd: extendedLine.end,
          start: {
            x: centerX - shapeWidth,
            y: centerY + (isTop ? -shapeHeight : shapeHeight)
          },
          end: {
            x: centerX + shapeWidth,
            y: centerY + (isTop ? -shapeHeight : shapeHeight)
          }
        };
      } else {
        // For < or >, maintain the original direction of the lines
        const pointingLeft = relationship === 'less';
        
        // When right stack is larger (pointing left), flip the anchor points
        if (pointingLeft) {
          return {
            ...line,
            originalStart: extendedLine.end,  // Flip the original points
            originalEnd: extendedLine.start,  // Flip the original points
            start: {
              x: centerX + shapeWidth,
              y: centerY + (isTop ? -shapeHeight : shapeHeight)
            },
            end: {
              x: centerX - shapeWidth,
              y: centerY
            }
          };
        } else {
          // When left stack is larger (pointing right), keep original direction
          return {
            ...line,
            originalStart: extendedLine.start,
            originalEnd: extendedLine.end,
            start: {
              x: centerX - shapeWidth,
              y: centerY + (isTop ? -shapeHeight : shapeHeight)
            },
            end: {
              x: centerX + shapeWidth,
              y: centerY
            }
          };
        }
      }
    }));

    setShowComparison(true);
  };

  const handleInputChange = (side: 'left' | 'right', value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
      // Clear lines if we're in add/remove mode
      if (interactionMode === 'addRemove') {
        clearLines();
      }
      
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

  // Also update the stack buttons to clear lines
  const handleStackButtonClick = (side: 'left' | 'right', change: 1 | -1) => {
    if (interactionMode === 'addRemove') {
      clearLines();
    }
    
    if (side === 'left') {
      setLeftCount(prev => Math.min(Math.max(prev + change, 1), 10))
    } else {
      setRightCount(prev => Math.min(Math.max(prev + change, 1), 10))
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

  // Update the block rendering to include dynamic spacing and scaling
  const renderBlock = (stack: 'left' | 'right', index: number) => {
    if (!containerRef.current) return null
    
    const rect = containerRef.current.getBoundingClientRect()
    const { spacing, scale } = calculateBlockSpacing(rect)
    const stackSize = stack === 'left' ? leftCount : rightCount
    const stackHeight = stackSize * BLOCK_HEIGHT + (stackSize - 1) * spacing
    const verticalOffset = (rect.height - stackHeight * scale) / 2
    
    return (
      <Block3D
        key={`${stack}-${index}`}
        className={`block ${interactionMode === 'drawCompare' ? 'interactive' : ''}`}
        style={{
          transform: `scale(${scale})`,
          marginTop: index === 0 ? verticalOffset / scale : spacing,
          marginBottom: index === stackSize - 1 ? verticalOffset / scale : 0
        }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          if (isDrawing) {
            handleMouseUp(e as unknown as React.MouseEvent, stack, index)
          } else {
            handleMouseDown(e as unknown as React.MouseEvent, stack, index)
          }
        }}
      />
    )
  }

  return (
    <div className="comparison-widget">
      <div className="mode-controls">
        <div style={{ display: 'flex', gap: '8px' }}>
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
              onClick={() => handleStackButtonClick('left', 1)}
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
              onClick={() => handleStackButtonClick('left', -1)}
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
            <svg 
              width="160" 
              height="120" 
              viewBox="0 0 160 120" 
              style={{ 
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {leftCount === rightCount ? (
                // Equal sign - single path
                <path
                  d={`M 40 30 L 120 30 M 40 90 L 120 90`}
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              ) : leftCount > rightCount ? (
                // Greater than - single path
                <path
                  d={`M 40 30 L 120 60 L 40 90`}
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.7"
                  fill="none"
                />
              ) : (
                // Less than - single path
                <path
                  d={`M 120 30 L 40 60 L 120 90`}
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.7"
                  fill="none"
                />
              )}
            </svg>
          </div>
        )}
        
        <div className="block-stack right">
          <div className="blocks-container">
            {Array.from({ length: rightCount }).map((_, i) => renderBlock('right', i))}
          </div>
          <div className="stack-controls">
            <button 
              className="stack-button"
              onClick={() => handleStackButtonClick('right', 1)}
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
              onClick={() => handleStackButtonClick('right', -1)}
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
                const rect = containerRef.current.getBoundingClientRect();
                const spacing = calculateBlockSpacing(rect);
                const blockTotalHeight = BLOCK_HEIGHT + spacing.spacing;
                
                // Calculate the same connection points we use for drawing lines
                const leftTop = getConnectionPoint('left', 'top', rect);
                const leftBottom = getConnectionPoint('left', 'bottom', rect);
                const rightTop = getConnectionPoint('right', 'top', rect);
                const rightBottom = getConnectionPoint('right', 'bottom', rect);
                
                return (
                  <>
                    <line
                      className="answer-line"
                      x1={leftTop.x}
                      y1={leftTop.y}
                      x2={rightTop.x}
                      y2={rightTop.y}
                    />
                    <line
                      className="answer-line"
                      x1={leftBottom.x}
                      y1={leftBottom.y}
                      x2={rightBottom.x}
                      y2={rightBottom.y}
                    />
                  </>
                );
              })()}
            </>
          )}

          {studentLines.map((line, index) => (
            <motion.path
              key={`${line.type}-${index}`}
              className={`student-line ${isShapeComplete ? 'completed' : ''}`}
              initial={{
                d: `M ${line.originalStart?.x || line.start.x} ${line.originalStart?.y || line.start.y} L ${line.originalEnd?.x || line.end.x} ${line.originalEnd?.y || line.end.y}`
              }}
              animate={{
                d: `M ${line.start.x} ${line.start.y} L ${line.end.x} ${line.end.y}`
              }}
              transition={{ 
                duration: 0.9,
                ease: [0.4, 0, 0.2, 1]
              }}
            />
          ))}

          {currentLine && (
            <path
              className={`drawing-line ${currentLine.isDiscarding ? 'discarding' : ''}`}
              d={`M ${currentLine.start.x} ${currentLine.start.y} L ${currentLine.end.x} ${currentLine.end.y}`}
            />
          )}
        </svg>
      </div>
      
      <div className="control-panel">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`mode-button ${showOperator ? 'active' : ''}`}
            onClick={() => setShowOperator(!showOperator)}
            disabled={showComparison}
          >
            Show Operator
          </button>
          <button 
            className={`mode-button ${showAnswerLines ? 'active' : ''}`}
            onClick={() => setShowAnswerLines(!showAnswerLines)}
            disabled={showComparison}
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
          {studentLines.length === 2 && !showComparison && (
            <button
              className="mode-button"
              onClick={animateComparison}
            >
              Show Comparison
            </button>
          )}
        </div>
      </div>
    </div>
  )
}