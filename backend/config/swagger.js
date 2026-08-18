import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cravingza Multi-Vendor Food Delivery API Documentation",
      version: "1.0.0",
      description:
        "Official REST API documentation and interactive testing portal for Cravingza platform (Customer, Restaurant Owner, Delivery Partner, Super Admin).",
      contact: {
        name: "Cravingza Support",
        email: "support@cravingza.com",
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : "http://localhost:5000/api",
        description: process.env.NODE_ENV === "production" ? "Production API Server" : "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from /api/auth/login",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js", "./index.js"],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  // Security Feature: In Production, Swagger can be toggled via ENABLE_SWAGGER env variable
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_SWAGGER === "false") {
    console.log("🔒 Swagger API Documentation is disabled in Production environment for security.");
    return;
  }

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📄 Swagger API Documentation is available at /api-docs");
};

export default setupSwagger;
