import { Goal, Task, UserSettings } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface AITaskResponse {
  tasks: {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedMinutes: number;
    daysFromNow: number;
  }[];
}

function isLocalModel(baseUrl: string): boolean {
  return baseUrl.includes('localhost') ||
         baseUrl.includes('127.0.0.1') ||
         baseUrl.includes('172.') ||
         baseUrl.includes('192.168.') ||
         baseUrl.includes('10.');
}

export async function generateTasksForGoal(
  goal: Goal,
  settings: UserSettings,
  existingTasks: Task[]
): Promise<Task[]> {
  const isLocal = isLocalModel(settings.openaiBaseUrl);

  // Only require API key for non-local models
  if (!isLocal && !settings.openaiApiKey) {
    throw new Error('API key is required for remote AI services. Add it in Settings or use a local model.');
  }

  const completedCount = existingTasks.filter(t => t.goalId === goal.id && t.status === 'completed').length;

  const prompt = `You are a productivity assistant. The user has a goal they want to achieve.

Goal: "${goal.title}"
Description: "${goal.description}"
${goal.targetDate ? `Target completion date: ${goal.targetDate}` : 'No specific deadline'}
Tasks already completed for this goal: ${completedCount}

Generate ${settings.dailyTaskCount * 7} specific, actionable daily tasks that will help achieve this goal over the next week or so. Each task should:
1. Be completable in one day
2. Be specific and actionable (not vague)
3. Build progressively towards the goal
4. Account for progress already made (${completedCount} tasks completed)

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "tasks": [
    {
      "title": "Task title here",
      "description": "Detailed description of what to do",
      "difficulty": "easy",
      "estimatedMinutes": 30,
      "daysFromNow": 0
    }
  ]
}

Where difficulty is one of: "easy", "medium", or "hard"
And daysFromNow is 0 for today, 1 for tomorrow, etc.`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // Only add auth header if we have an API key
  if (settings.openaiApiKey) {
    headers['Authorization'] = `Bearer ${settings.openaiApiKey}`;
  }

  // Build request body - don't use response_format for local models as many don't support it
  const requestBody: Record<string, unknown> = {
    model: settings.modelName,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  };

  // Only add response_format for OpenAI API (not local models)
  if (!isLocal) {
    requestBody.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${settings.openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI request failed: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from AI');
  }

  // Try to extract JSON from the response (some models add extra text)
  let jsonContent = content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonContent = jsonMatch[0];
  }

  let parsed: AITaskResponse;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${content.substring(0, 200)}`);
  }

  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error('AI response missing tasks array');
  }

  const today = new Date();

  return parsed.tasks.map(task => {
    const scheduledDate = new Date(today);
    scheduledDate.setDate(scheduledDate.getDate() + (task.daysFromNow || 0));

    return {
      id: uuidv4(),
      goalId: goal.id,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      status: 'pending' as const,
      difficulty: task.difficulty || 'medium',
      estimatedMinutes: task.estimatedMinutes || 30
    };
  });
}

export async function testAIConnection(settings: UserSettings): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (settings.openaiApiKey) {
      headers['Authorization'] = `Bearer ${settings.openaiApiKey}`;
    }

    const response = await fetch(`${settings.openaiBaseUrl}/models`, { headers });
    return response.ok;
  } catch {
    return false;
  }
}

