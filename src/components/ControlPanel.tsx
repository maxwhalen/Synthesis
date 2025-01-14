import React from 'react'
import { WidgetState } from '../types/types'

interface ControlPanelProps {
  widgetState: WidgetState
  setWidgetState: React.Dispatch<React.SetStateAction<WidgetState>>
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  widgetState,
  setWidgetState
}) => {
  const toggleComparator = () => {
    setWidgetState(prev => ({ ...prev, showComparator: !prev.showComparator }))
  }

  const toggleAnswerKey = () => {
    setWidgetState(prev => ({
      ...prev,
      comparisonLines: {
        ...prev.comparisonLines,
        isAutomatic: !prev.comparisonLines.isAutomatic
      }
    }))
  }

  return (
    <div className="control-panel">
      <button 
        className={`toggle-button ${widgetState.showComparator ? 'active' : ''}`}
        onClick={toggleComparator}
      >
        Show Operand
      </button>

      <button 
        className={`toggle-button ${widgetState.comparisonLines.isAutomatic ? 'active' : ''}`}
        onClick={toggleAnswerKey}
      >
        Show Answer
      </button>
    </div>
  )
} 