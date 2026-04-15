const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management API",
      version: "1.0.0",
      description: "API for Task Management System - TeamTask",
      contact: {
        name: "API Support"
      }
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints"
      },
      {
        name: "Users",
        description: "User management endpoints"
      },
      {
        name: "Projects",
        description: "Project management endpoints"
      },
      {
        name: "Tasks",
        description: "Task management endpoints"
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJsdoc(options);
