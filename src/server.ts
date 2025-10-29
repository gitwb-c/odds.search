import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import { gateway } from "./handlers/handler";
import path from "path";
import { JwtPayload, ReCaptchaResponse } from "./contracts/contracts";
import fs from "fs";
import { decodeBase64 } from "./utils/credentials";
import cookieParser from "cookie-parser";
import { signJwt, verifyJwt } from "./utils/jwt";
import {
  verifyMfaToken,
  getMfaSecret,
  generateMfaSecret,
  generateOtpAuthUrl,
  generateQrCode,
} from "./utils/mfa";

dotenv.config();
const credentials = decodeBase64(process.env.CREDENTIALS_BASE64!);

const app = express();
const PORT = process.env.API_PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authenticateJwt = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const token = req.cookies?.jwt;
  if (!token) return res.redirect("/");

  const payload = verifyJwt(token);
  if (!payload) return res.redirect("/");

  (req as any).user = payload;
  next();
};

app.get("/", (req, res) => {
  const htmlPath = path.join(__dirname, "public", "login.html");
  let html = fs.readFileSync(htmlPath, "utf-8");
  const siteKey = process.env.RECAPTCHA_SITE_KEY!;
  html = html.replace(/__RECAPTCHA_SITE_KEY__/g, siteKey);
  res.send(html);
});

app.post("/login", async (req, res) => {
  const { token, password, "g-recaptcha-response": recaptchaToken } = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY!;

  if (!recaptchaToken || !secretKey) {
    return res
      .status(400)
      .json({ success: false, message: "Token de segurança ausente." });
  }

  try {
    const verifyResponse = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secretKey}&response=${recaptchaToken}&remoteip=${req.ip}`,
      }
    );

    const verifyData = (await verifyResponse.json()) as ReCaptchaResponse;

    if (
      verifyData.success &&
      verifyData.action === "login" &&
      (verifyData.score ?? 0) >= 0.5
    ) {
      let verified = false;
      let userToken = "";

      for (const cred of credentials.login) {
        if (cred.token === token && cred.password === password) {
          verified = true;
          userToken = cred.token;
          break;
        }
      }

      if (verified) {
        const existingJwt = req.cookies.jwt;
        let payload = existingJwt ? verifyJwt(existingJwt) : null;

        if (payload?.mfa_setup) {
          return res.json({ success: true, redirect: "/mfa" });
        } else {
          const initialJwt = signJwt({
            token: userToken,
            mfa_setup: false,
          });

          res.cookie("jwt", initialJwt, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          return res.json({ success: true, redirect: "/mfa/setup" });
        }
      } else {
        return res.json({ success: false, message: "Credenciais inválidas." });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Verificação de segurança falhou." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro interno." });
  }
});

app.get("/odds", authenticateJwt, (req, res) => {
  const payload = (req as any).user as JwtPayload;
  if (!payload.mfa) {
    return res.redirect("/mfa");
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/mfa", authenticateJwt, (req, res) => {
  const payload = (req as any).user as JwtPayload;
  if (payload.mfa) {
    return res.redirect("/odds");
  }
  res.sendFile(path.join(__dirname, "public", "mfa.html"));
});

app.post("/mfa", authenticateJwt, (req, res) => {
  const { code } = req.body;
  const payload = (req as any).user as JwtPayload;

  if (!payload || payload.mfa) {
    return res
      .status(400)
      .json({ success: false, message: "Sessão inválida." });
  }

  const isValid = verifyMfaToken(code, getMfaSecret());

  if (isValid) {
    const newJwt = signJwt({ token: payload.token, mfa: true });
    res.cookie("jwt", newJwt, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  } else {
    return res.json({ success: false, message: "Código MFA inválido." });
  }
});

app.get("/mfa/setup", authenticateJwt, async (req, res) => {
  const payload = (req as any).user as JwtPayload;

  if (payload.mfa_setup) {
    return res.redirect("/mfa");
  }

  const userSecret = generateMfaSecret();
  const otpAuthUrl = generateOtpAuthUrl(`user_${payload.token}`, userSecret);
  const qrCodeDataUrl = await generateQrCode(otpAuthUrl);

  const tempJwt = signJwt({
    token: payload.token,
    mfa_setup: false,
    temp_mfa_secret: userSecret,
  });

  res.cookie("jwt", tempJwt, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 10 * 60 * 1000,
  });

  let html = fs.readFileSync(
    path.join(__dirname, "public", "mfa-setup.html"),
    "utf-8"
  );
  html = html.replace(
    "__QR_CODE__",
    `<img src="${qrCodeDataUrl}" alt="QR Code" style="width:200px;height:200px;border-radius:8px;">`
  );
  html = html.replace("__SECRET__", `Chave: <strong>${userSecret}</strong>`);

  res.send(html);
});

app.post("/mfa/verify-setup", authenticateJwt, (req, res) => {
  const { code } = req.body;
  const payload = (req as any).user as JwtPayload;

  if (!payload.temp_mfa_secret) {
    return res.json({ success: false, message: "Sessão expirada." });
  }

  if (verifyMfaToken(code, payload.temp_mfa_secret)) {
    const finalJwt = signJwt({
      token: payload.token,
      mfa: true,
      mfa_setup: true,
    });

    res.cookie("jwt", finalJwt, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } else {
    return res.json({ success: false, message: "Código inválido." });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/gateway/:method", gateway.handleGateway);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
