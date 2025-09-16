import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Location extends Model {}

Location.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    }
}, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    timestamps: true,
});

export default Location;
export { Location };