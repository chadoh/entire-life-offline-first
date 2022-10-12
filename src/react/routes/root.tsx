import React from 'react'
import {
  useLoaderData,
  redirect,
  Outlet,
} from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import NewChartForm from '../components/new-chart-form'
import ChartCard from '../components/chart-card'
import { db, Data as AllData, Chart, NewChart } from '../database'

type Data = Pick<AllData, 'charts' | 'chartIds'>

export const loader: LoaderFunction = async (): Promise<Data> => {
  const { charts, chartIds } = db.fetchData()
  return { charts, chartIds }
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const newChart = Object.fromEntries(formData) as unknown as NewChart
  db.addChart(newChart)
  return redirect(`/${newChart.name}`)
}

function App() {
  const { charts, chartIds } = useLoaderData() as Awaited<Data>
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
      <Outlet />
    </>
  )
}

export const element = <App />