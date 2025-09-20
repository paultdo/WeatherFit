import { sequelize } from "./database.js";
import models from "../models/index.js";

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully!");

        await sequelize.sync({ alter: true });
        console.log("Tables created/updated!");
        process.exit(0);

    } catch (error) {
        console.error("Error syncing database:", error);
        process.exit(1);
    }
})();
