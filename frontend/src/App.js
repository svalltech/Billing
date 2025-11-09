import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Dashboard from "@/pages/Dashboard";
import CreateInvoice from "@/pages/CreateInvoice";
import InvoiceList from "@/pages/InvoiceList";
import InvoiceView from "@/pages/InvoiceView";
import Customers from "@/pages/Customers";
import Businesses from "@/pages/Businesses";
import Products from "@/pages/Products";
import BusinessSettings from "@/pages/BusinessSettings";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create-invoice" element={<CreateInvoice />} />
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoices/:id" element={<InvoiceView />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/businesses" element={<Businesses />} />
              <Route path="/products" element={<Products />} />
              <Route path="/settings" element={<BusinessSettings />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
