export interface BlockStack {
  count: number
  value: string
  isInputMode: boolean
  topLineConnected: boolean
  bottomLineConnected: boolean
}

export interface ComparisonLines {
  topLine: boolean
  bottomLine: boolean
  isAutomatic: boolean
}

export type InteractionMode = 'none' | 'addRemove' | 'drawCompare'

export interface WidgetState {
  leftCount: number
  rightCount: number
  showOperator: boolean
  showAnswerLines: boolean
  interactionMode: InteractionMode
} 