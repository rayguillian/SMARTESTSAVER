import { apiClient } from '../config/api';

export const openaiService = {
  async getMealSuggestions(preferences) {
    console.log('===== FULL OPENAI SERVICE DEBUG =====');
    console.log('Preferences:', JSON.stringify(preferences, null, 2));

    try {
      const messages = [
        {
          role: 'system', 
          content: `Generate 4 meal suggestions as a JSON array. Each meal must have:
          - name: string
          - description: string
          - ingredients: string[]
          - preparationTime: string
          - difficulty: string

          Preferences: ${JSON.stringify(preferences)}`
        },
        {
          role: 'user',
          content: 'Generate meal suggestions based on my preferences'
        }
      ];

      console.log('===== PREPARED MESSAGES =====');
      console.log(JSON.stringify(messages, null, 2));

      const response = await apiClient.post('/api/openai/chat', { messages });
      
      console.log('===== OPENAI RESPONSE =====');
      console.log(JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error) {
      console.error('===== COMPREHENSIVE OPENAI SERVICE ERROR =====');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Response:', error.response ? JSON.stringify(error.response.data, null, 2) : 'No response data');
      console.error('Error Config:', error.config ? JSON.stringify(error.config, null, 2) : 'No config');
      
      throw error;
    }
  }
};
