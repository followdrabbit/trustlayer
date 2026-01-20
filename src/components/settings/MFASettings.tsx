/**
 * MFA Settings Component
 *
 * Allows users to configure Multi-Factor Authentication:
 * - TOTP (Google Authenticator, etc.)
 * - WebAuthn (Security keys, biometrics)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Shield,
  Smartphone,
  Key,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  enableTOTP,
  verifyTOTPSetup,
  disableTOTP,
  isWebAuthnSupported,
  registerWebAuthn,
  listWebAuthnCredentials,
  deleteWebAuthnCredential,
  getMFAStatus,
  regenerateBackupCodes,
  type MFAStatus,
  type WebAuthnCredential,
  type TOTPSetupResponse,
} from '@/lib/auth/mfa';

export function MFASettings() {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [webauthnCreds, setWebauthnCreds] = useState<WebAuthnCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TOTP setup dialog
  const [totpSetupDialog, setTotpSetupDialog] = useState(false);
  const [totpSetup, setTotpSetup] = useState<TOTPSetupResponse | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [totpVerifying, setTotpVerifying] = useState(false);

  // WebAuthn registration dialog
  const [webauthnRegisterDialog, setWebauthnRegisterDialog] = useState(false);
  const [webauthnCredName, setWebauthnCredName] = useState('');
  const [webauthnRegistering, setWebauthnRegistering] = useState(false);

  // Backup codes dialog
  const [backupCodesDialog, setBackupCodesDialog] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await getMFAStatus();
      setMfaStatus(status);

      if (status.webauthnEnabled) {
        const creds = await listWebAuthnCredentials();
        setWebauthnCreds(creds);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MFA status');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTOTP = async () => {
    try {
      setError(null);
      const setup = await enableTOTP();
      setTotpSetup(setup);
      setBackupCodes(setup.backupCodes);
      setTotpSetupDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable TOTP');
    }
  };

  const handleVerifyTOTP = async () => {
    if (!totpVerifyCode || totpVerifyCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setTotpVerifying(true);
      setError(null);
      await verifyTOTPSetup(totpVerifyCode);
      setTotpSetupDialog(false);
      setBackupCodesDialog(true);
      await loadMFAStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setTotpVerifying(false);
    }
  };

  const handleDisableTOTP = async () => {
    const code = prompt('Enter a TOTP code to disable:');
    if (!code) return;

    try {
      setError(null);
      await disableTOTP(code);
      await loadMFAStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable TOTP');
    }
  };

  const handleRegisterWebAuthn = async () => {
    if (!webauthnCredName.trim()) {
      setError('Please enter a name for this security key');
      return;
    }

    try {
      setWebauthnRegistering(true);
      setError(null);
      await registerWebAuthn(webauthnCredName);
      setWebauthnRegisterDialog(false);
      setWebauthnCredName('');
      await loadMFAStatus();
      const creds = await listWebAuthnCredentials();
      setWebauthnCreds(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register security key');
    } finally {
      setWebauthnRegistering(false);
    }
  };

  const handleDeleteWebAuthnCred = async (credId: string) => {
    if (!confirm('Are you sure you want to remove this security key?')) return;

    try {
      setError(null);
      await deleteWebAuthnCredential(credId);
      await loadMFAStatus();
      const creds = await listWebAuthnCredentials();
      setWebauthnCreds(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete security key');
    }
  };

  const handleDownloadBackupCodes = () => {
    const blob = new Blob(
      [backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trustlayer-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div>Loading MFA settings...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* TOTP Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" />
              <div>
                <CardTitle>Authenticator App (TOTP)</CardTitle>
                <CardDescription>
                  Use an app like Google Authenticator or Authy
                </CardDescription>
              </div>
            </div>
            {mfaStatus?.totpEnabled && (
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mfaStatus?.totpEnabled ? (
            <Button onClick={handleEnableTOTP}>
              <Shield className="h-4 w-4 mr-2" />
              Enable Authenticator App
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Authenticator app is enabled. You'll be asked for a code when signing in.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDisableTOTP}>
                  Disable
                </Button>
                <Button variant="outline" onClick={async () => {
                  const code = prompt('Enter a TOTP code to regenerate backup codes:');
                  if (!code) return;
                  try {
                    const result = await regenerateBackupCodes(code);
                    setBackupCodes(result.backupCodes);
                    setBackupCodesDialog(true);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to regenerate backup codes');
                  }
                }}>
                  Regenerate Backup Codes
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Backup codes remaining: {mfaStatus.backupCodesRemaining}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WebAuthn Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5" />
              <div>
                <CardTitle>Security Keys (WebAuthn)</CardTitle>
                <CardDescription>
                  Use hardware keys or biometrics (TouchID, FaceID)
                </CardDescription>
              </div>
            </div>
            {mfaStatus?.webauthnEnabled && (
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {mfaStatus.webauthnCredentials} key(s)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isWebAuthnSupported() ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                WebAuthn is not supported in this browser
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {webauthnCreds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No security keys registered yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {webauthnCreds.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{cred.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(cred.createdAt).toLocaleDateString()}
                          {cred.lastUsedAt && ` • Last used ${new Date(cred.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebAuthnCred(cred.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={() => setWebauthnRegisterDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Security Key
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* TOTP Setup Dialog */}
      <Dialog open={totpSetupDialog} onOpenChange={setTotpSetupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Authenticator App</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app or enter the secret manually
            </DialogDescription>
          </DialogHeader>

          {totpSetup && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">Scan this QR code:</p>
                  {/* TODO: Add QR code component */}
                  <p className="text-xs text-muted-foreground mb-4">
                    (QR code generation requires qrcode library)
                  </p>
                  <p className="text-sm font-medium mb-1">Or enter manually:</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                    {totpSetup.secret}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totp-code">Enter 6-digit code from your app:</Label>
                <Input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpVerifyCode}
                  onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTotpSetupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyTOTP} disabled={totpVerifying}>
              {totpVerifying ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WebAuthn Registration Dialog */}
      <Dialog open={webauthnRegisterDialog} onOpenChange={setWebauthnRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Security Key</DialogTitle>
            <DialogDescription>
              Give your security key a name and follow your browser's instructions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="key-name">Security Key Name:</Label>
            <Input
              id="key-name"
              type="text"
              value={webauthnCredName}
              onChange={(e) => setWebauthnCredName(e.target.value)}
              placeholder="e.g., YubiKey 5, TouchID"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWebauthnRegisterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegisterWebAuthn} disabled={webauthnRegistering}>
              {webauthnRegistering ? 'Registering...' : 'Register'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={backupCodesDialog} onOpenChange={setBackupCodesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Codes</DialogTitle>
            <DialogDescription>
              Save these codes in a safe place. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg bg-muted/50">
              {backupCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono">
                  {i + 1}. {code}
                </code>
              ))}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Store these codes securely. You won't be able to see them again.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDownloadBackupCodes}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => setBackupCodesDialog(false)}>
              I've Saved My Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
