import { useState } from "react";
import AuthForm from "@/components/AuthForm";
import Dashboard from "@/pages/Dashboard";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return <Dashboard />;
};

export default Index;
