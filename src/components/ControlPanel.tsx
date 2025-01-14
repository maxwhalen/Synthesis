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
  const toggleOperator = () => {
    setWidgetState(prev => ({ ...prev, showOperator: !prev.showOperator }))
  }

  const toggleAnswerLines = () => {
    setWidgetState(prev => ({
      ...prev,
      showAnswerLines: !prev.showAnswerLines
    }))
  }

  return (
    <div className="control-panel">
      <button 
        className={`toggle-button ${widgetState.showOperator ? 'active' : ''}`}
        onClick={toggleOperator}
      >
        Show Operator
      </button>

      <button 
        className={`toggle-button ${widgetState.showAnswerLines ? 'active' : ''}`}
        onClick={toggleAnswerLines}
      >
        Show Answer
      </button>
    </div>
  )
} 