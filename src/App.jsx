import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Import5S from "./pages/5s/Import5S";
import Results5S from "./pages/5s/Results5S";
import Table5S from "./pages/5s/Table5S";
import ImportGemba from "./pages/gemba/ImportGemba";
import ResultsGemba from "./pages/gemba/ResultsGemba";
import TableGemba from "./pages/gemba/TableGemba";
import "./App.css";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/5s/import" element={<Import5S />} />
            <Route path="/5s/results" element={<Results5S />} />
            <Route path="/5s/table" element={<Table5S />} />
            <Route path="/gemba/import" element={<ImportGemba />} />
            <Route path="/gemba/results" element={<ResultsGemba />} />
            <Route path="/gemba/table" element={<TableGemba />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
