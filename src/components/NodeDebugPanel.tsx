import React, { useState, useEffect, ReactNode } from 'react';
import { ClassicPreset } from 'rete';
import { NodeExecutionResult } from '../types/node.types';

// Define a local type for the node
type NodeType = {
  id: string;
  label?: string;
  data: Record<string, unknown>;
  position: [number, number];
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
};

interface NodeDebugPanelProps {
  node: NodeType | null;
  executionState: NodeExecutionResult | null;
  onClose: () => void;
}

const STATUS_COLORS = {
  pending: 'bg-gray-200 text-gray-800',
  running: 'bg-blue-200 text-blue-800',
  success: 'bg-green-200 text-green-800',
  error: 'bg-red-200 text-red-800',
  skipped: 'bg-yellow-200 text-yellow-800',
};

const NodeDebugPanel: React.FC<NodeDebugPanelProps> = ({ node, executionState, onClose }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'input' | 'output' | 'state'>('logs');
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!node) return null;

  const renderStatusBadge = () => {
    const status = executionState?.status || 'pending';
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-200';
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const renderLogs = () => {
    const logs = executionState?.logs;
    
    return (
      <div className="space-y-1 text-xs font-mono">
        {logs && logs.length > 0 ? (
          logs.map((log, i) => {
            // Handle different log types
            let logContent: ReactNode;
            
            if (typeof log === 'string' || typeof log === 'number' || typeof log === 'boolean') {
              logContent = String(log);
            } else if (log === null) {
              logContent = 'null';
            } else if (log === undefined) {
              logContent = 'undefined';
            } else if (log instanceof Error) {
              logContent = log.message || 'Error occurred';
            } else if (typeof log === 'object') {
              try {
                logContent = JSON.stringify(log, null, 2);
              } catch (e) {
                logContent = '[Unserializable value]';
              }
            } else {
              logContent = String(log);
            }
            
            return (
              <div key={i} className="p-1 border-b border-gray-100">
                {logContent}
              </div>
            );
          })
        ) : (
          <div className="text-gray-400 italic">No logs available</div>
        )}
      </div>
    );
  };

  const renderInputs = () => {
    const inputs = executionState?.inputs;
    
    if (!inputs || typeof inputs !== 'object') {
      return <div className="text-gray-400 italic">No input data available</div>;
    }
    
    const inputEntries = Object.entries(inputs);
    
    return (
      <div className="space-y-2">
        {inputEntries.length > 0 ? (
          inputEntries.map(([key, value]) => {
            let displayValue: ReactNode;
            
            try {
              displayValue = typeof value === 'object' && value !== null
                ? <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                : String(value);
            } catch (e) {
              displayValue = '[Unserializable value]';
            }
            
            return (
              <div key={key} className="border-b border-gray-100 pb-2">
                <div className="font-semibold text-sm">{key}</div>
                <div className="text-xs text-gray-700 break-words">
                  {displayValue}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-400 italic">No input data available</div>
        )}
      </div>
    );
  };

  const renderOutputs = () => {
    const outputs = executionState?.outputs || executionState?.output;
    
    if (!outputs || typeof outputs !== 'object') {
      return <div className="text-gray-400 italic">No output data available</div>;
    }
    
    const outputEntries = Object.entries(outputs);
    
    return (
      <div className="space-y-2">
        {outputEntries.length > 0 ? (
          outputEntries.map(([key, value]) => {
            let displayValue: ReactNode;
            
            try {
              displayValue = typeof value === 'object' && value !== null
                ? <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                : String(value);
            } catch (e) {
              displayValue = '[Unserializable value]';
            }
            
            return (
              <div key={key} className="border-b border-gray-100 pb-2">
                <div className="font-semibold text-sm">{key}</div>
                <div className="text-xs text-gray-700 break-words">
                  {displayValue}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-400 italic">No output data available</div>
        )}
      </div>
    );
  };

  const renderState = () => {
    if (!executionState) {
      return <div className="text-gray-400 italic">No execution data available</div>;
    }
    
    const duration = executionState.endTime && executionState.startTime
      ? `${executionState.endTime - executionState.startTime}ms`
      : 'N/A';
    
    const status = executionState.status ? String(executionState.status) : 'unknown';
    
    return (
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500">Status</div>
          <div className="font-medium">{status}</div>
        </div>
        
        <div>
          <div className="text-xs text-gray-500">Duration</div>
          <div className="font-mono">{duration}</div>
        </div>
        
        {executionState.error && (
          <div>
            <div className="text-xs text-gray-500">Error</div>
            <div className="text-red-600 text-sm break-words">
              {typeof executionState.error === 'string' 
                ? executionState.error 
                : JSON.stringify(executionState.error)}
            </div>
          </div>
        )}
        
        {node && (
          <div>
            <div className="text-xs text-gray-500">Node ID</div>
            <div className="font-mono text-xs break-all">{node.id}</div>
          </div>
        )}
      </div>
    );
  };

  // Safely get the node name from node data
  const nodeName = node?.label || (node?.data?.name as string) || 'Node';

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div 
        className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-sm">
            {nodeName}
          </h3>
          {renderStatusBadge()}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3 max-h-64 overflow-y-auto">
          <div className="flex border-b border-gray-200 mb-3">
            <button
              className={`px-3 py-1 text-xs font-medium ${activeTab === 'logs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium ${activeTab === 'input' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('input')}
            >
              Input
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium ${activeTab === 'output' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('output')}
            >
              Output
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium ${activeTab === 'state' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('state')}
            >
              State
            </button>
          </div>
          
          <div className="text-sm">
            {activeTab === 'logs' && renderLogs()}
            {activeTab === 'input' && renderInputs()}
            {activeTab === 'output' && renderOutputs()}
            {activeTab === 'state' && renderState()}
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeDebugPanel;
