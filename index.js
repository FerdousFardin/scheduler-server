const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = process.env.DB_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const eventsCollection = client.db("scheduler").collection("events");
    const usersCollection = client.db("scheduler").collection("users");
    //get all events
    app.get("/events", async (req, res) => {
      const events = await eventsCollection.find({}).toArray();
      res.send({ events: events });
    });
    //add a new event
    app.post("/event", async (req, res) => {
      const eventInfo = req.body;
      const filter = {
        email: eventInfo.email,
        heading: eventInfo.heading,
        type: eventInfo.type,
      };
      const updatedDoc = { $set: eventInfo };
      const options = { upsert: true };
      const result = await eventsCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    //delete an event
    app.delete("/event", async (req, res) => {
      const id = req.query;
      const query = { _id: new ObjectId(id) };
      const result = await eventsCollection.deleteOne(query);
      res.send(result);
    });
    //get user
    app.get("/user", async (req, res) => {
      const userInfo = req.query;
      const users = await usersCollection.find({}).toArray();
      const user = await usersCollection.findOne({
        email: userInfo.email,
        role: userInfo.role,
      });
      console.log({ user, users });
      if (user) res.send({ result: true, user: user });
      else res.send({ result: false });
    });
    //add a new user
    app.post("/user", async (req, res) => {
      const userInfo = req.body;
      const filter = {
        email: userInfo.email,
        role: userInfo.role,
      };
      const updatedDoc = { $set: userInfo };
      const options = { upsert: true };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);
app.get("/", function (req, res) {
  res.send("Hello from scheduler backend. Running on port " + port);
});
app.listen(port, () => {
  console.log("Running on port", port);
});
