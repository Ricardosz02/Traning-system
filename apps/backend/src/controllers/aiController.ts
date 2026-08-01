import type { Request, Response } from 'express';
import { generateTrainingPlanFromAI } from '../services/geminiService.js';

export const generatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const aiResponse = await generateTrainingPlanFromAI({});

    res.status(200).json({
      status: 'success',
      data: aiResponse
    });
  } catch (error) {
    console.error('Blad w kontrolerze AI:', error);
    res.status(500).json({
      status: 'error',
      message: 'Blad podczas generowania odpowiedzi przez AI.'
    });
  }
};