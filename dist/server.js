"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const handler_1 = require("./handlers/handler");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.API_PORT;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use((0, express_session_1.default)({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    }
    else {
        res.redirect("/");
    }
};
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "public", "login.html"));
});
app.post("/login", (req, res) => {
    const { token, password } = req.body;
    if (token === process.env.TOKEN && password === process.env.PASSWORD) {
        req.session.user = { token };
        res.redirect("/odds");
    }
    else {
        res.redirect("/?error=Credenciais inválidas");
    }
});
app.get("/odds", isAuthenticated, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "public", "index.html"));
});
app.post("/api/gateway/:method", handler_1.gateway.handleGateway);
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
