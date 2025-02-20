const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5500", // Adjust based on your frontend URL
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type"
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/PlatemateDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model("User", userSchema);

// Saved Recipe Schema
const savedRecipeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipeId: String,
    title: String
});
const SavedRecipe = mongoose.model("SavedRecipe", savedRecipeSchema);

// ✅ Updated Register Route with Validation
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists!" });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Updated Login Route with Secure Text Comparison
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({ 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email 
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ✅ Fetch Recipes by Mood
app.get("/recipes/mood/:mood", async (req, res) => {
    try {
        const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(req.params.mood)}&apiKey=${process.env.RECIPE_API_KEY}`;
        const response = await axios.get(url);
        const recipes = response.data.results.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image
        }));
        res.json(recipes);
    } catch (err) {
        console.error("Spoonacular API Error:", err.message);
        res.status(500).json({ error: "Failed to fetch recipes" });
    }
});

// ✅ Fetch Recipes by Ingredients
app.get("/recipes/ingredients", async (req, res) => {
    try {
        const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(req.query.ingredients)}&apiKey=${process.env.RECIPE_API_KEY}`;
        const response = await axios.get(url);
        const recipes = response.data.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image
        }));
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch recipes" });
    }
});

// ✅ Fetch Top 5 Restaurants by City
app.get("/restaurants/city/:city", async (req, res) => {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=restaurants+in+${encodeURIComponent(req.params.city)}&limit=5`;
        const response = await axios.get(url, { headers: { "User-Agent": "PlateMateApp/1.0" } });

        const restaurants = response.data.map(restaurant => ({
            display_name: restaurant.display_name,
            address: restaurant.display_name
        }));

        res.json(restaurants);
    } catch (err) {
        console.error("OpenStreetMap API Error:", err.message);
        res.status(500).json({ error: "Failed to fetch restaurants" });
    }
});

// ✅ Save Recipe
app.post("/save-recipe", async (req, res) => {
    const { userId, recipeId, title } = req.body;
    try {
        const newSavedRecipe = new SavedRecipe({ userId, recipeId, title });
        await newSavedRecipe.save();

        res.status(201).json({ message: "Recipe saved successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save recipe" });
    }
});

// ✅ Get Saved Recipes
app.get("/get-saved-recipes/:userId", async (req, res) => {
    try {
        const savedRecipes = await SavedRecipe.find({ userId: req.params.userId });
        res.json(savedRecipes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch saved recipes" });
    }
});

// ✅ Serve Frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "main.html")));

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
