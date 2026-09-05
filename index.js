const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');

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
    const menuCollection = client.db("bistro_boss").collection("menu");
    const reviewsCollection = client.db("bistro_boss").collection("reviews");
    const cartsCollection = client.db("bistro_boss").collection("carts");

    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });


    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // cart collection api

    app.get('/carts', async (req, res) => {
      const result = await cartsCollection.find().toArray();
      res.send(result);
    });
    

    app.post('/carts', async (req, res) => {
      const item = req.body;
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    });



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


