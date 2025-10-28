import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mohanchowdary963@gmail.com',
    pass: 'lwjr kcle gaju foqx'
  },
})

export const sendOTPEmail = async (toEmail: string, otp: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: 'mohanchowdary963@gmail.com',
      to: toEmail,
      subject: 'Password Reset OTP - Legal Compliance Chatbot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Legal Compliance Chatbot</h1>
              <h2 style="color: #666; font-weight: normal;">Password Reset Request</h2>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.5;">
                You have requested to reset your password. Please use the following One-Time Password (OTP) to continue:
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 8px;">${otp}</span>
              </div>
            </div>
            
            <div style="margin: 30px 0;">
              <p style="color: #666; font-size: 14px; line-height: 1.5;">
                <strong>Important:</strong>
                <br>• This OTP is valid for 10 minutes only
                <br>• Do not share this code with anyone
                <br>• If you didn't request this, please ignore this email
              </p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                This is an automated email. Please do not reply to this message.
                <br>Legal Compliance Chatbot © 2025
              </p>
            </div>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending OTP email:', error)
    return false
  }
}

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}