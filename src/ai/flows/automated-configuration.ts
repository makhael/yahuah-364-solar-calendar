// src/ai/flows/automated-configuration.ts
'use server';

/**
 * @fileOverview AI-powered environment configuration tool.
 *
 * This file defines a Genkit flow that uses AI to automatically configure
 * environment settings based on user-specified project requirements.
 *
 * @interface AutoConfigurationInput - The input for the autoConfiguration function.
 * @interface AutoConfigurationOutput - The output of the autoConfiguration function.
 * @function autoConfiguration - Configures the environment settings based on project requirements.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AutoConfigurationInputSchema = z.object({
  projectRequirements: z
    .string()
    .describe(
      'A detailed description of the project requirements, including preferred tools, specific preferences, and any other relevant configuration details.'
    ),
});

export type AutoConfigurationInput = z.infer<typeof AutoConfigurationInputSchema>;

const AutoConfigurationOutputSchema = z.object({
  configurationDetails: z
    .string()
    .describe(
      'A comprehensive configuration guide detailing how to set up the environment based on the provided project requirements.'
    ),
});

export type AutoConfigurationOutput = z.infer<typeof AutoConfigurationOutputSchema>;

export async function autoConfiguration(input: AutoConfigurationInput): Promise<AutoConfigurationOutput> {
  return autoConfigurationFlow(input);
}

const autoConfigurationPrompt = ai.definePrompt({
  name: 'autoConfigurationPrompt',
  input: {schema: AutoConfigurationInputSchema},
  output: {schema: AutoConfigurationOutputSchema},
  prompt: `You are an AI environment configuration expert. Based on the provided project requirements, you will generate a detailed configuration guide.

Project Requirements: {{{projectRequirements}}}

Configuration Guide:`,
});

const autoConfigurationFlow = ai.defineFlow(
  {
    name: 'autoConfigurationFlow',
    inputSchema: AutoConfigurationInputSchema,
    outputSchema: AutoConfigurationOutputSchema,
  },
  async input => {
    const {output} = await autoConfigurationPrompt(input);
    return output!;
  }
);
