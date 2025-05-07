"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getHubspotForm } from "@/lib/actions/get-hubspot-form-fields";
import { submitHubspotForm } from "@/lib/actions/submit-hubspot-form";
import { Checkbox } from "@/components/ui/checkbox";

// Define types for our dynamic form configuration
interface FormFieldConfig {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "select"
    | "multiselect"
    | "number"
    | "multi_line_text";
  placeholder?: string;
  description?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{
    label: string;
    value: string;
  }>;
}

interface FormConfig {
  name: string;
  fields: FormFieldConfig[];
}

// Define types for HubSpot form data
interface HubspotField {
  name: string;
  label: string;
  fieldType: string;
  required: boolean;
  description?: string;
  placeholder?: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
}

interface HubspotFieldGroup {
  fields: HubspotField[];
}

interface HubspotFormData {
  name: string;
  fieldGroups: HubspotFieldGroup[];
}

// Generate Zod schema dynamically from form configuration
function generateZodSchema(config: FormConfig) {
  const schema: Record<string, z.ZodType<string | string[]>> = {};

  config.fields.forEach((field) => {
    // Using ZodTypeAny here because the schema can be transformed into different types
    // during validation (string, array, optional, etc.)
    let fieldSchema: z.ZodTypeAny;

    // Base schema based on field type
    switch (field.type) {
      case "multiselect":
        fieldSchema = z.array(z.string());
        break;
      case "email":
        fieldSchema = z.string().email({
          message: "Please enter a valid email address.",
        });
        break;
      case "number":
        fieldSchema = z.string().transform((val) => {
          const num = Number(val);
          return isNaN(num) ? val : num;
        });
        break;
      case "multi_line_text":
        fieldSchema = z.string().min(1, {
          message: "Please enter your message.",
        });
        break;
      default:
        fieldSchema = z.string();
    }

    // Add required validation if the field is required
    if (field.required) {
      fieldSchema = (fieldSchema as z.ZodString).min(1, {
        message: `${field.label} is required.`,
      });
    } else {
      fieldSchema = fieldSchema.optional();
    }

    // Add type-specific validation
    if (field.type === "email") {
      fieldSchema = (fieldSchema as z.ZodString).email({
        message: "Please enter a valid email address.",
      });
    }

    // Add validation for number fields
    if (field.type === "number") {
      fieldSchema = fieldSchema.refine(
        (val: string | number) => !isNaN(Number(val)),
        {
          message: "Please enter a valid number.",
        }
      );
    }

    // Add validation for website URL if it's the website field
    if (field.name === "website") {
      fieldSchema = fieldSchema.refine(
        (val: string) => {
          if (!val) return true; // Optional field
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        },
        {
          message: "Please enter a valid URL.",
        }
      );
    }

    schema[field.name] = fieldSchema;
  });

  return z.object(schema);
}

// Convert HubSpot form data to our form configuration
function convertHubspotFormToConfig(hubspotForm: HubspotFormData): FormConfig {
  const fields: FormFieldConfig[] = [];

  hubspotForm.fieldGroups.forEach((group: HubspotFieldGroup) => {
    group.fields.forEach((field: HubspotField) => {
      const fieldConfig: FormFieldConfig = {
        name: field.name,
        label: field.label,
        type: "text", // default type
        required: field.required,
        description: field.description,
        placeholder: field.placeholder,
      };

      // Map HubSpot field types to our form field types
      switch (field.fieldType) {
        case "email":
          fieldConfig.type = "email";
          break;
        case "dropdown":
          fieldConfig.type = "select";
          fieldConfig.options = field.options?.map((opt) => ({
            label: opt.label,
            value: opt.value,
          }));
          break;
        case "multiple_checkboxes":
          fieldConfig.type = "multiselect";
          fieldConfig.options = field.options?.map((opt) => ({
            label: opt.label,
            value: opt.value,
          }));
          break;
        case "number":
          fieldConfig.type = "number";
          break;
        case "multi_line_text":
          fieldConfig.type = "text";
          break;
        default:
          // Check if the field name contains 'email' to handle special cases
          if (field.name.toLowerCase().includes("email")) {
            fieldConfig.type = "email";
          } else {
            fieldConfig.type = "text";
          }
      }

      fields.push(fieldConfig);
    });
  });

  return {
    name: hubspotForm.name,
    fields,
  };
}

interface HubspotFormProps {
  formId: string;
  onSubmissionData?: (data: {
    formId: string;
    fields: Record<string, string>;
    pageUrl?: string;
    pageName?: string;
  }) => void;
  onSubmissionResponse?: (response: {
    success: boolean;
    data?: {
      inlineMessage?: string;
      redirectUrl?: string;
      status: string;
      correlationId?: string;
      [key: string]: unknown;
    };
    error?: string;
  }) => void;
}

