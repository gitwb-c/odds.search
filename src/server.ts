import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import { gateway } from "./handlers/handler";
import path from "path";
import { ReCaptchaResponse } from "./contracts/contracts";
import fs from "fs";
import { decodeBase64 } from "./utils/credentials";
import cookieParser from "cookie-parser";
import { signJwt, verifyJwt } from "./utils/jwt";

dotenv.config();
const credentials = decodeBase64(process.env.CREDENTIALS_BASE64!);

const app = express();
const PORT = process.env.API_PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  const htmlPath = path.join(__dirname, "public", "login.html");
  let html = fs.readFileSync(htmlPath, "utf-8");
  const siteKey = process.env.RECAPTCHA_SITE_KEY!;
  html = html.replace(/__RECAPTCHA_SITE_KEY__/g, siteKey);
  res.send(html);
});

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
        const jwtToken = signJwt({ token: userToken });

        res.cookie("jwt", jwtToken, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({ success: true });
      } else {
        return res.json({ success: false, message: "Credenciais inválidas." });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Verificação de segurança falhou." });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ success: false, message: "Erro interno." });
  }
});

app.get("/odds", authenticateJwt, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/gateway/:method", gateway.handleGateway);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
