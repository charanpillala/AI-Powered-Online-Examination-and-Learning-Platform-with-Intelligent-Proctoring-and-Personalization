
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-6xl font-bold text-quiz-blue mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! This page doesn't exist</p>
        <p className="text-gray-500 mb-8">
          The page you're looking for (<code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code>) 
          couldn't be found.
        </p>
        <Link to="/dashboard">
          <Button className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
