/**
 * SSO Login Button Component
 *
 * Renders a button to initiate SSO authentication via OIDC or SAML.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { initiateOIDCLogin, type OIDCConfig } from '@/lib/sso/oidcProvider';
import { initiateSAMLLogin, type SAMLConfig } from '@/lib/sso/samlProvider';
import { Building2, AlertCircle } from 'lucide-react';

type SSOConfig = OIDCConfig | SAMLConfig;

interface SSOLoginButtonProps {
  config?: SSOConfig;
  protocol: 'oidc' | 'saml';
  onError?: (error: Error) => void;
  className?: string;
}

export function SSOLoginButton({ config, protocol, onError, className }: SSOLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSSOLogin = async () => {
    if (!config) {
      const err = new Error('SSO is not configured for this environment');
      setError(err.message);
      onError?.(err);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (protocol === 'oidc') {
        await initiateOIDCLogin(config as OIDCConfig);
      } else if (protocol === 'saml') {
        await initiateSAMLLogin(config as SAMLConfig);
      } else {
        throw new Error(`Unsupported SSO protocol: ${protocol}`);
      }
      // User will be redirected, so this code won't execute
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('SSO login failed:', error);
      setError(error.message);
      onError?.(error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSSOLogin}
        disabled={loading || !config}
        className={className}
        variant="outline"
        size="lg"
        type="button"
      >
        <Building2 className="mr-2 h-5 w-5" />
        {loading ? 'Redirecting to SSO...' : 'Sign in with SSO'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!config && (
        <p className="text-sm text-muted-foreground text-center">
          SSO is not configured. Contact your administrator.
        </p>
      )}
    </div>
  );
}

/**
 * SSO Callback Handler Component
 *
 * Handles the OAuth/OIDC callback and completes authentication.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOIDCCallback } from '@/lib/sso/oidcProvider';
import { Loader2 } from 'lucide-react';

export function SSOCallbackHandler() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setStatus('processing');

        // Handle OIDC callback
        const { user, session } = await handleOIDCCallback();

        console.log('SSO authentication successful:', user);

        setStatus('success');

        // Redirect to home page
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('SSO callback error:', error);
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
        <h2 className="text-xl font-semibold mb-2">Completing Sign-In...</h2>
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
        <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
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
