const express = require('express');
const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const app = express();

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=car4all;AccountKey=YH7bpQ/zebWRSLoMVWwlrSQFryocY/CcbFR9hM+xkrZmFQt0WvFjGFsudLjwvKzgC1cmZOkv7ZKr+AStmnjGVw==;BlobEndpoint=https://car4all.blob.core.windows.net/;TableEndpoint=https://car4all.table.core.windows.net/;QueueEndpoint=https://car4all.queue.core.windows.net/;FileEndpoint=https://car4all.file.core.windows.net/";
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerName = "car4container";

// Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle image upload
app.post('/upload', upload.single('image'), async (req, res) => {
  const blobName = req.file.originalname;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    const data = req.file.buffer;
    await blockBlobClient.upload(data, data.length);

    // Introduce a delay of 20 seconds before fetching 'result.txt'
    setTimeout(async () => {
      try {
        const resultBlobClient = containerClient.getBlockBlobClient('result.txt');
        const resultText = await resultBlobClient.downloadToBuffer();
        const detectedBrand = resultText.toString();

        res.status(200).send(detectedBrand); // Send the 'result.txt' content as a response after the delay
      } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving result'); // Return error message if retrieval fails
      }
    }, 20000); // 20 seconds delay (20000 milliseconds) before fetching 'result.txt'
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving result'); // Return error message if upload fails
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 