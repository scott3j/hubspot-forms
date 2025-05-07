import { Client } from '@hubspot/api-client';
import { hubspotConfig } from '@/config/hubspot';
import type { SimplePublicObjectInput } from '@hubspot/api-client/lib/codegen/crm/contacts';

const hubspotClient = new Client({ accessToken: hubspotConfig.accessToken });

export const hubspotFormService = {
  getFormById: async (formId: string) => {
    const apiResponse = await hubspotClient.marketing.forms.formsApi.getById(formId, false);
    return apiResponse;
  }
}

export const hubspotContactService = {
  createContact: async (contact: SimplePublicObjectInput) => {
    const apiResponse = await hubspotClient.crm.contacts.basicApi.create(contact);
    return apiResponse;
  }
}

export const hubspotService = {
  ...hubspotFormService,
  ...hubspotContactService
}