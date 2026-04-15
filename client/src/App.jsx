import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [page, setPage] = useState('products');
  const [message, setMessage] = useState('');

  const [signupData, setSignupData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer'
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [productData, setProductData] = useState({
    product_name: '',
    description: '',
    price: '',
    stock: '',
    category: ''
  });

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleProductChange = (e) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/signup', signupData);
      setMessage(response.data.message);
      setMode('login');
      setSignupData({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        role: 'customer'
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Signup failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', loginData);
      setUser(response.data.user);
      setMessage(response.data.message);
      setPage('products');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProducts([]);
    setCartItems([]);
    setLoginData({ email: '', password: '' });
    setMessage('Logged out successfully');
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/products');
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Failed to load products');
    }
  };

  const fetchCart = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/cart/${userId}`);
      setCartItems(response.data.cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setMessage('Failed to load cart');
    }
  };

  const addToCart = async (productId) => {
    try {
      await axios.post('http://localhost:5000/cart/add', {
        user_id: user.user_id,
        product_id: productId,
        quantity: 1
      });

      setMessage('Product added to cart');
      fetchCart(user.user_id);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await axios.delete(`http://localhost:5000/cart/remove/${cartItemId}`);
      setMessage('Item removed from cart');
      fetchCart(user.user_id);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to remove item');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/products/add', {
        seller_id: user.user_id,
        product_name: productData.product_name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        category: productData.category
      });

      setMessage(response.data.message);
      setProductData({
        product_name: '',
        description: '',
        price: '',
        stock: '',
        category: ''
      });
      fetchProducts();
      setPage('products');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add product');
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCart(user.user_id);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="app">
        <div className="auth-container">
          <h1 className="main-title">E-Commerce Website</h1>
          <p className="message">{message}</p>

          <div className="toggle-buttons">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => setMode('signup')}
            >
              Signup
            </button>
          </div>

          {mode === 'signup' ? (
            <form className="card form-card" onSubmit={handleSignup}>
              <h2>Signup</h2>
              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={signupData.full_name}
                onChange={handleSignupChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={signupData.phone}
                onChange={handleSignupChange}
              />
              <select
                name="role"
                value={signupData.role}
                onChange={handleSignupChange}
              >
                <option value="customer">Customer</option>
                <option value="seller">Seller</option>
              </select>
              <button type="submit">Create Account</button>
            </form>
          ) : (
            <form className="card form-card" onSubmit={handleLogin}>
              <h2>Login</h2>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
              />
              <button type="submit">Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="dashboard-container">
        <div className="topbar">
          <div>
            <h1 className="logo-title">E-Commerce Website</h1>
            <p className="welcome-text">
              Welcome, {user.full_name} ({user.role})
            </p>
          </div>

          <div className="topbar-actions">
            <button
              className={page === 'products' ? 'active' : ''}
              onClick={() => setPage('products')}
            >
              Products
            </button>

            {user.role === 'customer' && (
              <button
                className={page === 'cart' ? 'active' : ''}
                onClick={() => setPage('cart')}
              >
                Cart
              </button>
            )}

            {user.role === 'seller' && (
              <button
                className={page === 'addProduct' ? 'active' : ''}
                onClick={() => setPage('addProduct')}
              >
                Add Product
              </button>
            )}

            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <p className="message">{message}</p>

        {page === 'products' && (
          <>
            <h2 className="section-title">Available Products</h2>
            <div className="product-grid">
              {products.length === 0 ? (
                <p>No products found</p>
              ) : (
                products.map((product) => (
                  <div key={product.product_id} className="card product-card">
                    <h3>{product.product_name}</h3>
                    <p>{product.description}</p>
                    <p><strong>Category:</strong> {product.category}</p>
                    <p><strong>Stock:</strong> {product.stock}</p>
                    <p><strong>Price:</strong> ₹{product.price}</p>

                    {user.role === 'customer' && (
                      <button onClick={() => addToCart(product.product_id)}>
                        Add to Cart
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {page === 'cart' && user.role === 'customer' && (
          <>
            <h2 className="section-title">Your Cart</h2>
            <div className="product-grid">
              {cartItems.length === 0 ? (
                <p>Your cart is empty</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cart_item_id} className="card product-card">
                    <h3>{item.product_name}</h3>
                    <p><strong>Price:</strong> ₹{item.price}</p>
                    <p><strong>Quantity:</strong> {item.quantity}</p>
                    <p><strong>Total:</strong> ₹{item.total_price}</p>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.cart_item_id)}
                    >
                      Remove from Cart
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {page === 'addProduct' && user.role === 'seller' && (
          <div className="seller-form-wrapper">
            <form className="card form-card" onSubmit={handleAddProduct}>
              <h2>Add New Product</h2>
              <input
                type="text"
                name="product_name"
                placeholder="Product Name"
                value={productData.product_name}
                onChange={handleProductChange}
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                value={productData.description}
                onChange={handleProductChange}
                required
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={productData.price}
                onChange={handleProductChange}
                required
              />
              <input
                type="number"
                name="stock"
                placeholder="Stock"
                value={productData.stock}
                onChange={handleProductChange}
                required
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={productData.category}
                onChange={handleProductChange}
                required
              />
              <button type="submit">Add Product</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;