/**
 * SAML Callback Handler Component
 *
 * Handles the SAML POST callback (ACS endpoint) and completes authentication.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleSAMLCallback } from '@/lib/sso/samlProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export function SAMLCallbackHandler() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setStatus('processing');

        // For SAML, the IdP sends a POST request with SAMLResponse
        // We need to extract it from the form data or query params

        // Check if this is a POST callback (preferred)
        const urlParams = new URLSearchParams(window.location.search);
        const samlResponse = urlParams.get('SAMLResponse');
        const relayState = urlParams.get('RelayState') || undefined;

        if (!samlResponse) {
          // Check if we're in a POST form submission scenario
          // In that case, the parent page would have the data
          throw new Error('SAMLResponse not found in callback');
        }

        // Handle SAML callback
        const { user, session } = await handleSAMLCallback(samlResponse, relayState);

        console.log('SAML authentication successful:', user);

        setStatus('success');

        // Redirect to home page
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('SAML callback error:', error);
        setStatus('error');
        setErrorMessage(error.message);
      }
    };

    processCallback();
  }, [navigate]);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Completing SAML Sign-In...</h2>
        <p className="text-muted-foreground">Please wait while we authenticate you.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="rounded-full bg-green-100 p-3 mb-4">
          <svg
            className="h-12 w-12 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Success!</h2>
        <p className="text-muted-foreground">Redirecting to the application...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen max-w-md mx-auto p-6">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">SAML Authentication Failed</h2>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage || 'An unknown error occurred'}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/login')} variant="outline">
          Return to Login
        </Button>
      </div>
    );
  }

  return null;
}

/**
 * SAML ACS Landing Page
 *
 * This component is designed to be embedded in an HTML page that receives
 * the SAML POST callback. It extracts the SAMLResponse from the form data.
 */
export function SAMLACSPage() {
  const [samlResponse, setSamlResponse] = useState<string | null>(null);
  const [relayState, setRelayState] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Extract SAMLResponse from URL params (if GET) or from form (if POST)
    const urlParams = new URLSearchParams(window.location.search);
    const response = urlParams.get('SAMLResponse');
    const state = urlParams.get('RelayState') || undefined;

    if (response) {
      setSamlResponse(response);
      setRelayState(state);
    } else {
      // Check if there's a form with SAMLResponse
      const form = document.querySelector('form[method="post"]');
      if (form) {
        const formData = new FormData(form as HTMLFormElement);
        const formResponse = formData.get('SAMLResponse') as string;
        const formState = formData.get('RelayState') as string | undefined;

        if (formResponse) {
          setSamlResponse(formResponse);
          setRelayState(formState);
        }
      }
    }
  }, []);

  // Redirect to callback handler with SAMLResponse
  useEffect(() => {
    if (samlResponse) {
      const params = new URLSearchParams({ SAMLResponse: samlResponse });
      if (relayState) {
        params.set('RelayState', relayState);
      }
      window.location.href = `/auth/saml/callback?${params.toString()}`;
    }
  }, [samlResponse, relayState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-semibold mb-2">Processing SAML Response...</h2>
      <p className="text-muted-foreground">Please wait.</p>
    </div>
  );
}
