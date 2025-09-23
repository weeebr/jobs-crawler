"use client";

import { useState, useEffect } from "react";
import { getConfig, setConfig, resetConfig, type UserConfig } from "@/lib/configStore";
import { Header } from "@/app/components/Header";
import { ConfigForm } from "./components/ConfigForm";
import { ConfigActions } from "./components/ConfigActions";

export default function ConfigPage() {
  const [config, setConfigState] = useState<UserConfig>(getConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadCvFromEnv = async () => {
      const currentConfig = getConfig();
      
      // Load CV from .env file if no user CV is set
      if (!currentConfig.cvMarkdown || currentConfig.cvMarkdown.trim() === '') {
        try {
          const response = await fetch('/api/cv/env');
          if (response.ok) {
            const cvData = await response.json();
            if (cvData.markdown && cvData.source === 'env') {
              setConfigState(prev => ({ ...prev, cvMarkdown: cvData.markdown }));
              return;
            }
          }
        } catch (error) {
          console.warn('Failed to load CV from .env:', error);
        }
      }
      
      setConfigState(currentConfig);
    };

    loadCvFromEnv();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const updatedConfig = setConfig(config);
      setConfigState(updatedConfig);
      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultConfig = resetConfig();
    setConfigState(defaultConfig);
    setMessage({ type: 'success', text: 'Configuration reset to defaults' });
  };

  const handleInputChange = (field: keyof UserConfig, value: string) => {
    setConfigState(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header progressLabel={null} onRefetch={() => {}} isPending={false} />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="card-elevated p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration</h1>
            <p className="text-gray-600">
              Customize your location, transportation preferences, and default job search settings.
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <ConfigForm config={config} onInputChange={handleInputChange} />

          <ConfigActions 
            isLoading={isLoading}
            onSave={handleSave}
            onReset={handleReset}
          />
        </div>
      </main>
    </div>
  );
}
