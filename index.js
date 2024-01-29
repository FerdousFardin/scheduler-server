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
    const schedulesCollection = client.db("scheduler").collection("schedules");

    app.get("/events", async (req, res) => {
      const reqQuery = req.query;
      let query = {};
      switch (reqQuery) {
        case "email":
          query.email = req.query.email;
          break;
        default:
          query = {};
          break;
      }
      const events = await eventsCollection.find(query).toArray();
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
      });
      console.log({ user, users });
      if (user && user.role === userInfo.role)
        res.send({ result: true, user: user });
      else if (user && user.role !== userInfo.role)
        res.send({ result: false, user: "Wrong Role" });
      else {
        const result = await usersCollection.insertOne({
          email: userInfo.email,
          role: userInfo.role,
        });
        if (result.acknowledged)
          res.send({
            result: true,
            user: { email: userInfo.email, role: userInfo.role },
          });
      }
    });
    //add a new user
    app.post("/user", async (req, res) => {
      const userInfo = req.body;
      const filter = {
        email: userInfo.email,
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

    //find schedules
    app.get("/schedules", async (req, res) => {
      const reqQuery = req.query;
      let query = {};
      switch (reqQuery) {
        case "email":
          query.email = req.query.email;
          break;
        default:
          query = {};
          break;
      }
      const schedules = await schedulesCollection.find(query).toArray();
      res.send(schedules);
    });
    //add or edit a new schedule
    app.post("/schedules", async (req, res) => {
      const scheduleInfo = req.body;
      const filter = {
        "schedule.start": { $eq: scheduleInfo.schedule.start },
        "schedule.end": { $eq: scheduleInfo.schedule.end },
        email: { $eq: scheduleInfo.email },
      };
      const updatedDoc = { $set: scheduleInfo };
      const options = { upsert: true };
      const result = await schedulesCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    //delete a schedule
    app.delete("/schedules", async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const result = await schedulesCollection.deleteOne(query);
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
