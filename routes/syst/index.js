'use strict';
const router = require('express').Router();


const EcommerceStoreSyst = require('./../../utils/ecommerce-syst');
let Store = new EcommerceStoreSyst();
const CustomerSession = new Map();

router.post('/login', async (req, res) => {
    console.log('POST: Login in api stock SYST');

    try {
        let apiToken = await Store.getApiToken();
        console.log(apiToken);
        return res.sendStatus(200);
    } catch (error) {
        console.error({ error });
        return res.sendStatus(500);
    }
})

// Pending Create a get Categories
// check if access_token exist verify epiredate 
// and return categories to whatsapp
// auth: rpineda

module.exports = router;