 const express = require('express');
const router = require('./routers/Inventory');
const bodyParser = require('body-parser');

const app=express();
app.use(express.json());

app.use('/apiV1', router); // Mount the router at /api
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
