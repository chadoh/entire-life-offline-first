import React from 'react'
import { useRouteError } from "react-router-dom";
import { ErrorResponse } from "@remix-run/router"

function ErrorPage() {
  const error = useRouteError();
  console.error(error);
  const message = error instanceof ErrorResponse
    ? error.statusText
    : error instanceof Error
      ? error.message
      : String(error)

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{message}</i>
      </p>
    </div>
  );
}

export default <ErrorPage />