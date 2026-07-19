import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdmin from "./login_admin";
import LoginUsers from "./login_users";
import DashboardIT from "./dashboard_it";
import DashboardMarketing from "./dashboard_marketing";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<LoginUsers />} />
        <Route path="/admin"     element={<LoginAdmin />} />
        <Route path="/dashboard_it" element={<DashboardIT />} />
        <Route path="/dashboard_marketing" element={<DashboardMarketing />}/>
      </Routes>
    </BrowserRouter>
  );
}