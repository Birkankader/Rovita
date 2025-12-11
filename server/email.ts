// Resend Integration for Email Sending
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  try {
    console.log('[Email] Attempting to send verification email to:', to);
    
    const { client, fromEmail } = await getResendClient();
    console.log('[Email] Got Resend client, fromEmail:', fromEmail);
    
    const result = await client.emails.send({
      from: fromEmail || 'noreply@resend.dev',
      to: [to],
      subject: 'Rotiva - E-posta Doğrulama Kodu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5; text-align: center;">Rotiva</h1>
          <h2 style="text-align: center;">E-posta Doğrulama</h2>
          <p style="text-align: center; font-size: 16px;">
            Hesabınızı doğrulamak için aşağıdaki kodu kullanın:
          </p>
          <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">
              ${code}
            </span>
          </div>
          <p style="text-align: center; color: #6B7280; font-size: 14px;">
            Bu kod 10 dakika içinde geçerliliğini yitirecektir.
          </p>
          <p style="text-align: center; color: #9CA3AF; font-size: 12px;">
            Bu e-postayı siz talep etmediyseniz, lütfen görmezden gelin.
          </p>
        </div>
      `,
    });
    
    console.log('[Email] Send result:', JSON.stringify(result));
    
    if (result.error) {
      console.error('[Email] Resend API error:', result.error);
      return false;
    }
    
    console.log('[Email] Successfully sent to:', to, 'Email ID:', result.data?.id);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send verification email:', error?.message || error);
    console.error('[Email] Full error:', JSON.stringify(error, null, 2));
    return false;
  }
}
