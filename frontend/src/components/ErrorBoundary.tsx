import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-red-500/20 rounded-xl m-4 text-center">
          <AlertTriangle size={32} className="text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">Workspace Rendering Error</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            A critical error occurred while rendering this workspace region. 
            The system has degraded gracefully.
          </p>
          <div className="bg-black/50 text-red-400 font-mono text-[10px] p-3 rounded text-left w-full max-w-xl overflow-auto mb-6">
            {this.state.error?.message || "Unknown error"}
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-colors border border-slate-700"
          >
            <RefreshCcw size={16} />
            Attempt Recovery
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
