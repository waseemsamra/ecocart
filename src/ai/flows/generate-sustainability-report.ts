'use server';
/**
 * @fileOverview Generates a sustainability report based on purchase history.
 *
 * - generateSustainabilityReport - A function that generates a sustainability report.
 * - GenerateSustainabilityReportInput - The input type for the generateSustainabilityReport function.
 * - GenerateSustainabilityReportOutput - The return type for the generateSustainabilityReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSustainabilityReportInputSchema = z.object({
  purchaseHistory: z
    .string()
    .describe(
      'A detailed purchase history, including product names, quantities, and purchase dates.'
    ),
  additionalDetails: z
    .string()
    .optional()
    .describe('Any additional details or preferences for the sustainability report.'),
});

export type GenerateSustainabilityReportInput = z.infer<
  typeof GenerateSustainabilityReportInputSchema
>;

const GenerateSustainabilityReportOutputSchema = z.object({
  reportSummary: z
    .string()
    .describe(
      'A summary of the sustainability report, highlighting key environmental impacts and savings.'
    ),
  detailedAnalysis: z
    .string()
    .describe(
      'A detailed analysis of the purchase history, including estimated carbon footprint, water usage, and waste generation.'
    ),
  recommendations: z
    .string()
    .describe(
      'Recommendations for more sustainable purchasing decisions in the future.'
    ),
});

export type GenerateSustainabilityReportOutput = z.infer<
  typeof GenerateSustainabilityReportOutputSchema
>;

export async function generateSustainabilityReport(
  input: GenerateSustainabilityReportInput
): Promise<GenerateSustainabilityReportOutput> {
  return generateSustainabilityReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSustainabilityReportPrompt',
  input: {schema: GenerateSustainabilityReportInputSchema},
  output: {schema: GenerateSustainabilityReportOutputSchema},
  prompt: `You are an AI sustainability expert who generates detailed and insightful sustainability reports based on user purchase history.

  Analyze the following purchase history and provide a report summary, detailed analysis, and recommendations for more sustainable choices.

  Purchase History: {{{purchaseHistory}}}
  Additional Details: {{{additionalDetails}}}

  Ensure that the report includes:
  - A summary of the overall environmental impact.
  - A detailed breakdown of carbon footprint, water usage, and waste generation associated with the purchases.
  - Practical and actionable recommendations for future purchases.

  Follow the output schema strictly for formatting the report.
  `,
});

const generateSustainabilityReportFlow = ai.defineFlow(
  {
    name: 'generateSustainabilityReportFlow',
    inputSchema: GenerateSustainabilityReportInputSchema,
    outputSchema: GenerateSustainabilityReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
