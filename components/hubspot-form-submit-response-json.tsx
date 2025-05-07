"use client";

interface HubspotFormSubmitResponseJsonProps {
  response: {
    success: boolean;
    data?: {
      inlineMessage?: string;
      redirectUrl?: string;
      status: string;
      correlationId?: string;
      [key: string]: unknown;
    };
    error?: string;
  } | null;
}

export function HubspotFormSubmitResponseJson({
  response,
}: HubspotFormSubmitResponseJsonProps) {
  if (!response) {
    return <div className="w-full p-4">No response data available</div>;
  }

  return (
    <div className="w-full p-4 min-w-0 max-w-full">
      <h2 className="text-xl font-semibold mb-4 truncate">Response Data</h2>
      <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg overflow-x-auto">
        <pre className="whitespace-pre-wrap break-words text-xs font-mono min-w-0 max-w-full">
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    </div>
  );
}
