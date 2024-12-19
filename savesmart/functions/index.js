/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const axios = require("axios");

exports.getNearbyStores = functions.https.onRequest(async (req, res) => {
  const {lat, lng, radius} = req.query;
  const apiKey = "YOUR_GOOGLE_API_KEY"; // Replace with your actual API key

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
      params: {
        location: `${lat},${lng}`,
        radius,
        type: "supermarket",
        key: apiKey,
      },
    });

    res.status(200).send(response.data);
  } catch (error) {
    console.error("Error fetching nearby stores:", error);
    res.status(500).send("Error fetching nearby stores");
  }
});
