import React from 'react'
import NewChartForm from './new-chart-form'
import ChartCard from './chart-card'
import { useDB, Chart } from '../database'

export default function App() {
  const { charts, chartIds } = useDB()
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