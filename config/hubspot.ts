
export const hubspotConfig = {
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN || '',
  portalId: process.env.HUBSPOT_PORTAL_ID || '',
  formId: process.env.HUBSPOT_FORM_ID || '',
} as const;


if (!hubspotConfig.accessToken || !hubspotConfig.portalId || !hubspotConfig.formId) {
  throw new Error('HubSpot configuration is missing required values');
}


