const express = require('express');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zavbous.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const userCollection = client.db("bistro_boss").collection("users");
    const menuCollection = client.db("bistro_boss").collection("menu");
    const reviewsCollection = client.db("bistro_boss").collection("reviews");
    const cartsCollection = client.db("bistro_boss").collection("carts");
    const paymentsCollection = client.db("bistro_boss").collection("payments");


    // jwt related api

    app.post('/jwt', async(req, res) =>{
      const user = req.body;
      const token = jwt.sign(req.body, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({token});
    });

    // middleware to verify jwt
    const verifyToken = (req, res, next) => {
      const authorization = req.headers.authorization;
      if (!authorization) {
        return res.status(401).send({ message: 'Unauthorized' });
      }
      const token = authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'Unauthorized' });
        }
        req.decoded = decoded;
        next();
      });
    };
    


    // users collection api

    app.get('/users', verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: 'Forbidden' });
      }
      const query = { email: email };
      const result = await userCollection.findOne(query);
      let isAdmin = false;
      if (result?.role === 'admin') {
        isAdmin = true;
      }
      res.send({ isAdmin });
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: 'Forbidden' });
      }
      next();
    };

    app.post('/users', verifyToken, async (req, res) => {
      const user = req.body;
      if (req.decoded.email !== user.email) {
        return res.status(403).send({ message: 'Forbidden' });
      }

      // Check if the user already exists based on email
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists' });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.get('/menu/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollection.findOne(query);
      res.send(result);
    });

    app.patch('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const item = req.body;
      const updatedData = {
        $set: {
          name: item.name,
          price: item.price,
          category: item.category,
          recipe: item.recipe,
          image: item.image
        }
      };
      const filter = { _id: new ObjectId(id) };
      const result = await menuCollection.updateOne(filter,  updatedData);
      res.send(result);
    });

    app.post('/menu', verifyToken, verifyAdmin, async (req, res) => {
      const newItem = req.body;
      const result = await menuCollection.insertOne(newItem);
      res.send(result);
    });

    app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    });

    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // cart collection api

    app.get('/carts', verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });



    app.post('/carts', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });

    // payment intent api

    app.post('/create-payment-intent', verifyToken, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card'],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });


    
    app.get('/payments/:email', verifyToken, async (req, res) => {
      const query = { email: req.params.email }
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const result = await paymentsCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/payments', verifyToken, async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      // Also remove the items from the cart
      const query = { _id: 
        { $in: payment.cartIds.map(id => new ObjectId(id)) 

        } 
      };

      const deleteResult = await cartsCollection.deleteMany(query);
      console.log(deleteResult);

      res.send({ result, deleteResult });
      
    });


    // state of analytics api

    app.get('/admin-stats', verifyToken, verifyAdmin, async (req, res) => {
      const users = await userCollection.estimatedDocumentCount();
      const menuItems = await menuCollection.estimatedDocumentCount();
      const orders = await paymentsCollection.estimatedDocumentCount();

      /* const payments = await paymentsCollection.find().toArray();
      const revenue = payments.reduce((sum, payment) => sum + payment.price, 0); */

      const result = await paymentsCollection.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$price" }
          }
        }
      ]).toArray();

      const revenue = result.length > 0 ? result[0].totalRevenue : 0;

      res.send({ users, menuItems, orders, revenue });
    });


    
    // order status
    /**
     * ----------------------------
     *    NON-Efficient Way
     * ------------------------------
     * 1. load all the payments
     * 2. for every menuItemIds (which is an array), go find the item from menu collection
     * 3. for every item in the menu collection that you found from a payment entry (document)
    */

    // using aggregate pipeline
    app.get('/order-stats', verifyToken, verifyAdmin, async(req, res) =>{
      const result = await paymentsCollection.aggregate([
        {
          $unwind: '$menuItemIds'
        },
        {
          $lookup: {
            from: 'menu',
            localField: 'menuItemIds',
            foreignField: '_id',
            as: 'menuItems'
          }
        },
        {
          $unwind: '$menuItems'
        },
        {
          $group: {
            _id: '$menuItems.category',
            quantity:{ $sum: 1 },
            revenue: { $sum: '$menuItems.price'} 
          }
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            quantity: '$quantity',
            revenue: '$revenue'
          }
        }
      ]).toArray();

      res.send(result);

    })


    await client.db("bistro_boss").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

/*
*-------------------------
NAMING CONVENTION
*-------------------------
app.get('/users') => usersCollection.find()
app.get('/users/:id') => usersCollection.findOne({ _id: new ObjectId(id) })
app.post('/users') => usersCollection.insertOne()
app.put('/users/:id') => usersCollection.replaceOne({ _id: new ObjectId(id) }, updatedData)
app.patch('/users/:id') => usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData })
app.delete('/users/:id') => usersCollection.deleteOne({ _id: new ObjectId(id) })
*/


