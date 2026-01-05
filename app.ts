import "dotenv/config";
import express from "express";
import router from "./src/routes";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//app.set('trust proxy', false);
app.use(router);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global error handler caught:", err);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
        errors: [err.message || "Something went wrong"]
    });
});

// app.listen(3000);
export default app;
