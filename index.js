const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 6969;
const admin = require("firebase-admin");
const serviceAccount = require("./travel-tour-2a594-firebase-adminsdk-a8tvh-9af6e0e2cd.json");

//middle wires
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function verifyToken(req, res, next) {
  if (req.headers.authorization.startsWith("Bearer ")) {
    const idToken = req.headers.authorization.split("Bearer ")[1];
    try {
      const decodedUserToken = await admin.auth().verifyIdToken(idToken);
      req.decodedUser = decodedUserToken;
    } catch (error) {}
  }
  next();
}

//connecting to database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xqghz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    //Database
    const database = client.db("travel-tour");
    // Service Collection
    const serviceCollection = database.collection("services");
    //Carousel Collection
    const carouselCollection = database.collection("carousel");
    //Review Collection
    const reviewsCollection = database.collection("review");
    //bookInfo Collection
    const bookInfoCollection = database.collection("booked");

    // service get api
    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find({}).toArray();
      res.send(result);
    });

    //carousel get api
    app.get("/carousel", async (req, res) => {
      const result = await carouselCollection.find({}).toArray();
      res.send(result);
    });

    //review get api
    app.get("/review", async (req, res) => {
      const result = await reviewsCollection.find({}).toArray();
      res.send(result);
    });

    //single id get api
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });
    //bookded get api
    app.get("/myOrder", verifyToken, async (req, res) => {
      const email = req.query.email;

      if (req.decodedUser.email === email) {
        const result = await bookInfoCollection
          .find({ userEmail: email })
          .toArray();
        res.send(result);
      }
    });
    //manage Orders get api
    app.get("/manageOrders", async (req, res) => {
      const result = await bookInfoCollection.find({}).toArray();
      res.send(result);
    });
    //booking post api
    app.post("/book", async (req, res) => {
      const bookInfo = req.body;
      const result = await bookInfoCollection.insertOne(bookInfo);
      res.json(result);
    });

    //service post api
    app.post("/addService", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.json(result);
    });
    //delete order api
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookInfoCollection.deleteOne(query);
      res.json(result);
      //update api
    });
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const order = req.body;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          state: order.state,
          userName: order.userName,
          userEmail: order.userEmail,
          travelAddress: order.travelAddress,
          userAddress: order.userAddress,
        },
      };
      const result = await bookInfoCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Travel Tour Server is Working");
});

app.listen(port, () => {
  console.log(`Server working at port : ${port}`);
});
