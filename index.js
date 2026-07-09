import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
//import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express();

import cors from 'cors';

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://vercel-fronted-eight.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.options("*", cors());
app.use(express.json())

// function verifyVendor(req, res, next) {
//   const auth = req.headers.authorization;

//   if (!auth) {
//     return res.status(401).json({
//       success: false,
//       message: "Token missing",
//     });
//   }

//   if (auth !== "Bearer vendor-secret-token") {
//     return res.status(403).json({
//       success: false,
//       message: "Unauthorized",
//     });
//   }

//   next();
// }

const PORT = process.env.PORT || 4000

// ---------------- SUPABASE ----------------
console.log("SUPABASE_URL =", process.env.SUPABASE_URL)
console.log("KEY EXISTS =", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ---------------- CATEGORIES ----------------
app.post('/api/categories', async (req, res) => {
  try {
    console.log('CATEGORY BODY =', req.body);

    const { data, error } = await supabase
      .from('categories')
      .insert([
  {
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
])
      .select();

    console.log('CATEGORY DATA =', data);
    
    console.log('CATEGORY ERROR =', error);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json(data[0]);
  } catch (err) {
    console.log('SERVER CATEGORY ERROR =', err);

    res.status(500).json({
      error: err.message,
    });
  }
});

app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*');

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});


// ---------------- HEALTH CHECK ----------------
app.get('/', (req, res) => {
  res.send('iBid backend running with Supabase 🚀')
})

// ---------------- TEST SUPABASE ----------------
app.get('/api/test-supabase', async (req, res) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .limit(5)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ success: true, data })
})

// ---------------- BOOKS (READ ALL + SEARCH) ----------------
app.get('/api/books', async (req, res) => {
  try {
    console.log('BOOKS API HIT');

    const { data, error } = await supabase
      .from('books')
      .select('*');

    console.log('BOOKS DATA =', data);
    console.log('BOOKS ERROR =', error);

    if (error) {
      return res.status(500).json({
        error: error.message,
        fullError: error
      });
    }

    res.json(data);

  } catch (err) {
    console.log('SERVER ERROR =', err);

    res.status(500).json({
      error: err.message
    });
  }
});

// ---------------- SINGLE BOOK ----------------
app.get('/api/books/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error) {
    return res.status(404).json({ error: error.message })
  }

  res.json(data)
})

// ---------------- CREATE BOOK ----------------
app.post('/api/books', async (req, res) => {
    console.log('BOOK DATA =', req.body)
  const book = req.body
if (!book.slug || book.slug.trim() === '') {
  book.slug = book.title
    .toLowerCase()
    .replace(/\s+/g, '-');
}
 console.log("BOOK SLUG =", book.slug)

const { data, error } = await supabase
  .from('books')
  .insert([book])
  .select()
 console.log('SUPABASE ERROR =', error)
  console.log('SUPABASE DATA =', data)
  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json(data[0])
})

// ---------------- UPDATE BOOK ----------------
app.put('/api/books/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('books')
    .update(req.body)
    .eq('id', req.params.id)
    .select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data[0])
})

// ---------------- DELETE BOOK ----------------
app.delete('/api/books/:id', async (req, res) => {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', req.params.id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ success: true, message: 'Book deleted' })
})
//api supabase.js
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required'
      })
    }

    // check user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password,
          role: 'Shopper'
        }
      ])
      .select()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const newUser = data[0]

    res.status(201).json({
      token: `ibid-user-token-${newUser.id}`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
app.post('/api/auth/login', async (req, res) => {
  console.log("LOGIN BODY =", req.body);
  try {
    const { email, password } = req.body

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (error || !data) {
      return res.status(401).json({
        error: 'Invalid email or password'
      })
    }

    res.json({
      token: `ibid-user-token-${data.id}`,
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role
      }
    })

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

//user api
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')

    if (error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.json(data)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})
// VENDORS API
app.get('/api/vendors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'Vendor');

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});
app.put('/api/vendors/:id', async (req, res) => {
  console.log("VENDOR ID =", req.params.id);
  console.log("BODY =", req.body);

  const { data, error } = await supabase
    .from('users')
    .update(req.body)
    .eq('id', req.params.id)
    .select();

  console.log("DATA =", data);
  console.log("ERROR =", error);

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

 res.json(data?.[0] || null);
});
app.put('/api/vendors/:id/approve', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_approved: true
    })
    .eq('id', req.params.id)
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data[0]);
});

