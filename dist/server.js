import dotenv from "dotenv";
import express from "express";
import { gateway } from "./handlers/handler";
import path from "path";
dotenv.config();
const app = express();
const PORT = process.env.API_PORT;
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.post("/api/gateway/:method", gateway.handleGateway);
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
