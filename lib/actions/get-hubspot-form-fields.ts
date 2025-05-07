'use server';

import { hubspotService } from '../hubspot-service';

export async function getHubspotForm(formId: string) {
  try {
    const form = await hubspotService.getFormById(formId);
    // Serialize the form data to ensure it's a plain object
    const serializedForm = JSON.parse(JSON.stringify(form));
    return { success: true, data: serializedForm };
  } catch (error) {
    console.error('Error fetching HubSpot form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch form'
    };
  }
} 