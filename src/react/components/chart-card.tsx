import React from 'react'
import { Link } from 'react-router-dom'
import type { Chart } from '../database'

export default function ChartCard({ name, entries }: Chart) {
	return (
		<li>
			<Link to={`/${name}`}>
				<h2>
					{name}
					<span>&rarr;</span>
				</h2>
				<p>
					{entries[0]?.date}
				</p>
			</Link>
		</li>
	)
}
// TODO: decide on styling approach
{/* <style>
  .link-card {
  	list-style: none;
  	display: flex;
  	padding: 0.15rem;
  	background-color: white;
  	background-image: var(--accent-gradient);
  	background-size: 400%;
  	border-radius: 0.5rem;
  	background-position: 100%;
  	transition: background-position 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  }

  .link-card > a {
  	width: 100%;
  	text-decoration: none;
  	line-height: 1.4;
  	padding: 1rem 1.3rem;
  	border-radius: 0.35rem;
  	color: #111;
  	background-color: white;
  	opacity: 0.8;
  }
  h2 {
  	margin: 0;
  	font-size: 1.25rem;
  	transition: color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  p {
  	margin-top: 0.5rem;
  	margin-bottom: 0;
  	color: #444;
  }
  .link-card:is(:hover, :focus-within) {
  	background-position: 0;
  }
  .link-card:is(:hover, :focus-within) h2 {
  	color: rgb(var(--accent));
  }
</style> */}
