const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  try{
    const data = await Cart.findOne({email: user.email});
    if (data == null){
      throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
    }
    return data;
  }
  catch(error){
    throw error;
  }
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  try{
    let cart = await Cart.findOne({ email: user.email });

    if (!cart) {
      try {
        cart = await Cart.create({email: user.email, cartItems: []});
      } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "User cart creation failed because user already have a cart");
      }
    }
  
    if (cart == null) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "User does not have a cart");
    }
  
    let index = -1;
    for (let i = 0; i < cart.cartItems.length; i++) {
      if (productId == cart.cartItems[i].product._id) {
        index = i;
      }
    }

    if (index == -1) {
      let product = await Product.findOne({ _id: productId });
  
      if (product == null) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in database");
      }
  
      cart.cartItems.push({ product: product, quantity: quantity });
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST,"Product already in cart. Use the cart sidebar to update or remove product from cart");
    }
  
    await cart.save();
    return cart;
  }
  catch(error){
    throw error;
  }
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  try{
    let cart = await Cart.findOne({email: user.email});

    if (cart == null){
      throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart. Use POST to create cart and add a product");
    }

    let product = await Product.findOne({_id: productId});
    if (product == null){
      throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in database");
    }

    let index = -1;
    for (let i =0; i< cart.cartItems.length;i++){
      if (productId == cart.cartItems[i].product._id){
        index = i;
      }
    }

    if (index == -1) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
    } else {
      cart.cartItems[index].quantity = quantity;
    }
    await cart.save();
    return cart;
  }
  catch(error){
    throw error;
  }
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  try{
    let cart = await Cart.findOne({ email: user.email });
    if (cart == null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
    }
  
    let index = -1;
    for (let i = 0; i < cart.cartItems.length; i++) {
      if (productId == cart.cartItems[i].product._id) {
        index = i;
      }
    }
  
    if (index == -1) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
    } else {
      cart.cartItems.splice(index, 1);
    }
    await cart.save();
  }
  catch(error){
    throw error;
  }
};

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
 const checkout = async (user) => {
  const cart = await Cart.findOne({email:user.email})

  if(cart == null){
    throw new ApiError(httpStatus.NOT_FOUND,"User does not have  cart")
  }
  if(cart.cartItems.length === 0){
    throw new ApiError(httpStatus.BAD_REQUEST,"User does not have items in the cart")
  }

  const hasSetNonDefaultAddress = await user.hasSetNonDefaultAddress()
  if(!hasSetNonDefaultAddress){
    throw new ApiError(httpStatus.BAD_REQUEST,"Address Not Set");
  }

  const total = cart.cartItems.reduce((acc,item)=>{
    acc += (item.product.cost*item.quantity);
    return acc;
  },0)

  if(total > user.walletMoney){
    throw new ApiError(httpStatus.BAD_REQUEST,"Insufficient Balance")
  }

  //reduce the balance from the wallet
  user.walletMoney -= total;
  await user.save();

  //empty the cart
  cart.cartItems = [];
  await cart.save();

};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
