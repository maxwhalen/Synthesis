import React from 'react'
import ReactDOM from 'react-dom/client'
import { ComparisonWidget } from './components/ComparisonWidget'
import './components/ComparisonWidget.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ComparisonWidget />
  </React.StrictMode>
) 