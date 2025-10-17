require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const connectDB = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("SkinTone Amazon API Server is running.");
});

app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);

app.get("/api/search", async (req, res) => {
  const { gender = "male", category = "Trending", page = 1 } = req.query;
  try {
    let searchCategory = '';
    if (category === 'Accessories') {
      searchCategory = 'spectacles+watches+belts+rings+bracelets+neck+chains';
    } else if (category === 'Casuals') {
      searchCategory = 'casuals+shirts+jeans+chinos+t-shirts+polos+shorts';
    } else if (category === 'Party') {
      searchCategory = 'party+jeans+blazer+shirts+pants';
    } else if (category === 'Formal'){
      searchCategory = 'formal+silk+shirts+satin+shirts+trousers';
    } else if (category === 'Trending') {
      searchCategory = 'trending+shirts+t-shirts+pants+hoodies+sweatshirts';
    }

    const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${searchCategory}+${gender}+clothing&page=${page}&country=IN&sort_by=BEST_SELLERS`;

    const response = await axios.get(url, {
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
      },
    });

    const products = response.data?.data?.products || [];

    res.status(200).json({
      products,
      totalPages: 10,
    });
  } catch (error) {
    console.error("Error fetching from Amazon API:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
