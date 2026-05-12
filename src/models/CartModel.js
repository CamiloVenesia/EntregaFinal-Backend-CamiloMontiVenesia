import mongoose from 'mongoose';

const cartCollection = 'carts';

const cartSchema = new mongoose.Schema({
    products: {
        type: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'products',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1
                }
            }
        ],
        default: []
    }
});

// Middleware pre-hook para automatizar el populate de los productos
cartSchema.pre('findOne', function() {
    this.populate('products.product');
});

const cartModel = mongoose.model(cartCollection, cartSchema);
export default cartModel;