// Define a type for our form values
type FormValues = Record<string, string | string[]>;

export function HubspotForm({
  formId,
  onSubmissionData,
  onSubmissionResponse,
}: HubspotFormProps) {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with a basic schema that accepts any string values
  const form = useForm<FormValues>({
    resolver: formConfig
      ? zodResolver(generateZodSchema(formConfig))
      : undefined,
    defaultValues: {},
  });

  useEffect(() => {
    async function fetchForm() {
      try {
        console.log("Fetching form with ID:", formId);
        const result = await getHubspotForm(formId);
        console.log("Form fetch result:", result);

        if (result.success && result.data) {
          const config = convertHubspotFormToConfig(result.data);
          setFormConfig(config);

          // Update form with new values
          const defaultValues = config.fields.reduce((acc, field) => {
            acc[field.name] = field.type === "multiselect" ? [] : "";
            return acc;
          }, {} as FormValues);

          // Reset form with new values and schema
          form.reset(defaultValues);
        } else {
          console.error("Form fetch failed:", result.error);
          setError(result.error || "Failed to fetch form");
        }
      } catch (err) {
        console.error("Error fetching form:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch form");
      } finally {
        setLoading(false);
      }
    }

    fetchForm();
  }, [formId, form]);

  // Update form resolver when formConfig changes
  useEffect(() => {
    if (formConfig) {
      form.clearErrors();
      if (form.formState.isDirty) {
        form.reset(form.getValues());
      }
    }
  }, [formConfig, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Convert form values to HubSpot format
    const hubspotFields: Record<string, string | string[]> = {};
    const fieldTypes: Record<string, string> = {};

    // Map field values and types
    formConfig?.fields.forEach((field) => {
      const value = values[field.name];
      if (value !== undefined) {
        // For multiselect fields, ensure we keep the array format
        if (field.type === "multiselect") {
          // Ensure we're working with an array and each value is sent separately
          const arrayValue = Array.isArray(value) ? value : [value];
          // Store the type for submission
          fieldTypes[field.name] = "multiple_checkboxes";
          // Store the array of values
          hubspotFields[field.name] = arrayValue;
        } else {
          hubspotFields[field.name] = value;
          fieldTypes[field.name] = field.type;
        }
      }
    });

    // Notify parent component about submission data
    onSubmissionData?.({
      formId,
      fields: hubspotFields as Record<string, string>,
      pageUrl: window.location.href,
      pageName: document.title,
    });

    try {
      const result = await submitHubspotForm({
        formId,
        fields: hubspotFields,
        fieldTypes,
        pageUrl: window.location.href,
        pageName: document.title,
      });

      // Notify parent component about submission response
      onSubmissionResponse?.(result);

      if (result.success) {
        setSubmitSuccess(true);
        form.reset();
      } else {
        setSubmitError(result.error || "Failed to submit form");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit form";
      const errorResponse = {
        success: false,
        error: errorMessage,
      };
      onSubmissionResponse?.(errorResponse);
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderField = (field: FormFieldConfig) => {
    switch (field.type) {
      case "multiselect":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}-${option.value}`}
                  checked={(
                    (form.getValues(field.name) as string[]) || []
                  ).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues =
                      (form.getValues(field.name) as string[]) || [];
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value);
                    form.setValue(field.name, newValues, { shouldDirty: true });
                  }}
                />
                <label
                  htmlFor={`${field.name}-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
      case "select":
        return (
          <Select
            onValueChange={(value) => {
              form.setValue(field.name, value);
            }}
            defaultValue={form.getValues(field.name) as string}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={field.placeholder || "Select an option"}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            type={field.type === "email" ? "email" : "text"}
            placeholder={field.placeholder}
            {...form.register(field.name)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl p-4 min-h-[400px] flex items-center justify-center">
        <div>Loading form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl p-4 min-h-[400px] flex items-center justify-center">
        <div>Error: {error}</div>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="w-full max-w-2xl p-4 min-h-[400px] flex items-center justify-center">
        <div>No form configuration available</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl p-4 min-h-[400px]">
      <h2 className="text-xl font-semibold mb-4">{formConfig.name}</h2>
      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
          Form submitted successfully!
        </div>
      )}
      {submitError && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {submitError}
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {formConfig.fields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={() => (
                <FormItem>
                  <FormLabel>
                    {field.label}
                    {field.required && (
                      <span className="text-muted-foreground text-sm ">*</span>
                    )}
                  </FormLabel>
                  <FormControl>{renderField(field)}</FormControl>
                  {field.description && (
                    <FormDescription>{field.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
