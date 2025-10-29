import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import { gateway } from "./handlers/handler";
import path from "path";

declare module "express-session" {
  interface SessionData {
    user?: { token: string };
  }
}

dotenv.config();

const app = express();
const PORT = process.env.API_PORT;

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

const isAuthenticated = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.use(express.static(path.join(__dirname, "public")));

app.post("/login", (req, res) => {
  const { token, password } = req.body;

  if (token === process.env.TOKEN && password === process.env.PASSWORD) {
    req.session.user = { token };
    res.redirect("/odds");
  } else {
    res.redirect("/?error=Credenciais inválidas");
  }
});

app.get("/odds", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/gateway/:method", gateway.handleGateway);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