// VENDOR register API

app.post("/api/vendor/register", async (req, res) => {
  try {
    console.log("🔥 REQUEST BODY =", req.body);

    const { name, email, password, shop_name, phone, address } = req.body;

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password,
          shop_name,
          phone,
          address,
          role: "Vendor",
          is_approved: true,
          is_active: true,
        },
      ])
      .select();
//--------------------changes here ----------
    if (error) {
      console.log("🔥 SUPABASE ERROR =", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "Vendor registered successfully. Wait for admin approval.",
      data: data[0],
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// VENDOR LOGIN API

app.post('/api/vendor/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .eq('role', 'Vendor')
      .single();

    if (error || !data) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!data.is_approved) {
      return res.status(403).json({
        success: false,
        message: "Admin approval pending",
      });
    }

   return res.json({
  success: true,
  vendor: data,
});

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
// // categories api4
// app.post('/api/categories', async (req, res) => {
//   const { data, error } = await supabase
//     .from('categories')
//     .insert([
//       {
//         ...req.body,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       }
//     ])
//     .select();

//   if (error) return res.status(500).json({ error: error.message });

//   res.json(data[0]);
// });

app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*');

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

app.put('/api/categories/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .update({
  ...req.body,
  updated_at: new Date().toISOString(),
})
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data[0]);
});


app.delete('/api/categories/:id', async (req, res) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});
//order api
// app.post('/api/orders', async (req, res) => {
//   console.log('BODY =', req.body)

// ---------------- SUBCATEGORIES ----------------

app.get('/api/subcategories', async (req, res) => {
 const { data, error } = await supabase
  .from('subcategories')
  .select(`
    *,
    categories (
      id,
      title
    )
  `);

  console.log('DATA =', data);
  console.log('ERROR =', error);

  if (error) {
    return res.status(500).json({
      error: error.message,
      fullError: error,
    });
  }

  res.json(data);
});

