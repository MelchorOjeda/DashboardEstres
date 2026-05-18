import express from 'express';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../public')));

// Configuración de Supabase con tus credenciales desde .env
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint que consulta los datos reales
app.get('/api/data', async (req, res) => {
  try {
    // Consulta a la tabla Salud_Mental que me indicaste
    const { data, error } = await supabase
      .from('Salud_Mental')
      .select('*');

    if (error) {
      console.error('Error consultando Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    // Retorna los datos reales al frontend
    res.json(data);
  } catch (err) {
    console.error('Error del servidor:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});