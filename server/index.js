import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/test-db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT NOW() AS currentTime');
    connection.release();

    res.json({
      success: true,
      message: 'Database connected successfully',
      time: rows[0].currentTime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { full_name, email, password, phone, role } = req.body;

    const [userResult] = await pool.query(
      `INSERT INTO users (full_name, email, password, phone, role)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, password, phone, role || 'customer']
    );

    const userId = userResult.insertId;

    await pool.query(
      `INSERT INTO carts (user_id)
       VALUES (?)`,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'User created and cart created successfully',
      userId: userId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

app.post('/products', async (req, res) => {
  try {
    const {
      seller_id,
      product_name,
      description,
      price,
      stock,
      category,
      image_url
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO products
      (seller_id, product_name, description, price, stock, category, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [seller_id, product_name, description, price, stock, category, image_url]
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      productId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add product',
      error: error.message
    });
  }
});

app.post('/cart/add', async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    const [cartRows] = await pool.query(
      `SELECT cart_id FROM carts WHERE user_id = ?`,
      [user_id]
    );

    if (cartRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user'
      });
    }

    const cart_id = cartRows[0].cart_id;

    const [existingItem] = await pool.query(
      `SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?`,
      [cart_id, product_id]
    );

    if (existingItem.length > 0) {
      await pool.query(
        `UPDATE cart_items
         SET quantity = quantity + ?
         WHERE cart_id = ? AND product_id = ?`,
        [quantity, cart_id, product_id]
      );

      return res.json({
        success: true,
        message: 'Cart item quantity updated successfully'
      });
    }

    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES (?, ?, ?)`,
      [cart_id, product_id, quantity]
    );

    res.status(201).json({
      success: true,
      message: 'Product added to cart successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add product to cart',
      error: error.message
    });
  }
});

app.get('/cart/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
          ci.cart_item_id,
          c.cart_id,
          p.product_id,
          p.product_name,
          p.price,
          ci.quantity,
          (p.price * ci.quantity) AS total_price
       FROM carts c
       JOIN cart_items ci ON c.cart_id = ci.cart_id
       JOIN products p ON ci.product_id = p.product_id
       WHERE c.user_id = ?`,
      [user_id]
    );

    res.json({
      success: true,
      cartItems: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart details',
      error: error.message
    });
  }
});

app.put('/cart/update', async (req, res) => {
  try {
    const { cart_item_id, quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    const [result] = await pool.query(
      `UPDATE cart_items
       SET quantity = ?
       WHERE cart_item_id = ?`,
      [quantity, cart_item_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      message: 'Cart quantity updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update cart quantity',
      error: error.message
    });
  }
});

app.delete('/cart/remove/:cart_item_id', async (req, res) => {
  try {
    const { cart_item_id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM cart_items
       WHERE cart_item_id = ?`,
      [cart_item_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove cart item',
      error: error.message
    });
  }
});

app.post('/signup', async (req, res) => {
  try {
    const { full_name, email, password, phone, role } = req.body;

    const [existingUsers] = await pool.query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const [userResult] = await pool.query(
      `INSERT INTO users (full_name, email, password, phone, role)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, password, phone, role || 'customer']
    );

    const userId = userResult.insertId;

    await pool.query(
      `INSERT INTO carts (user_id)
       VALUES (?)`,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Signup successful',
      userId: userId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message
    });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      `SELECT * FROM users WHERE email = ? AND password = ?`,
      [email, password]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

app.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM products ORDER BY product_id DESC`
    );

    res.json({
      success: true,
      products: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

app.delete('/cart/remove/:cartItemId', async (req, res) => {
  try {
    const { cartItemId } = req.params;

    await pool.query(
      `DELETE FROM cart_items WHERE cart_item_id = ?`,
      [cartItemId]
    );

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove item',
      error: error.message
    });
  }
});

app.post('/products/add', async (req, res) => {
  try {
    const {
      seller_id,
      product_name,
      description,
      price,
      stock,
      category
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO products (seller_id, product_name, description, price, stock, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [seller_id, product_name, description, price, stock, category]
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      productId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add product',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});