import React from 'react';
import { useTedAIStore } from 'utils/tedAIStore';

interface SampleQueryProps {
  onClose?: () => void;
}

export function TedAISampleQueries({ onClose }: SampleQueryProps) {
  const { sendMessage } = useTedAIStore();

  const handleQueryClick = async (query: string) => {
    if (onClose) onClose();
    await sendMessage(query);
  };

  const sampleQueries = [
    {
      category: 'Market Analysis',
      queries: [
        'What is the current market sentiment?',
        'How are tech stocks performing today?',
        'What are the major market movers?'
      ]
    },
    {
      category: 'Options Flow',
      queries: [
        'Show me unusual options activity for AAPL',
        'What does the options flow for NVDA tell us about sentiment?',
        'Are there any significant call sweeps in AMD today?',
        'Analyze the gamma exposure and options positioning in SPY'
      ]
    },
    {
      category: 'Dark Pool',
      queries: [
        'Where are the key dark pool levels for TSLA?',
        'Show dark pool volume clusters for MSFT',
        'Are institutions accumulating or distributing META?',
        'Identify support and resistance from dark pool activity in QQQ'
      ]
    },
    {
      category: 'Combined Analysis',
      queries: [
        'Give me a comprehensive analysis of AAPL options flow and dark pool activity',
        'What is the complete market picture for NVDA including institutional positioning?',
        'Show me both options flow and dark pool data for AMD',
        'Provide a full market analysis of SPY with options and dark pool activity'
      ]
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 w-full max-w-md overflow-auto max-h-[80vh]">
      <h3 className="text-lg font-semibold mb-4">Sample Questions</h3>
      
      {sampleQueries.map((category, i) => (
        <div key={i} className="mb-4">
          <h4 className="text-primary text-sm font-medium mb-2">{category.category}</h4>
          <div className="space-y-2">
            {category.queries.map((query, j) => (
              <button
                key={j}
                className="w-full text-left p-2 rounded-md hover:bg-primary/10 transition-colors text-sm"
                onClick={() => handleQueryClick(query)}
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
