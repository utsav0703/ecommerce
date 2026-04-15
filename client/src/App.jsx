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
  const [messageType, setMessageType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    category: '',
    image_url: ''
  });

  // Helper to ensure image URLs are direct and render-friendly
  const getCleanImageUrl = (url) => {
    if (!url) return 'https://placehold.co/400x400?text=No+Image';
    
    let cleanUrl = url.trim();

    // Handle Unsplash page links (e.g., unsplash.com/photos/XYZ or unsplash.com/photos/descriptive-text-XYZ)
    if (cleanUrl.includes('unsplash.com/photos/')) {
      const parts = cleanUrl.split('/');
      const idPart = parts[parts.length - 1];
      // Unsplash IDs are usually the last alphanumeric part
      const idMatch = idPart.match(/([a-zA-Z0-9_-]+)$/);
      const id = idMatch ? idMatch[1] : idPart;
      
      // If it doesn't already look like a photo ID (starting with photo-), 
      // we still try to use it as an ID for the images domain
      if (!id.startsWith('photo-')) {
        return `https://images.unsplash.com/photo-${id}?q=80&w=800&auto=format&fit=crop`;
      }
      return `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;
    }

    // Auto-fix Unsplash direct links missing parameters
    if (cleanUrl.includes('unsplash.com/photo-') && !cleanUrl.includes('?')) {
      return `${cleanUrl}?q=80&w=800&auto=format&fit=crop`;
    }

    return cleanUrl;
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

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
      showMessage(response.data.message);
      setMode('login');
      setSignupData({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        role: 'customer'
      });
    } catch (error) {
      showMessage(error.response?.data?.message || 'Signup failed', 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', loginData);
      setUser(response.data.user);
      showMessage(response.data.message);
      setPage('products');
    } catch (error) {
      showMessage(error.response?.data?.message || 'Login failed', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProducts([]);
    setCartItems([]);
    setLoginData({ email: '', password: '' });
    showMessage('Logged out successfully');
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/products');
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      showMessage('Failed to load products', 'error');
    }
  };

  const fetchCart = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/cart/${userId}`);
      setCartItems(response.data.cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      showMessage('Failed to load cart', 'error');
    }
  };

  const addToCart = async (productId) => {
    try {
      await axios.post('http://localhost:5000/cart/add', {
        user_id: user.user_id,
        product_id: productId,
        quantity: 1
      });

      showMessage('Product added to cart');
      fetchCart(user.user_id);
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to add to cart', 'error');
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await axios.delete(`http://localhost:5000/cart/remove/${cartItemId}`);
      showMessage('Item removed from cart');
      fetchCart(user.user_id);
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to remove item', 'error');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:5000/products', {
        seller_id: user.user_id,
        product_name: productData.product_name,
        description: productData.description,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        category: productData.category,
        image_url: getCleanImageUrl(productData.image_url)
      });

      showMessage(response.data.message);
      setProductData({
        product_name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        image_url: ''
      });
      fetchProducts();
      setPage('products');
    } catch (error) {
      console.error('Client Submit Error:', error);
      showMessage(error.response?.data?.message || 'Failed to add product', 'error');
    } finally {
      setIsSubmitting(false);
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
          <h1 className="main-title">🛒 ShopVerse</h1>
          <p className="subtitle">Your one-stop shopping destination</p>

          {message && (
            <p className={`message ${messageType}`}>{message}</p>
          )}

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
              <h2>Create Account</h2>
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
              <h2>Welcome Back</h2>
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
            <h1 className="logo-title">🛒 ShopVerse</h1>
            <p className="welcome-text">
              Welcome, <strong>{user.full_name}</strong> <span className="role-badge">{user.role}</span>
            </p>
          </div>

          <div className="topbar-actions">
            <button
              className={page === 'products' ? 'active' : ''}
              onClick={() => setPage('products')}
            >
              🏪 Products
            </button>

            {user.role === 'customer' && (
              <button
                className={page === 'cart' ? 'active' : ''}
                onClick={() => setPage('cart')}
              >
                🛒 Cart ({cartItems.length})
              </button>
            )}

            {user.role === 'seller' && (
              <button
                className={page === 'addProduct' ? 'active' : ''}
                onClick={() => setPage('addProduct')}
              >
                ➕ Add Product
              </button>
            )}

            <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {message && (
          <p className={`message ${messageType}`}>{message}</p>
        )}

        {page === 'products' && (
          <>
            <h2 className="section-title">Available Products</h2>
            <div className="product-grid">
              {products.length === 0 ? (
                <div className="empty-state">
                  <p>🛍️ No products available yet</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.product_id} className="product-card">
                    <div className="product-image-wrapper">
                      <img
                        src={getCleanImageUrl(product.image_url)}
                        alt={product.product_name}
                        className="product-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/400x400?text=Image+Not+Found';
                        }}
                      />
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.product_name}</h3>
                      <p className="product-description">{product.description}</p>
                      <span className="product-category">{product.category}</span>
                      <p className="product-price">₹{Number(product.price).toLocaleString('en-IN')}</p>
                      <p className="product-stock">
                        {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                      </p>
                      {user.role === 'customer' && (
                        <button
                          className="add-to-cart-btn"
                          onClick={() => addToCart(product.product_id)}
                          disabled={product.stock <= 0}
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
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
                <div className="empty-state">
                  <p>🛒 Your cart is empty</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cart_item_id} className="product-card cart-card">
                    <div className="product-info">
                      <h3 className="product-name">{item.product_name}</h3>
                      <p className="product-price">₹{Number(item.price).toLocaleString('en-IN')}</p>
                      <p className="cart-quantity">Quantity: {item.quantity}</p>
                      <p className="cart-total">Total: ₹{Number(item.total_price).toLocaleString('en-IN')}</p>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.cart_item_id)}
                      >
                        Remove from Cart
                      </button>
                    </div>
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
                placeholder="Price (₹)"
                value={productData.price}
                onChange={handleProductChange}
                required
              />
              <input
                type="number"
                name="stock"
                placeholder="Stock Quantity"
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
              <input
                type="url"
                name="image_url"
                placeholder="Image URL (https://...)"
                value={productData.image_url}
                onChange={handleProductChange}
                required
              />
              {productData.image_url && (
                <div className="image-preview">
                  <p>Image Preview:</p>
                  <img
                    src={getCleanImageUrl(productData.image_url)}
                    alt="Preview"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/400x400?text=Preview+Not+Available';
                    }}
                  />
                </div>
              )}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={isSubmitting ? 'submitting' : ''}
              >
                {isSubmitting ? 'Adding Product...' : 'Add Product'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;