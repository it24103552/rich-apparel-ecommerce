import { RouterProvider } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { router } from "./router";
import { Loader2 } from "lucide-react";

function App() {
  const authState = useAuth();

  // Show a sleek, premium full-page loader while auth context is hydrating
  if (authState.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white selection:bg-zinc-900 selection:text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center h-16 w-16 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-sm animate-pulse">
            <Loader2 className="h-8 w-8 text-zinc-900 animate-spin" />
          </div>
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-bold tracking-tight text-zinc-950">Loading System</h2>
            <p className="text-sm text-zinc-500 font-medium">Please wait while we set things up...</p>
          </div>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;
