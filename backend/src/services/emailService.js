const axios = require('axios');
const nodemailer = require('nodemailer');

require('dotenv').config();

let transporter;

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpService = process.env.SMTP_SERVICE;

  if (!smtpUser || !smtpPass || (!smtpHost && !smtpService)) {
    throw new Error('Email transport is not configured. Set SMTP_USER, SMTP_PASS and either SMTP_HOST or SMTP_SERVICE.');
  }

  const transportConfig = smtpService
    ? {
      service: smtpService,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    }
    : {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    };

  transporter = nodemailer.createTransport(transportConfig);
  return transporter;
};

const buildEmergencyEmailHtml = (data) => {
  const patientName = escapeHtml(data['patient-name'] || 'the patient');
  const hospitalName = escapeHtml(data['doctor-clinic-name'] || 'Hospital');
  const hospitalAddress = escapeHtml(data['doctor-address'] || 'Address not available');
  const emergencyDesk = escapeHtml(data['doctor-contact-number'] || 'Not available');
  const doctorName = escapeHtml(data['doctor-name'] || 'Not available');

  return `
 <div style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#374151;line-height:1.6;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
    
    <div style="background:#dc2626;color:#ffffff;padding:20px 24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">⚠️ Emergency Medical Alert</h1>
    </div>

    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;font-size:16px;color:#1f2937;">Hello,</p>
      
      <p style="margin:0 0 16px;font-size:16px;">
        This is an automated alert. You are receiving this message because you are listed as the emergency contact for <strong style="color:#111827;">${patientName}</strong>.
      </p>
      
      <p style="margin:0 0 24px;font-size:16px;">
        Their emergency medical profile was just accessed, which indicates they are currently receiving medical care.
      </p>

      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
        <h3 style="margin:0 0 12px;font-size:18px;color:#991b1b;">🏥 Hospital Location</h3>
        <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1f2937;">${hospitalName}</p>
        <p style="margin:0 0 8px;font-size:15px;color:#4b5563;">📍 ${hospitalAddress}</p>
        <p style="margin:0;font-size:15px;color:#4b5563;">📞 Emergency Desk: <strong style="color:#1f2937;">${emergencyDesk}</strong></p>
      </div>

      <p style="margin:0 0 28px;font-size:16px;">
        Please contact the hospital's emergency desk immediately for further updates on the patient's condition.
      </p>

      <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
        <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1f2937;">🩺 Attending Doctor Details:</p>
        <p style="margin:0 0 6px;font-size:15px;color:#4b5563;"><strong>Name:</strong> ${doctorName}</p>
        <p style="margin:0;font-size:15px;color:#4b5563;"><strong>Department:</strong> Emergency Services</p>
      </div>

      <p style="margin:18px 0 0;font-size:12px;color:#6b7280;">
        This is an automatically generated email.
      </p>
    </div>
    
  </div>
</div>
  `;
};

const sendMail = async (data) => {
  try {
    const to = data['patient-emergency-email'];

    if (!to) {
      throw new Error('Missing emergency contact email address.');
    }

    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from,
      to,
      subject: '⚠️ Emergency Medical Alert',
      html: buildEmergencyEmailHtml(data),
      text: `Emergency Medical Alert\n\nPatient: ${data['patient-name'] || 'Unknown'}\nHospital: ${data['doctor-clinic-name'] || 'Unknown'}\nAddress: ${data['doctor-address'] || 'Unknown'}\nEmergency Desk: ${data['doctor-contact-number'] || 'Unknown'}\nDoctor: ${data['doctor-name'] || 'Unknown'}\n\nThis is an automatically generated email.\n`
    });

    return info.messageId;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw error;
  }
};

module.exports = sendMail;