import { HubspotFormContainer } from "@/components/hubspot-form-container";
import { hubspotConfig } from "@/config/hubspot";

const formId = hubspotConfig.formId;

if (!formId) {
  throw new Error("HUBSPOT_FORM_ID environment variable is not set");
}

export default function Page() {
  return <HubspotFormContainer formId={formId} />;
}
