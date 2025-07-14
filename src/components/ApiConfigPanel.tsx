import React, { useState, useEffect } from 'react';
import { NodeEditor } from 'rete';
import { NodeScheme } from '../core/BaseNode';
import '../../styles/api-config-panel.css';

interface ApiKey {
  service: string;
  key: string;
  secret?: string;
  token?: string;
  isConfigured: boolean;
}

interface ApiConfigPanelProps {
  editor: NodeEditor<NodeScheme>;
}

export const ApiConfigPanel: React.FC<ApiConfigPanelProps> = ({ editor }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { service: 'reddit', key: '', isConfigured: false },
    { service: 'twitter', key: '', secret: '', token: '', isConfigured: false },
    { service: 'linkedin', key: '', secret: '', isConfigured: false },
    { service: 'discord', key: '', isConfigured: false },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('reddit');

  // Load API keys from localStorage on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('rete-demo-api-keys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(parsedKeys);
      } catch (e) {
        console.error('Failed to parse saved API keys', e);
      }
    }
  }, []);

  // Save API keys to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('rete-demo-api-keys', JSON.stringify(apiKeys));
    
    // Broadcast API key changes to nodes
    editor.getNodes().forEach(node => {
      if ('onApiKeyUpdate' in node) {
        // Access node name safely with type assertion
        const nodeName = (node as any).name || '';
        const service = nodeName.toString().toLowerCase().split(' ')[0];
        const apiKey = apiKeys.find(k => k.service === service);
        if (apiKey) {
          (node as any).onApiKeyUpdate?.(apiKey);
        }
      }
    });
  }, [apiKeys, editor]);

  const handleKeyChange = (service: string, field: string, value: string) => {
    setApiKeys(prev => 
      prev.map(key => 
        key.service === service 
          ? { ...key, [field]: value, isConfigured: field === 'key' ? !!value : key.isConfigured } 
          : key
      )
    );
  };

  const handleSaveKeys = () => {
    setIsOpen(false);
    // The keys are automatically saved via the useEffect
  };

  return (
    <div className="api-config-panel">
      {!isOpen ? (
        <button 
          className="api-config-button"
          onClick={() => setIsOpen(true)}
        >
          Configure API Keys
        </button>
      ) : (
        <div className="api-config-modal">

          <div className="api-config-header">
            <h2>API Configuration</h2>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="api-config-tabs">
            {apiKeys.map(key => (
              <button
                key={key.service}
                className={`api-config-tab ${activeTab === key.service ? 'active' : ''}`}
                onClick={() => setActiveTab(key.service)}
              >
                {key.service.charAt(0).toUpperCase() + key.service.slice(1)}
                {key.isConfigured && ' ✓'}
              </button>
            ))}
          </div>
          
          <div className="api-config-content">
            {apiKeys.map(key => (
              <div 
                key={key.service}
                className={`api-config-tab-content ${activeTab === key.service ? 'active' : ''}`}
              >
                <h3>{key.service.charAt(0).toUpperCase() + key.service.slice(1)} API Configuration</h3>
                
                <div className="api-config-form-group">
                  <label 
                    htmlFor={`${key.service}-key`}
                    className="api-config-form-label"
                  >
                    API Key
                  </label>
                  <input
                    id={`${key.service}-key`}
                    type="password"
                    value={key.key}
                    onChange={(e) => handleKeyChange(key.service, 'key', e.target.value)}
                    className="api-config-form-input"
                    placeholder={`Enter your ${key.service} API key`}
                  />
                </div>
                
                {key.service === 'twitter' || key.service === 'linkedin' ? (
                  <div className="api-config-form-group">
                    <label 
                      htmlFor={`${key.service}-secret`}
                      className="api-config-form-label"
                    >
                      API Secret
                    </label>
                    <input
                      id={`${key.service}-secret`}
                      type="password"
                      value={key.secret || ''}
                      onChange={(e) => handleKeyChange(key.service, 'secret', e.target.value)}
                      className="api-config-form-input"
                      placeholder={`Enter your ${key.service} API secret`}
                    />
                  </div>
                ) : null}
                
                {key.service === 'twitter' ? (
                  <div className="api-config-form-group">
                    <label 
                      htmlFor="twitter-token"
                      className="api-config-form-label"
                    >
                      Bearer Token
                    </label>
                    <input
                      id="twitter-token"
                      type="password"
                      value={key.token || ''}
                      onChange={(e) => handleKeyChange(key.service, 'token', e.target.value)}
                      className="api-config-form-input"
                      placeholder="Enter your Twitter bearer token"
                    />
                  </div>
                ) : null}
                
                {key.service === 'discord' ? (
                  <div className="api-config-discord-instructions">
                    <p>For Discord, you need to create a webhook URL in your Discord server settings.</p>
                    <p>The webhook URL should be configured directly in the Discord Webhook node.</p>
                  </div>
                ) : null}
                
                <div className="api-config-instructions">
                  <h4>How to get {key.service.charAt(0).toUpperCase() + key.service.slice(1)} API credentials:</h4>
                  {key.service === 'reddit' && (
                    <ol>
                      <li>Go to <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer">Reddit Apps</a></li>
                      <li>Click "Create App" or "Create Another App"</li>
                      <li>Fill in the required information</li>
                      <li>Set the app type to "Script"</li>
                      <li>After creation, you'll receive a client ID and client secret</li>
                    </ol>
                  )}
                  {key.service === 'twitter' && (
                    <ol>
                      <li>Go to <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer">Twitter Developer Portal</a></li>
                      <li>Create a project and an app within that project</li>
                      <li>Navigate to the "Keys and Tokens" tab</li>
                      <li>Generate API Key, API Secret, and Bearer Token</li>
                    </ol>
                  )}
                  {key.service === 'linkedin' && (
                    <ol>
                      <li>Go to <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer">LinkedIn Developer Portal</a></li>
                      <li>Create a new app</li>
                      <li>Fill in the required information</li>
                      <li>Once approved, you'll receive a Client ID and Client Secret</li>
                    </ol>
                  )}
                  {key.service === 'discord' && (
                    <ol>
                      <li>Open your Discord server settings</li>
                      <li>Go to "Integrations" {'>'} "Webhooks"</li>
                      <li>Click "New Webhook"</li>
                      <li>Configure the webhook name and channel</li>
                      <li>Copy the webhook URL to use in the Discord Webhook node</li>
                    </ol>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="api-config-footer"
          >
            <button
              onClick={handleSaveKeys}
              className="api-config-save-button"
            >
              Save and Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiConfigPanel;
