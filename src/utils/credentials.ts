import { Credentials } from "../contracts/contracts";

export const decodeBase64 = (base64: string): Credentials => {
  const data = Buffer.from(base64, "base64").toString("utf-8");
  const credentials: Credentials = JSON.parse(data);
  return credentials;
};
