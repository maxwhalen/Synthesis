import React, { useState } from 'react'
import { InteractionMode } from '../types/types'
import { motion } from 'framer-motion'

interface BlockStackProps {
  count: number
  position: 'left' | 'right'
  onChange: (newCount: number) => void
  interactionMode: InteractionMode
}

export const BlockStackComponent: React.FC<BlockStackProps> = ({
  count,
  position,
  onChange,
  interactionMode
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(count.toString())

  const handleIncrement = () => {
    if (count < 10) {
      onChange(count + 1)
    }
  }

  const handleDecrement = () => {
    if (count > 1) {
      onChange(count - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTempValue(value)
    
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
      onChange(numValue)
    }
  }

  const handleInputBlur = () => {
    setIsEditing(false)
    setTempValue(count.toString())
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    }
  }

  return (
    <div className={`block-stack ${position}`}>
      <div className="blocks-container">
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={i}
            className="block"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>

      <div className="stack-controls">
        {interactionMode === 'addRemove' && (
          <button 
            className="stack-button up"
            onClick={handleIncrement}
            disabled={count >= 10}
          >
            ▲
          </button>
        )}

        {interactionMode === 'addRemove' ? (
          <div 
            className="stack-value"
            onClick={() => setIsEditing(true)}
          >
            {isEditing ? (
              <input
                type="text"
                value={tempValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                autoFocus
                maxLength={2}
              />
            ) : (
              count
            )}
          </div>
        ) : (
          <div className="stack-value">{count}</div>
        )}

        {interactionMode === 'addRemove' && (
          <button 
            className="stack-button down"
            onClick={handleDecrement}
            disabled={count <= 1}
          >
            ▼
          </button>
        )}
      </div>
    </div>
  )
} 