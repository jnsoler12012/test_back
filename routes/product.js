const express = require("express");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

function serializeValue(value) {
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
    }
    return value;
}

router.post('/products', authenticateToken, async (req, res) => {
    const productData = req.body;

    try {
        const title = productData.title
        if (!title) {
            return res.status(400).json({ message: 'Product must have a title or name' });
        }

        // Check if product with same title/name exists (no user_id)
        const [existing] = await db.query(
            'SELECT * FROM products WHERE title = ?',
            [title, title]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Product title/name already exists' });
        }

        const columns = [];
        const placeholders = [];
        const values = [];

        for (const [key, value] of Object.entries(productData)) {
            columns.push(key);
            placeholders.push('?');
            values.push(serializeValue(value));
        }

        const sql = `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;

        await db.query(sql, values);

        res.status(201).json({ message: 'Product created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// READ all products (no user filtering)
router.get("/products", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM products");

        const products = rows.map(p => {
            const parsed = { ...p };
            ['colors', 'sizes', 'photos'].forEach(field => {
                if (parsed[field]) {
                    try {
                        parsed[field] = JSON.parse(parsed[field]);
                    } catch { }
                }
            });
            return parsed;
        });

        res.json(products);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
});

// READ one product by ID (no user filtering)
router.get("/products/:id", authenticateToken, async (req, res) => {
    const productId = req.params.id;

    try {
        const [rows] = await db.query(
            "SELECT * FROM products WHERE id = ?",
            [productId]
        );

        if (rows.length === 0)
            return res.status(404).json({ message: "Product not found" });

        const product = rows[0];
        ['colors', 'sizes', 'photos'].forEach(field => {
            if (product[field]) {
                try {
                    product[field] = JSON.parse(product[field]);
                } catch { }
            }
        });

        res.json(product);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// UPDATE product by ID (no user filtering)
router.put('/products/:id', authenticateToken, async (req, res) => {
    const productId = req.params.id;
    const productData = req.body;

    try {
        const title = productData.title;
        if (!title) {
            return res.status(400).json({ message: 'Product must have a title or name' });
        }

        // Check for duplicate title/name, excluding current product
        const [existing] = await db.query(
            'SELECT * FROM products WHERE (title = ?) AND id != ?',
            [title, productId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Product title/name already exists' });
        }

        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(productData)) {
            updates.push(`${key} = ?`);
            values.push(serializeValue(value));
        }
        values.push(productId);

        const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;

        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        console.log(err);
        
        res.status(500).json({ message: err });
    }
});

// DELETE product by ID (no user filtering)
router.delete("/products/:id", authenticateToken, async (req, res) => {
    const productId = req.params.id;

    try {
        const [result] = await db.query(
            "DELETE FROM products WHERE id = ?",
            [productId]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ message: "Product not found" });

        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
