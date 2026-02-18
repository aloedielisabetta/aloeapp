import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from '../supabase';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        window.location.reload();
    };

    private handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = '/login';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-red-100 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2">Qualcosa è andato storto</h2>
                        <p className="text-sm text-slate-500 mb-6 bg-slate-50 p-3 rounded-xl font-mono text-left overflow-auto text-xs max-h-32">
                            {this.state.error?.message || 'Errore sconosciuto'}
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                            >
                                <RefreshCw size={18} /> Riprova
                            </button>

                            <button
                                onClick={this.handleLogout}
                                className="w-full bg-white text-red-500 border border-red-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={18} /> Disconnetti e Resetta
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
