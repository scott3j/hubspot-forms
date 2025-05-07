# HubSpot Forms Integration

This project provides a seamless integration between Next.js and HubSpot forms, allowing for dynamic form rendering, validation, and submission handling. It leverages modern React patterns, TypeScript, and robust form validation to create a powerful form management system.

## Architecture Overview

### Configuration (`/config/hubspot.ts`)

The configuration file manages HubSpot API credentials and form settings:

- `accessToken`: HubSpot API access token
- `portalId`: HubSpot portal identifier
- `formId`: Specific form identifier to be rendered

### HubSpot Service (`/lib/hubspot-service.ts`)

The service layer handles all HubSpot API interactions:

- `hubspotFormService`: Manages form-related operations
  - `getFormById`: Fetches form configuration from HubSpot
- `hubspotContactService`: Handles contact-related operations
  - `createContact`: Creates new contacts in HubSpot

### Form Component (`/components/hubspot-form.tsx`)

The main form component that provides:

- Dynamic form field rendering based on HubSpot configuration
- Form validation using Zod
- Form state management with React Hook Form
- Real-time validation feedback
- Customizable submission handling

## Key Features

### Dynamic Form Rendering

The form component automatically renders fields based on HubSpot's form configuration:

- Supports multiple field types (text, email, select, multiselect, number, multi-line text)
- Handles field groups and nested structures
- Provides customizable field labels and descriptions
- Supports required field validation

### Form Validation

The project uses Zod for schema validation:

- Dynamic schema generation based on form configuration
- Type-safe validation rules
- Custom validation messages
- Support for complex validation rules (email, URLs, numbers)

### React Hook Form Integration

React Hook Form is used for form state management:

- Efficient form state handling
- Built-in performance optimizations
- Seamless integration with Zod validation
- Real-time validation feedback

### HubSpot Integration

The project provides two main server actions:

1. `getHubspotForm`: Fetches form configuration from HubSpot
2. `submitHubspotForm`: Handles form submission and contact creation

## Getting Started

1. Set up environment variables:

```env
HUBSPOT_ACCESS_TOKEN=your_access_token
HUBSPOT_PORTAL_ID=your_portal_id
HUBSPOT_FORM_ID=your_form_id
```

1. Install dependencies:

```bash
pnpm install
```

1. Run the development server:

```bash
pnpm dev
```

## Usage

```tsx
import { HubspotForm } from "@/components/hubspot-form";

export default function Page() {
  return (
    <HubspotForm
      formId="your-form-id"
      onSubmissionData={(data) => {
        console.log("Form submitted:", data);
      }}
      onSubmissionResponse={(response) => {
        console.log("Submission response:", response);
      }}
    />
  );
}
```

## Form Field Types

The component supports various field types:

- Text input
- Email input
- Select dropdown
- Multi-select
- Number input
- Multi-line text
- Checkbox

Each field type includes:

- Custom validation rules
- Required field handling
- Error messages
- Placeholder text
- Field descriptions
