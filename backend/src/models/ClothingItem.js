import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class ClothingItem extends Model {}

ClothingItem.init({
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
    category: {
        type: DataTypes.ENUM('top', 'bottom', 'outerwear', 'footwear', 'accessory'),
        allowNull: false,
    },
    insulation_level: {
        type: DataTypes.ENUM('light', 'medium', 'heavy'),
        allowNull: false,
    },
    waterproof: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    uv_protection: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    formality: {
        type: DataTypes.ENUM('casual', 'business casual', 'formal'),
        allowNull: false,
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'ClothingItem',
    tableName: 'clothing_items',
    timestamps: true,
});

ClothingItem.associate = (models) => {
    ClothingItem.belongsTo(models.User, { foreignKey: 'user_id' });
};

export default ClothingItem;
export { ClothingItem };
