import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from './App'
import { FilterProvider } from "./context/FilterProvider"; // Ajustá ruta
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <React.StrictMode>
      <BrowserRouter>
        <FilterProvider>
          <App />
        </FilterProvider>
      </BrowserRouter>
    </React.StrictMode>
  </QueryClientProvider>

);
