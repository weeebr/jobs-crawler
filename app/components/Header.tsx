"use client";

import { useState } from "react";

import { AppLogo } from "./AppLogo";

interface HeaderProps {
  progressLabel?: string | null;
  onRefetch: () => void;
  isPending: boolean;
}

export function Header({ progressLabel, onRefetch, isPending }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Logo and Branding */}
          <AppLogo />

          {/* Mobile Actions */}
          <div className="flex items-center space-x-2 sm:hidden">
            {progressLabel && (
              <span className="text-xs font-medium text-blue-600 whitespace-nowrap">
                {progressLabel}
              </span>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center space-x-2">
            {progressLabel && (
              <span className="text-xs font-medium text-blue-600 whitespace-nowrap">
                {progressLabel}
              </span>
            )}
            <a
              href="/config"
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Settings
            </a>
            <button
              onClick={() => void onRefetch()}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Refetching..." : "Refresh Data"}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden mt-1.5 pt-1.5 border-t border-gray-200">
            <div className="space-y-0.5">
              <a
                href="/config"
                className="block w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Settings
              </a>
              <button
                onClick={() => {
                  void onRefetch();
                  setIsMobileMenuOpen(false);
                }}
                disabled={isPending}
                className="block w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                {isPending ? "Refetching..." : "Refresh Data"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
