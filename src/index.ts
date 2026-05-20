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
    let allData: any[] = [];
    let from = 0;
    let to = 999;
    let hasMore = true;

    // Bucle para traer de 1,000 en 1,000 todos los registros de la base de datos
    while (hasMore) {
      const { data, error } = await supabase
        .from('Salud_Mental')
        .select('*')
        .range(from, to);

      if (error) {
        console.error('Error consultando Supabase:', error);
        return res.status(500).json({ error: error.message });
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        
        // Si el lote devuelto es menor a 1,000, significa que ya trajimos el último bloque
        if (data.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
          to += 1000;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`Consulta exitosa: Enviando ${allData.length} registros al frontend`);
    res.json(allData);
  } catch (err) {
    console.error('Error del servidor:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint de diagnóstico temporal
app.get('/api/debug', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('Salud_Mental')
      .select('*', { count: 'exact', head: true });
    
    res.json({
      url: supabaseUrl,
      keyLength: supabaseKey.length,
      keyPrefix: supabaseKey.substring(0, 15) + '...',
      count,
      error
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});