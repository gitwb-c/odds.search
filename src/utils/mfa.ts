import { authenticator } from "otplib";
import qrcode from "qrcode";

const MFA_SECRET = process.env.MFA_SECRET;

export const generateMfaSecret = (): string => {
  return authenticator.generateSecret();
};

export const generateOtpAuthUrl = (email: string, secret: string): string => {
  return authenticator.keyuri(email, "Odds App", secret);
};

export const generateQrCode = async (url: string): Promise<string> => {
  return await qrcode.toDataURL(url);
};

export const verifyMfaToken = (token: string, secret: string): boolean => {
  return authenticator.check(token, secret);
};

export const getMfaSecret = (): string => MFA_SECRET!;
