'use server';

/**
 * @fileOverview Extracts themes and emotions from a photo.
 *
 * - analyzePhotoThemes - A function that handles the photo analysis process.
 * - AnalyzePhotoThemesInput - The input type for the analyzePhotoThemes function.
 * - AnalyzePhotoThemesOutput - The return type for the analyzePhotoThemes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePhotoThemesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzePhotoThemesInput = z.infer<typeof AnalyzePhotoThemesInputSchema>;

const AnalyzePhotoThemesOutputSchema = z.object({
  themes: z
    .string()
    .describe('The themes present in the photo, comma separated.'),
  emotions: z
    .string()
    .describe('The emotions evoked by the photo, comma separated.'),
});
export type AnalyzePhotoThemesOutput = z.infer<typeof AnalyzePhotoThemesOutputSchema>;

export async function analyzePhotoThemes(input: AnalyzePhotoThemesInput): Promise<AnalyzePhotoThemesOutput> {
  return analyzePhotoThemesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePhotoThemesPrompt',
  input: {schema: AnalyzePhotoThemesInputSchema},
  output: {schema: AnalyzePhotoThemesOutputSchema},
  prompt: `You are an AI that analyzes photos and extracts themes and emotions.

  Analyze the photo and extract the themes and emotions present in the photo. Respond with comma separated values.

  Photo: {{media url=photoDataUri}}`,
});

const analyzePhotoThemesFlow = ai.defineFlow(
  {
    name: 'analyzePhotoThemesFlow',
    inputSchema: AnalyzePhotoThemesInputSchema,
    outputSchema: AnalyzePhotoThemesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
