import "dotenv/config";
import express from "express";
import router from "./src/routes";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//app.set('trust proxy', false);

if (process.env.ENABLE_SWAGGER === "true") {
    // Custom options for Swagger UI to work correctly on Vercel
    const swaggerOptions = {
        customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.css",
        customSiteTitle: "POI API Documentation"
    };
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
    console.log("Swagger documentation available at /api-docs");
}

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
