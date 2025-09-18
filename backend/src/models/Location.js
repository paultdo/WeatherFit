import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Location extends Model {}

Location.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
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
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    timestamps: true,
});

Location.associate = (models) => {
    Location.belongsTo(models.User, { foreignKey: 'user_id' });
}

export default Location;
export { Location };