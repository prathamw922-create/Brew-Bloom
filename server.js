require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '.')));

// Initialize Supabase client securely on the backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_KEY is missing from environment variables.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// --- Fallback Local Data (if Supabase is not yet configured/initialized) ---
const FALLBACK_MENU = [
  { id: 1, title: 'Classic Latte', category: 'hot-brews', price: 150, image: 'assets/specialty_latte_art.png', description: 'Double shot of premium espresso with silky steamed milk and signature latte art.', rating: 4.8, badge: 'Bestseller' },
  { id: 2, title: 'Espresso Doppio', category: 'hot-brews', price: 120, image: 'assets/specialty_latte_art.png', description: 'Intense, aromatic double shot of custom-roasted Arabica beans.', rating: 4.6, badge: 'Classic' },
  { id: 3, title: 'Hazelnut Cappuccino', category: 'hot-brews', price: 160, image: 'assets/specialty_latte_art.png', description: 'Silky foam and rich espresso infused with warm, toasted hazelnut syrup.', rating: 4.7, badge: 'Popular' },
  { id: 4, title: 'Coffee on the Rocks', category: 'cold-brews', price: 170, image: 'assets/specialty_latte_art.png', description: 'Artisanal cold brew poured slowly over crystal-clear carved ice blocks.', rating: 4.9, badge: 'Specialty' },
  { id: 5, title: 'Caramel Frappe', category: 'cold-brews', price: 190, image: 'assets/specialty_latte_art.png', description: 'Blended cold coffee topped with whipped cream and a rich, buttery caramel drizzle.', rating: 4.7, badge: 'Sweet Touch' },
  { id: 6, title: 'Peri Peri Paneer Burger', category: 'fast-food', price: 180, image: 'assets/peri_peri_paneer_burger.png', description: 'Crispy grilled paneer patty with fresh crunch, melted cheddar, and fiery house peri peri sauce.', rating: 4.9, badge: 'Trending' },
  { id: 7, title: 'Veg Club Sandwich', category: 'fast-food', price: 140, image: 'assets/peri_peri_paneer_burger.png', description: 'Three layers of toasted sourdough loaded with fresh vegetables, premium cheese, and herb spread.', rating: 4.5, badge: 'Snack' },
  { id: 8, title: 'Alfredo Pasta', category: 'fast-food', price: 210, image: 'assets/peri_peri_paneer_burger.png', description: 'Penne tossed in a rich, velvety parmesan white sauce with garlic, mushrooms, and herbs.', rating: 4.6, badge: 'Premium' },
  { id: 9, title: 'Nutella Waffle', category: 'desserts', price: 160, image: 'assets/belgian_waffle_berries.png', description: 'Freshly baked crispy Belgian waffle topped generously with warm Nutella and fresh berries.', rating: 4.9, badge: 'Signature' },
  { id: 10, title: 'Blueberry Cheesecake Slice', category: 'desserts', price: 180, image: 'assets/belgian_waffle_berries.png', description: 'Creamy, rich New York-style cheesecake layered with sweet, tart blueberry compote.', rating: 4.8, badge: 'Chef Special' },
  { id: 11, title: 'Red Velvet Smoothie', category: 'refreshers', price: 170, image: 'assets/belgian_waffle_berries.png', description: 'Luxurious blend of vanilla cocoa, sweet strawberries, cream, and red velvet crumbles.', rating: 4.7, badge: 'Sweet Touch' },
  { id: 12, title: 'Mint Lime Mojito', category: 'refreshers', price: 130, image: 'assets/specialty_latte_art.png', description: 'Chilled sparkling soda muddled with fresh mint leaves, zesty key lime, and raw cane sugar.', rating: 4.5, badge: 'Refreshing' }
];

// --- API Routes ---

// Get Menu Items
app.get('/api/menu', async (req, res) => {
  if (!supabase) {
    console.warn('Supabase not configured. Serving local fallback menu.');
    return res.json(FALLBACK_MENU);
  }

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.warn('Database error or table missing, serving local fallback menu. Error:', err.message);
    res.json(FALLBACK_MENU);
  }
});

// Create Reservation
app.post('/api/reservations', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection not configured' });
  }

  const { name, guests, date, time, table_number } = req.body;

  if (!name || !guests || !date || !time || !table_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert([
        { 
          name, 
          guests: parseInt(guests, 10), 
          reservation_date: date, 
          reservation_time: time, 
          table_number 
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json({ message: 'Reservation created successfully', data });
  } catch (err) {
    console.error('Error saving reservation:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
