import React, { useState, useEffect } from 'react';
import { Node } from 'rete';
import { NodeExecutionState } from '../types/node.types';

interface NodeDebugPanelProps {
  node: Node | null;
  executionState: NodeExecutionState | null;
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

  const renderLogs = () => (
    <div className="space-y-1 text-xs font-mono">
      {executionState?.result?.logs?.length ? (
        executionState.result.logs.map((log, i) => (
          <div key={i} className="p-1 border-b border-gray-100">
            {log}
          </div>
        ))
      ) : (
        <div className="text-gray-500 italic">No logs available</div>
      )}
    </div>
  );

  const renderInputs = () => {
    const inputs = executionState?.result?.inputs || {};
    
    return (
      <div className="space-y-2">
        {Object.keys(inputs).length > 0 ? (
          Object.entries(inputs).map(([key, value]) => (
            <div key={key} className="border-b border-gray-100 pb-2">
              <div className="font-semibold text-sm">{key}</div>
              <div className="text-xs text-gray-700 break-words">
                {typeof value === 'object' 
                  ? JSON.stringify(value, null, 2) 
                  : String(value)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">No input data available</div>
        )}
      </div>
    );
  };

  const renderOutputs = () => {
    const outputs = executionState?.result?.output || {};
    
    return (
      <div className="space-y-2">
        {Object.keys(outputs).length > 0 ? (
          Object.entries(outputs).map(([key, value]) => (
            <div key={key} className="border-b border-gray-100 pb-2">
              <div className="font-semibold text-sm">{key}</div>
              <div className="text-xs text-gray-700 break-words">
                {typeof value === 'object' 
                  ? JSON.stringify(value, null, 2) 
                  : String(value)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">No output data available</div>
        )}
      </div>
    );
  };

  const renderState = () => {
    if (!executionState) return <div className="text-gray-500 italic">No execution data available</div>;
    
    const duration = executionState.endTime && executionState.startTime
      ? `${executionState.endTime - executionState.startTime}ms`
      : 'N/A';
    
    return (
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500">Status</div>
          <div className="font-medium">{executionState.status}</div>
        </div>
        
        <div>
          <div className="text-xs text-gray-500">Duration</div>
          <div className="font-mono">{duration}</div>
        </div>
        
        {executionState.error && (
          <div>
            <div className="text-xs text-gray-500">Error</div>
            <div className="text-red-600 text-sm break-words">{executionState.error.message}</div>
          </div>
        )}
        
        <div>
          <div className="text-xs text-gray-500">Node ID</div>
          <div className="font-mono text-xs break-all">{node.id}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div 
        className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-sm">
            {node.data.name || 'Node'}
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
