export async function generateAICompletion(
  systemPrompt: string,
  userPrompt: string,
  fallbackData: any
): Promise<any> {
  let apiKey = '';
  let apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  let modelName = 'gpt-4o-mini';
  let extraHeaders: Record<string, string> = {};

  // Load Developer custom overrides from localStorage first
  if (typeof window !== 'undefined') {
    const orKey = localStorage.getItem('localradar_dev_openrouter_key');
    const orModel = localStorage.getItem('localradar_dev_openrouter_model') || 'deepseek/deepseek-chat';
    
    if (orKey) {
      apiKey = orKey;
      apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
      modelName = orModel;
      extraHeaders = {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'LocalRadar',
      };
    } else {
      apiKey = localStorage.getItem('localradar_dev_openai_key') || '';
    }
  }

  // Fallback to process.env settings if browser has no keys configured
  if (!apiKey) {
    if (process.env.OPENROUTER_API_KEY) {
      apiKey = process.env.OPENROUTER_API_KEY;
      apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
      modelName = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';
      extraHeaders = {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'LocalRadar',
      };
    } else {
      apiKey = process.env.OPENAI_API_KEY || '';
    }
  }
  
  if (!apiKey || apiKey === 'mock-key') {
    // Simulate API delay for realism in Sandbox Mode
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return fallbackData;
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API responded with status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const textContent = data.choices[0]?.message?.content || '';
    
    if (typeof fallbackData === 'object') {
      try {
        const jsonMatch = textContent.match(/\{[\s\S]*\}/) || textContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(textContent);
      } catch (parseError) {
        console.error('Failed to parse response as JSON, using fallback:', parseError, textContent);
        return fallbackData;
      }
    }
    
    return textContent;
  } catch (error) {
    console.error('AI generation error, using fallback data:', error);
    return fallbackData;
  }
}
