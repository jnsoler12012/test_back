require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
var cors = require('cors');
const productRoutes = require('./routes/product');

const app = express();

var corsOptions = {
    origin: '*'
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api', productRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));