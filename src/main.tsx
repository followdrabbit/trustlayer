import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./i18n";
import { AppRouter } from "./core/routing/AppRouter";
import { initApp } from "./core/init";
import "./index.css";

const queryClient = new QueryClient();
const root = createRoot(document.getElementById("root")!);

initApp().then(() => {
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
});
