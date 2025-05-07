"use client";

import { useEffect, useState } from "react";

interface HubspotFormSubmitJsonProps {
  formId: string;
  fields: Record<string, string>;
  pageUrl?: string;
  pageName?: string;
}

interface SubmissionData {
  submittedAt: string;
  fields: Array<{
    objectTypeId?: string;
    name: string;
    value: string;
  }>;
  context: {
    pageUri: string;
    pageName: string;
  };
}

export function HubspotFormSubmitJson({
  formId,
  fields,
  pageUrl,
  pageName,
}: HubspotFormSubmitJsonProps) {
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(
    null
  );

  useEffect(() => {
    // Format the submission data to match HubSpot's API structure
    const data = {
      submittedAt: Date.now().toString(),
      fields: Object.entries(fields).map(([name, value]) => {
        // Handle special field types
        if (name === "email") {
          return {
            objectTypeId: "0-1",
            name: "email",
            value: value,
          };
        }
        if (name === "firstname") {
          return {
            objectTypeId: "0-1",
            name: "firstname",
            value: value,
          };
        }
        if (name === "lastname") {
          return {
            objectTypeId: "0-1",
            name: "lastname",
            value: value,
          };
        }
        // Default field structure
        return {
          name,
          value,
        };
      }),
      context: {
        pageUri: pageUrl || "",
        pageName: pageName || "Form Submission",
      },
    };

    setSubmissionData(data);
  }, [formId, fields, pageUrl, pageName]);

  if (!submissionData) {
    return <div className="w-full p-4">No submission data available</div>;
  }

  return (
    <div className="w-full p-4 min-w-0 max-w-full">
      <h2 className="text-xl font-semibold mb-4 truncate">Submission Data</h2>
      <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg overflow-x-auto">
        <pre className="whitespace-pre-wrap break-words text-xs font-mono min-w-0 max-w-full">
          {JSON.stringify(submissionData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
