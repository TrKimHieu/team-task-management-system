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
        url: "http://localhost:3000",
        description: "Development server"
      }
    ],
    tags: [
      {
        name: "Projects",
        description: "Project management endpoints"
      },
      {
        name: "Tasks",
        description: "Task management endpoints"
      },
      {
        name: "Members",
        description: "Team member endpoints"
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJsdoc(options);
