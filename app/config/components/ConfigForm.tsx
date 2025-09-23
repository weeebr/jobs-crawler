"use client";

import { type UserConfig } from "@/lib/configStore";

interface ConfigFormProps {
  config: UserConfig;
  onInputChange: (field: keyof UserConfig, value: string) => void;
}

export function ConfigForm({ config, onInputChange }: ConfigFormProps) {
  return (
    <div className="space-y-6">
      {/* Location Setting */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={config.location}
          onChange={(e) => onInputChange('location', e.target.value)}
          placeholder="e.g., Zurich, Switzerland"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Used for Google Maps search and location-based job filtering
        </p>
      </div>

      {/* Transportation Setting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transportation Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="transportation"
              value="public_transport"
              checked={config.transportation === 'public_transport'}
              onChange={(e) => onInputChange('transportation', e.target.value as 'public_transport')}
              className="mr-3"
            />
            <span className="text-sm text-gray-700">Public Transport</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="transportation"
              value="car"
              checked={config.transportation === 'car'}
              onChange={(e) => onInputChange('transportation', e.target.value as 'car')}
              className="mr-3"
            />
            <span className="text-sm text-gray-700">Car</span>
          </label>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Affects commute time calculations and job location preferences
        </p>
      </div>

      {/* Default Job Search URL */}
      <div>
        <label htmlFor="defaultJobSearchUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Default Job Search URL
        </label>
        <input
          id="defaultJobSearchUrl"
          type="url"
          value={config.defaultJobSearchUrl}
          onChange={(e) => onInputChange('defaultJobSearchUrl', e.target.value)}
          placeholder="https://www.jobs.ch/en/vacancies/?term=frontend%20developer"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          This URL will be used as the default when starting a new job search
        </p>
      </div>

      {/* OpenAI API Key */}
      <div>
        <label htmlFor="openaiApiKey" className="block text-sm font-medium text-gray-700 mb-2">
          OpenAI API Key
        </label>
        <input
          id="openaiApiKey"
          type="password"
          value={config.openaiApiKey}
          onChange={(e) => onInputChange('openaiApiKey', e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Your OpenAI API key for AI-powered job analysis and recommendations
        </p>
      </div>

      {/* CV Markdown */}
      <div>
        <label htmlFor="cvMarkdown" className="block text-sm font-medium text-gray-700 mb-2">
          CV Markdown
        </label>
        <textarea
          id="cvMarkdown"
          value={config.cvMarkdown}
          onChange={(e) => onInputChange('cvMarkdown', e.target.value)}
          placeholder="Paste your CV in Markdown format here..."
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          Your CV in Markdown format. This will be used for job matching and analysis. If empty, the default CV from the system will be used.
        </p>
      </div>
    </div>
  );
}
