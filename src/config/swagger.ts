import swaggerJsdoc from "swagger-jsdoc";
import "dotenv/config";
import path from "path";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Point of Interest API",
            version: "1.0.0",
            description: "API documentation for the Point of Interest (Placemark) system.",
        },
        servers: [
            {
                url: process.env.APP_URL || "http://localhost:3000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        role: { type: "string", enum: ["USER", "ADMIN"] },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    },
                },
                Placemark: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string" },
                        street: { type: "string" },
                        house_number: { type: "string" },
                        zip: { type: "integer" },
                        city: { type: "string" },
                        country: { type: "string" },
                        image_url: { type: "string" },
                        lat: { type: "number" },
                        lng: { type: "number" },
                        view_count: { type: "integer" },
                        is_public: { type: "boolean" },
                        userId: { type: "string" },
                        categoryId: { type: "string" },
                    },
                },
                Category: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string" },
                    },
                },
                Review: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        rating: { type: "integer" },
                        comment: { type: "string" },
                        userId: { type: "string" },
                        placemarkId: { type: "string" },
                        parentId: { type: "string" },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        path.join(__dirname, "../routes.ts"),
        path.join(__dirname, "../controllers/**/*.ts")
    ], // Paths to files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
