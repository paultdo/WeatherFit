import models from '../models/index.js';
import { Op } from 'sequelize';

const { Location } = models;

const controller = {
    getLocationsByPerson: async (req, res) => {
        const { userId } = req.params;
        try {
            const locations = await Location.findAll({ where: { user_id: userId } });
            res.json(locations);
        } catch (error) {
            console.error('Error fetching locations:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    getLocationById: async (req, res) => {
        const { id } = req.params;
        try {
            const location = await Location.findByPk(id);
            if (!location) {
                return res.status(404).send('Location not found');
            }
            res.json(location);
        } catch (error) {
            console.error('Error fetching location:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    getDefaultLocationByPerson: async (req, res) => {
        const { userId } = req.params;
        try {
            const location = await Location.findOne({ where: { user_id: userId, is_default: true } });
            if (!location) {
                return res.status(404).send('Default location not found');
            }
            res.json(location);
        } catch (error) {
            console.error('Error fetching default location:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    createLocation: async (req, res) => {
        const { user_id, name, is_default, latitude, longitude, city } = req.body;
        try {
            const newLocation = await Location.create({ user_id, name, is_default, latitude, longitude, city });
            if (is_default) {
                // If the new location is default, unset other default locations for the user
                await Location.update({ is_default: false }, { where: { user_id, id: { [Op.ne]: newLocation.id }, is_default: true } });
            }
            res.status(201).json(newLocation);
        } catch (error) {
            console.error('Error creating location:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    updateLocation: async (req, res) => {
        const { id } = req.params;
        const { name, is_default, latitude, longitude, city } = req.body;
        try {
            const location = await Location.findByPk(id);
            if (!location) {
                return res.status(404).send('Location not found');
            }
            await location.update({ name, is_default, latitude, longitude, city });
            if (is_default) {
                // If the updated location is default, unset other default locations for the user
                await Location.update({ is_default: false }, { where: { user_id: location.user_id, id: { [Op.ne]: location.id }, is_default: true } });
            }
            res.json(location);
        } catch (error) {
            console.error('Error updating location:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    deleteLocation: async (req, res) => {
        const { id } = req.params;
        try {
            const location = await Location.findByPk(id);
            if (!location) {
                return res.status(404).send('Location not found');
            }
            await location.destroy();
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting location:', error);
            res.status(500).send('Internal Server Error');
        }
    }
};

export default controller;