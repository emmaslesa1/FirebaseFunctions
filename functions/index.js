const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");

const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "places.json");


const admin = require('firebase-admin');
var serviceAccount = require("./permissions.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const express = require('express');
const app = express();
const db = admin.firestore();

const cors = require('cors');
app.use(cors({origin: true}));


//routes
app.get('/hello-world', (req, res) => {
    return res.status(200).send('Hello World!');
});

//create
/*
app.post('/api/create', (req,res) => {
    (async () => {
        try{
            await db.collection('locations').doc('/' + req.body.id + '/').create({
                name: req.body.name,
                lat: req.body.lat,
                lng: req.body.lng,
                tags: req.body.tags
            })
            return res.status(200).send();
        }
        catch(error){
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});
*/

const collectionName = 'places'; 

// Create a new entry in Firestore
app.post('/api/create', (req,res) => {
    (async () => {
  try {
    const data = req.body; 
    const docRef = await db.collection(collectionName).add(data);
    return res.status(200).json({ message: 'Place created successfully', id: docRef.id });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})();
});

// Create a new place in places.json
app.post("/api/createJson", (req, res) => {
    try {
      const newPlace = req.body; 
      const rawData = fs.readFileSync(dataFile);
      const places = JSON.parse(rawData);
  
      const existingPlace = places.find((place) => place.name === newPlace.name);
      if (existingPlace) {
        return res.status(400).json({ error: "Place already exists" });
      }
  
      places.push(newPlace);
  
      fs.writeFileSync(dataFile, JSON.stringify(places, null, 2));
  
      return res.status(201).json({ message: "Place created successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

//read

// Read a single place by name from places.json
app.get("/api/readJson/:name", (req, res) => {
    try {
      const nameToFind = req.params.name;
  
      const rawData = fs.readFileSync(dataFile);
      const places = JSON.parse(rawData);
  
      const foundPlace = places.find((place) => place.name === nameToFind);
  
      if (!foundPlace) {
        return res.status(404).json({ error: "Place not found" });
      }
  
      return res.status(200).json(foundPlace);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

// Read a single item by name
app.get('/api/read/:name', (req,res) => {
    (async () => {
  try {
    const name = req.params.name; // Assuming you pass the name as a query parameter
      const querySnapshot = await db.collection(collectionName).where('name', '==', name).get();
  
      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'Place not found' });
      }
  
      const placeData = querySnapshot.docs[0].data();
      return res.status(200).json(placeData);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})();
});

// Read all places from places.json
app.get("/api/readAllJson", (req, res) => {
    try {
      const rawData = fs.readFileSync(dataFile);
      const places = JSON.parse(rawData);
      return res.status(200).json(places);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

// Read all places from Firestore
app.get('/api/readAll', async (req, res) => {
    try {
      const querySnapshot = await db.collection(collectionName).get();
      const places = [];
  
      querySnapshot.forEach((doc) => {
        places.push(doc.data());
      });
  
      return res.status(200).json(places);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Update a place by name in places.json
app.put("/api/updateJson/:name", (req, res) => {
    try {
      const name = req.params.name;
      const data = req.body;
  
      const rawData = fs.readFileSync(dataFile);
      const places = JSON.parse(rawData);
  
      const index = places.findIndex((place) => place.name === name);
  
      if (index === -1) {
        return res.status(404).json({ error: "Place not found" });
      }
  
      places[index] = data;
  
      fs.writeFileSync(dataFile, JSON.stringify(places, null, 2));

      return res.status(200).json({ message: "Place updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
  
  // Update a place by name
app.put('/api/update/:name', async (req, res) => {
    try {
      const name = req.params.name; 
      const data = req.body; 
  
      const querySnapshot = await db.collection(collectionName).where('name', '==', name).get();
  
      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'Place not found' });
      }
  
      const docRef = querySnapshot.docs[0].ref;
      await docRef.update(data);
      return res.status(200).json({ message: 'Place updated successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Delete a place by name in places.json
app.delete("/api/deleteJson/:name", (req, res) => {
    try {
      const name = req.params.name;
  
      const rawData = fs.readFileSync(dataFile);
      const places = JSON.parse(rawData);
  
      const index = places.findIndex((place) => place.name === name);
  
      if (index === -1) {
        return res.status(404).json({ error: "Place not found" });
      }
  
      places.splice(index, 1);
  
      fs.writeFileSync(dataFile, JSON.stringify(places, null, 2));
  
      return res.status(200).json({ message: "Place deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

// Delete a place by name
app.delete('/api/delete/:name', async (req, res) => {
    try {
      const name = req.params.name; 
  
      const querySnapshot = await db.collection(collectionName).where('name', '==', name).get();
  
      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'Place not found' });
      }
  
      const docRef = querySnapshot.docs[0].ref;
      await docRef.delete();
      return res.status(200).json({ message: 'Place deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

//export the api to firebase functions
exports.app = onRequest(app);
 

exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
