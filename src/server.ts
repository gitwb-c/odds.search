import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import fetch from "node-fetch";
import { gateway } from "./handlers/handler";
import path from "path";
import { ReCaptchaResponse } from "./contracts/contracts";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.API_PORT;

declare module "express-session" {
  interface SessionData {
    user?: { token: string };
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET_KEY!,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

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
  console.log(secretKey);
  if (!recaptchaToken || !secretKey) {
    return res
      .status(400)
      .json({ success: false, message: "Token de segurança ausente." });
  }

  try {
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const verifyResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env
        .RECAPTCHA_SECRET_KEY!}&response=${recaptchaToken}&remoteip=${req.ip}`,
    });
    console.log(verifyResponse);

    const verifyData = (await verifyResponse.json()) as ReCaptchaResponse;

    if (
      verifyData.success &&
      verifyData.action === "login" &&
      (verifyData.score ?? 0) >= 0.5
    ) {
      if (token === process.env.TOKEN && password === process.env.PASSWORD) {
        req.session.user = { token };
        return res.json({ success: true });
      } else {
        return res.json({ success: false, message: "Credenciais inválidas." });
      }
    } else {
      console.log("reCAPTCHA falhou:", verifyData);
      return res
        .status(400)
        .json({ success: false, message: "Verificação de segurança falhou." });
    }
  } catch (error) {
    console.error("Erro na verificação reCAPTCHA:", error);
    return res.status(500).json({ success: false, message: "Erro interno." });
  }
});

app.get(
  "/odds",
  (req, res, next) => {
    if (req.session.user) return next();
    res.redirect("/");
  },
  (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
);

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/gateway/:method", gateway.handleGateway);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
