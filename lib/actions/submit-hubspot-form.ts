'use server';

import { hubspotConfig } from '@/config/hubspot';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

interface SubmitFormData {
  formId: string;
  fields: Record<string, string | string[]>;
  pageUrl?: string;
  pageName?: string;
  fieldTypes?: Record<string, string>;
}

interface HubspotSubmissionField {
  name: string;
  value: string;
  objectTypeId?: string;
}

// Define field type mappings
const FIELD_TYPE_MAPPINGS: Record<string, string> = {
  email: "0-1",
  firstname: "0-1",
  lastname: "0-1",
  phone: "0-1",
  company: "0-1",
  website: "0-1",
  company_country: "0-1",
  company_employees: "0-1",
  expected_payroll_amount: "0-1",
  domestic_or_international: "0-1",
  message: "0-1"
};

export async function submitHubspotForm(data: SubmitFormData) {
  try {
    const { formId, fields, pageUrl, pageName, fieldTypes = {} } = data;

    // Create the form submission URL - using the correct v3 endpoint
    const url = `https://api.hsforms.com/submissions/v3/integration/submit/${hubspotConfig.portalId}/${formId}`;

    // Get the HubSpot tracking cookie if it exists
    const cookieStore = await cookies();
    const hutk = cookieStore.get('hubspotutk')?.value || undefined;

    // Get the current page URL and IP from headers
    const headersList = await headers();
    const referer = headersList.get('referer') || '';
    const host = headersList.get('host') || '';
    const ipAddress = headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      '0.0.0.0';

    // Log the incoming fields for debugging
    console.log('Submitting form fields:', fields);
    console.log('Field types:', fieldTypes);

    // Prepare the submission data with the correct structure
    const submissionFields: HubspotSubmissionField[] = [];

    // Process each field
    Object.entries(fields).forEach(([name, value]) => {
      // Handle multiple checkbox values
      if (fieldTypes[name] === 'multiple_checkboxes' && Array.isArray(value)) {
        // Add each selected value as a separate field entry
        value.forEach((val) => {
          submissionFields.push({
            name,
            value: val.toString()
          });
        });
      } else {
        // Handle regular fields
        const objectTypeId = FIELD_TYPE_MAPPINGS[name];
        submissionFields.push({
          ...(objectTypeId && { objectTypeId }),
          name,
          value: value?.toString() || ''
        });
      }
    });

    const submissionData = {
      submittedAt: Date.now().toString(),
      fields: submissionFields,
      context: {
        pageUri: pageUrl || referer || `https://${host}`,
        pageName: pageName || 'Form Submission',
        ipAddress,
        ...(hutk && { hutk })
      }
    };

    // Log the submission data for debugging
    console.log('Submission data:', JSON.stringify(submissionData, null, 2));

    // Make the API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hubspotConfig.accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(submissionData)
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('HubSpot API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text,
        url,
        requestData: submissionData
      });
      throw new Error(`Invalid response from HubSpot (${response.status}): ${text.substring(0, 200)}`);
    }

    const responseData = await response.json();

    if (!response.ok) {
      console.error('HubSpot API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        url,
        requestData: submissionData,
        errors: responseData.errors
      });
      throw new Error(responseData.message || `Failed to submit form (${response.status})`);
    }

    return { success: true, data: responseData };
  } catch (error) {
    console.error('Error submitting form to HubSpot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit form'
    };
  }
} 