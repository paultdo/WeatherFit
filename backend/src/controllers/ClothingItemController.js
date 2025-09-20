import models from "../models/index.js";

const { ClothingItem } = models;
import { Op } from 'sequelize';
const controller = {
    // get paginated clothing items for a person
    getClothingItemsByPerson: async (req, res) => {
        const { userId } = req.params;
        const { page, limit = 10 } = req.query;

        try {

            if (!page) {
                const items = await ClothingItem.findAll({ where: { user_id: userId } });
                return res.json({ items, total: items.length });
            }
            const { count, rows } = await ClothingItem.findAndCountAll({
                where: { user_id: userId },
                limit,
                offset: (page - 1) * limit,
            });

            res.json({
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                items: rows,
            });
        } catch (error) {
            console.error("Error fetching clothing items:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    getClothingItemById: async (req, res) => {
        const { id } = req.params;
        try {
            const item = await ClothingItem.findByPk(id);
            if (!item) {
                return res.status(404).json({ error: "Clothing item not found" });
            }
            res.json(item);
        } catch (error) {
            console.error("Error fetching clothing item:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    createClothingItem: async (req, res) => {
        const { user_id, name, category, insulation_level, waterproof, uv_protection, formality, color, notes } = req.body;
        try {
            const newItem = await ClothingItem.create({ user_id, name, category, insulation_level, waterproof, uv_protection, formality, color, notes });
            res.status(201).json(newItem);
        } catch (error) {
            console.error("Error creating clothing item:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    updateClothingItem: async (req, res) => {
        const { id } = req.params;
        const { user_id, name, category, insulation_level, waterproof, uv_protection, formality, color, notes } = req.body;

        try {
            const item = await ClothingItem.findByPk(id);
            if (!item) {
                return res.status(404).json({ error: "Clothing item not found" });
            }
            const updatedItem = await item.update({ user_id, name, category, insulation_level, waterproof, uv_protection, formality, color, notes });
            res.json(updatedItem);
        } catch (error) {
            console.error("Error updating clothing item:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },
    deleteClothingItem: async (req, res) => {
        const { id } = req.params;
        try {
            const item = await ClothingItem.findByPk(id);
            if (!item) {
                return res.status(404).json({ error: "Clothing item not found" });
            }
            await item.destroy();
            res.status(204).send();
        } catch (error) {
            console.error("Error deleting clothing item:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },
};

export default controller;