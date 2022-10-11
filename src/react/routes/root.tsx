import React from 'react'
import {
  useLoaderData,
} from 'react-router-dom'
import NewChartForm from '../components/new-chart-form'
import ChartCard from '../components/chart-card'
import { db, Chart } from '../database'

export async function loader() {
  const { charts, chartIds } = db.fetchData()
  return { charts, chartIds }
}

function App() {
  const { charts, chartIds } = useLoaderData() as Awaited<ReturnType<typeof loader>>
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

export const element = <App />