'use server';

import { generateSustainabilityReport } from '@/ai/flows/generate-sustainability-report';
import { z } from 'zod';
import type { GenerateSustainabilityReportOutput } from '@/ai/flows/generate-sustainability-report';

const formSchema = z.object({
  purchaseHistory: z.string().min(20, 'Please enter a more detailed purchase history for an accurate report.'),
});

interface ActionState {
  message: string;
  errors?: {
    purchaseHistory?: string[];
  } | null;
  report?: GenerateSustainabilityReportOutput | null;
}

export async function getSustainabilityReport(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = formSchema.safeParse({
    purchaseHistory: formData.get('purchaseHistory'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
      report: null,
    };
  }

  try {
    const report = await generateSustainabilityReport({
      purchaseHistory: validatedFields.data.purchaseHistory,
    });
    return { message: 'success', report, errors: null };
  } catch (e) {
    console.error(e);
    return { message: 'An error occurred while generating the report.', report: null, errors: null };
  }
}
