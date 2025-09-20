import User from './User.js';
import Location from './Location.js';
import ClothingItem from './ClothingItem.js';

const models = {
    User,
    Location,
    ClothingItem,
};

Object.values(models).forEach(model => {
    if (typeof model.associate === 'function') {
        model.associate(models);
    }
});

export default models;
export { User, Location, ClothingItem };