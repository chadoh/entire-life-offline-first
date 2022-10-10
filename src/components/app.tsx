import React from 'react'
import NewChartForm from './new-chart-form'
import ChartCard from './chart-card'
import { useData, Chart } from '../database'

export default function App() {
  const { charts, chartIds } = useData()
  return (
    <>
      {chartIds && chartIds.length > 0 && (
        <ul>
          {chartIds.map(id => (
            <ChartCard key={id} {...charts[id] as Chart} />
          ))}
        </ul>
      )}
      <NewChartForm />
    </>
  )
}