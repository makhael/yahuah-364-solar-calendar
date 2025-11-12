"use server";

import { autoConfiguration } from "@/ai/flows/automated-configuration";
import { z } from "zod";

const formSchema = z.object({
  projectRequirements: z.string().min(10, {
    message: "Requirements must be at least 10 characters.",
  }),
});

export async function generateConfig(prevState: any, formData: FormData) {
  const validatedFields = formSchema.safeParse({
    projectRequirements: formData.get('projectRequirements'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid input.',
      data: null,
    };
  }

  try {
    const result = await autoConfiguration({ 
      projectRequirements: validatedFields.data.projectRequirements 
    });
    return {
      message: 'Configuration generated successfully.',
      data: result.configurationDetails,
      errors: null,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'An unexpected error occurred. Please try again later.',
      data: null,
      errors: {},
    };
  }
}
