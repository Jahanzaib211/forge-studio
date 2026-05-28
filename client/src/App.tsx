import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProviderMonitor from "./pages/ProviderMonitor";
import RequestHistory from "./pages/RequestHistory";
import AdminPanel from "./pages/AdminPanel";
import SystemHealth from "./pages/SystemHealth";
import ModelManager from "./pages/ModelManager";
import ModelExplorer from "./pages/ModelExplorer";
import InferenceLab from "./pages/InferenceLab";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/providers"} component={ProviderMonitor} />
      <Route path={"/requests"} component={RequestHistory} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/health"} component={SystemHealth} />
      <Route path={"/models"} component={ModelManager} />
      <Route path={"/explorer"} component={ModelExplorer} />
      <Route path={"/inference"} component={InferenceLab} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
