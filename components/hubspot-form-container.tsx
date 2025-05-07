"use client";

import * as React from "react";
import { useState } from "react";
import { HubspotForm } from "@/components/hubspot-form";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

interface HubspotFormContainerProps {
  formId: string;
}

export function HubspotFormContainer({ formId }: HubspotFormContainerProps) {
  const [submissionData, setSubmissionData] = useState<{
    formId: string;
    fields: Record<string, string>;
    pageUrl?: string;
    pageName?: string;
  } | null>(null);
  const [submissionResponse, setSubmissionResponse] = useState<{
    success: boolean;
    data?: {
      redirectUrl?: string;
      inlineMessage?: string;
      [key: string]: unknown;
    };
    error?: string;
  } | null>(null);

  const handleFormSubmit = (data: {
    formId: string;
    fields: Record<string, string>;
    pageUrl?: string;
    pageName?: string;
  }) => {
    setSubmissionData(data);
  };

  const handleFormResponse = (response: {
    success: boolean;
    data?: {
      redirectUrl?: string;
      inlineMessage?: string;
      [key: string]: unknown;
    };
    error?: string;
  }) => {
    setSubmissionResponse(response);
  };

  return (
    <>
      <AppSidebar
        submissionData={submissionData}
        submissionResponse={{
          success: submissionResponse?.success ?? false,
          data: submissionResponse?.data ? {
            ...submissionResponse.data,
            status: 'completed'
          } : undefined,
          error: submissionResponse?.error
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-3" />
        </header>
        <div className="flex flex-1 flex-col gap-2 p-2 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <HubspotForm
              formId={formId}
              onSubmissionData={handleFormSubmit}
              onSubmissionResponse={handleFormResponse}
            />
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
