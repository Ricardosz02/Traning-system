import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { AddExercise } from "./pages/AddExercise";
import { EditExercise } from "./pages/EditExercise";
import { Users } from "./pages/Users";
import { ResetPassword } from "./pages/ResetPassword";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/add-exercise" element={<AddExercise />} />
        <Route path="/edit-exercise/:id" element={<EditExercise />} />
        <Route path="/users" element={<Users />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