app.post('/api/subcategories', async (req, res) => {
  const { data, error } = await supabase
    .from('subcategories')
    .insert([
      {
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json(data[0]);
});

app.put('/api/subcategories/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('subcategories')
    .update({
      ...req.body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json(data[0]);
});


app.delete('/api/subcategories/:id', async (req, res) => {
  const { error } = await supabase
    .from('subcategories')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json({ success: true });
});
//order api
app.post('/api/orders', async (req, res) => {
  console.log('BODY =', req.body)

  try {
   const { user_id, total, items } = req.body;
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
           user_id: user_id || null,
          total,
          items,
          status: 'Pending'
          
        }
      ])
      .select()

    if (error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(201).json(data[0])

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})


// =============================
// GET VENDOR ORDERS
// =============================
app.get("/api/vendor/orders/:vendorId", async (req, res) => {
  try {
    const vendorId = Number(req.params.vendorId);

    // Orders lao
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    // Sirf wahi orders rakho jisme vendor ke products hain
 const vendorOrders = orders
  .map((order) => {
    const vendorItems = (order.items || []).filter(
      (item) => Number(item.vendor_id) === vendorId
    );

    if (vendorItems.length === 0) return null;

    return {
      ...order,
      items: vendorItems,
      total: vendorItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      ),
    };
  })
  .filter(Boolean);

    res.json({
      success: true,
      orders: vendorOrders,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ---------------- GET PRODUCTS ----------------
app.get('/api/products', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*');

  console.log("GET ERROR =", error);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// ---------------- ADMIN PENDING PRODUCTS ----------------
app.get("/api/admin/pending-products", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("approval_status", "Pending");

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json({
    success: true,
    products: data,
  });
});

// ---------------- APPROVE PRODUCT ----------------
app.put("/api/admin/products/:id/approve", async (req, res) => {

  const { data, error } = await supabase
    .from("products")
    .update({
      approval_status: "Approved",
      is_active: true,
    })
    .eq("id", req.params.id)
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json({
    success: true,
    product: data[0],
  });

});


app.get("/api/vendor/products/:vendorId", 
  async (req, res) => {
  try {
    const { vendorId } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("id", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      products: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
app.get('/api/products/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json(data);
});

// ---------------- CREATE PRODUCT ----------------
app.post("/api/products",
  async (req, res) => {
  console.log("PRODUCT DATA =", req.body);

  const product = req.body;

// Vendor ID save karo
product.vendor_id = Number(product.vendor_id);

 delete product.slug;
  const { data, error } = await supabase
    .from("products")
    
    .insert([product])
    .select();
  console.log("INSERT ERROR =", error);
  console.log("INSERT DATA =", data);
  if (error) {
    return res.status(500).json({ error: error.message,
       details: error
    });
  }

  res.status(201).json(data[0]);
});

//--------------post product
app.put("/api/products/:id", async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...req.body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json(data[0]);
});

app.delete("/api/products/:id", async (req, res) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json({ success: true });
});
// GET ALL ORDERS
app.get('/api/orders', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*');

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});


// GET SINGLE ORDER
app.get('/api/orders/:id', async (req, res) => {
  const id = Number(req.params.id);

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  if (!data) return res.status(404).json({ error: "Order not found" });

  res.json(data);
});
//dashboard
app.get('/api/dashboard', async (req, res) => {
  const { data: books } = await supabase.from('books').select('*')
  const { data: users } = await supabase.from('users').select('*')
  const { data: orders } = await supabase.from('orders').select('*')
  const monthlyRevenue = {};

orders?.forEach((order) => {
  const month = new Date(order.created_at).toLocaleString("default", {
    month: "short",
  });

  monthlyRevenue[month] =
    (monthlyRevenue[month] || 0) + Number(order.total || 0);
});
const productSales = {};

orders?.forEach((order) => {
  order.items?.forEach((item) => {
    const title = item.title;

    productSales[title] =
      (productSales[title] || 0) + Number(item.quantity || 1);
  });
});

const topSellingProducts = Object.entries(productSales)
  .map(([title, sold]) => ({
    title,
    sold,
  }))
  .sort((a, b) => b.sold - a.sold)
  .slice(0, 5);
const revenueChart = Object.keys(monthlyRevenue).map((month) => ({
  month,
  revenue: monthlyRevenue[month],
}));
  const { data: products } = await supabase
  .from("products")
  .select("*")
  .order("created_at", { ascending: false });

  const { data: categories } = await supabase
  .from("categories")
  .select("*");

  const { data: subcategories } = await supabase
  .from("subcategories")
  .select("*");

  const { data: vendors } = await supabase
  .from("users")
  .select("*")
  .eq("role", "Vendor");
  const totalRevenue =
    orders?.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    ) || 0

  const recentOrders =
    orders?.slice(-5).reverse() || []

 res.json({
  totalBooks: books?.length || 0,
  totalUsers: users?.length || 0,
  totalOrders: orders?.length || 0,
  totalRevenue,

  totalProducts: products?.length || 0,

  totalCategories: categories?.length || 0,

  totalSubcategories: subcategories?.length || 0,

  totalVendors: vendors?.length || 0,

  pendingProducts:
    products?.filter(
      p => p.approval_status === "Pending"
    ).length || 0,

  approvedProducts:
    products?.filter(
      p => p.approval_status === "Approved"
    ).length || 0,

  rejectedProducts:
    products?.filter(
      p => p.approval_status === "Rejected"
    ).length || 0,

  recentOrders,
  latestProducts: products?.slice(0, 5) || [],
  monthlyRevenue: revenueChart,
  topSellingProducts,
});
})

app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('ADMIN LOGIN BODY =', req.body)

    const { email, password } = req.body

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .eq('role', 'Admin')
      .single()

    console.log('ADMIN FOUND =', data)
    console.log('ADMIN ERROR =', error)

    if (error || !data) {
      return res.status(401).json({
        error: 'Invalid admin credentials'
      })
    }

    res.json({
      token: `admin-token-${data.id}`,
      user: data
    })
  } catch (err) {
    console.log('SERVER ERROR =', err)
    res.status(500).json({
      error: err.message
    })
  }
}) 
// ---------------- START SERVER ----------------
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`iBid backend running on http://localhost:${PORT}`);
  });
}
console.log("SERVER FILE RUNNING");
export default app;