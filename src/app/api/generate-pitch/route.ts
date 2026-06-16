import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { 
      systemPrompt, 
      userPrompt, 
      fallbackData, 
      clientApiKey, 
      clientModel 
    } = await request.json();

    const response = await generateAICompletion(
      systemPrompt,
      userPrompt,
      fallbackData,
      clientApiKey,
      clientModel
    );

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error: any) {
    console.error('Error in generate-pitch API:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Error executing AI generation'
    }, { status: 500 });
  }
}
