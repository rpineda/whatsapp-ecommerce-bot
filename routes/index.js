'use strict';
const router = require('express').Router();
const request = require('request');
// const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const WhatsappCloudAPI = require('./../../whatsappcloudapi/index.js');
const Whatsapp = new WhatsappCloudAPI({
    accessToken: process.env.Meta_WA_accessToken,
    senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
    WABA_ID: process.env.Meta_WA_wabaId,
});

const RandomGeoLocations = require('../utils/geolocation_MOCK_DATA.json');

class EcommerceStore {
    constructor() {
        this.baseUrl = 'https://fakestoreapi.com';
    }

    async getAllProducts() {}
    async getProductById(productId) {
        return new Promise((resolve, reject) => {
            request.get(
                `${this.baseUrl}/products/${productId}`,
                (err, res, body) => {
                    if (err) {
                        throw reject({
                            status: 'failed',
                            err,
                        });
                    } else {
                        let product = JSON.parse(body);

                        let output = {
                            status: 'success',
                            data: product,
                        };

                        resolve(output);
                    }
                }
            );
        });
    }
    async getAllCategories() {
        return new Promise((resolve, reject) => {
            request.get(
                `${this.baseUrl}/products/categories?limit=10`,
                (err, res, body) => {
                    if (err) {
                        throw reject({
                            status: 'failed',
                            err,
                        });
                    } else {
                        let categories = JSON.parse(body);
                        // shuffle the categories
                        categories = categories.sort(() => Math.random() - 0.5);
                        // [1, 2, 3, 4].sort(() => (Math.random() > 0.5) ? 1 : -1)
                        console.log({
                            categories: categories.length,
                        });
                        resolve({
                            status: 'success',
                            data: categories,
                        });
                    }
                }
            );
        });
    }
    async getProductsInCategory(categoryId) {
        return new Promise((resolve, reject) => {
            request.get(
                `${this.baseUrl}/products/category/${categoryId}?limit=10`,
                (err, res, body) => {
                    if (err) {
                        throw reject({
                            status: 'failed',
                            err,
                        });
                    } else {
                        let products = JSON.parse(body);
                        // shuffle the products
                        products = products.sort(() =>
                            Math.random() > 0.5 ? 1 : -1
                        );
                        console.log({
                            products: products.length,
                        });
                        let output = {
                            status: 'success',
                            data: products,
                        };

                        resolve(output);
                    }
                }
            );
        });
    }
}

router.get('/meta_wa_callbackurl', (req, res) => {
    console.log('GET:Someone is pinging me!');

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (
        mode &&
        token &&
        mode === 'subscribe' &&
        process.env.Meta_WA_VerifyToken === token
    ) {
        // Respond with the challenge token from the request
        return res.status(200).send(challenge);
    } else {
        return res.sendStatus(403);
    }
});

router.post('/meta_wa_callbackurl', async (req, res) => {
    console.log('POST: Someone is pinging me!');
    // return res.status(200).send('OK'); //BLANQX
    let Store = new EcommerceStore();

    try {
        let data = Whatsapp.parseMessage(req.body);

        if (data && !data.isNotificationMessage) {
            let recipientNumber = data.message.from; // extract the phone number from the webhook payload
            let typeOfMsg = data.msgType;
            let message_id = data.message.id;

            if (typeOfMsg === 'textMessage') {
                // let msg_body = data.message.text.body; // extract the message text from the webhook payload`
                let msg_body = JSON.stringify(data);
                let nameOfSender = data.contacts.profile.name;
                // await Whatsapp.sendText({
                //     message: `Hello ${nameOfSender}\nReceived a message. Now here is an automated reply: ${msg_body}`,
                //     recipientNumber: recipientNumber,
                //     message_id,
                // });

                let listOfButtons = [
                    {
                        title: 'List some products',
                        id: 'see_products',
                    },
                    {
                        title: 'Track my order',
                        id: 'track_order',
                    },
                    {
                        title: 'Speak to a human',
                        id: 'speak_to_human',
                    },
                ];
                await Whatsapp.sendButtons({
                    message: `Hey ${nameOfSender}, \nYou are speaking to a chatbot.\nWhat do you want to do next?`,
                    recipientNumber: recipientNumber,
                    message_id,
                    listOfButtons,
                });

                // Respond by sending buttons to the user
            } else if (typeOfMsg === 'mediaMessage') {
                await Whatsapp.sendText({
                    message: `Received a media message.`,
                    recipientNumber: recipientNumber,
                });
            } else if (typeOfMsg === 'locationMessage') {
                await Whatsapp.sendText({
                    message: `Received a location message.`,
                    recipientNumber: recipientNumber,
                });
            } else if (typeOfMsg === 'contactMessage') {
                await Whatsapp.sendText({
                    message: `Received a contact message.`,
                    recipientNumber: recipientNumber,
                });
            } else if (typeOfMsg === 'stickerMessage') {
                await Whatsapp.sendText({
                    message: `Received a sticker message.`,
                    recipientNumber: recipientNumber,
                });
            } else if (typeOfMsg === 'adMessage') {
                await Whatsapp.sendText({
                    message: `Received an ad message.`,
                    recipientNumber: recipientNumber,
                });
            } else if (typeOfMsg === 'quickReplyMessage') {
                await Whatsapp.sendText({
                    message: `Received a quick reply message.`,
                    recipientNumber: recipientNumber,
                });
            } else if (typeOfMsg === 'listMessage') {
                // which product is the user interested in?
                // Respond with an image of the product and a button to buy it directly from the chatbot
                let selectedRadioBtn = data.message.list_reply;
                let item = selectedRadioBtn?.id.split('_');
                let [item_id, item_category, userAccount] = item;

                // get product from store
                let product = await Store.getProductById(item_id);

                let price = product.data.price;
                let title = product.data.title;
                let description = product.data.description;
                let category = product.data.category;
                let imageUrl = product.data.image;
                let emojiRating = () => {
                    let rating = product.data.rating;
                    Math.floor(rating);
                    //loop
                };

                await Whatsapp.sendImage({
                    recipientNumber,
                    url: imageUrl,
                    message: `_title_: *${title}*\n\n\n_price_: $${price}\n\n\n_description_: ${description}\n\n\n_category_:${category}\n\n\n`,
                });
                // console.log({
                //     product,
                //     rating: product.data.rating
                // });
                // ⭐⭐⭐⭐ 4.8
                await Whatsapp.sendText({
                    message: `Received a list message.`,
                    recipientNumber: recipientNumber,
                });
            } else if (typeOfMsg === 'replyButtonMessage') {
                let selectedButton = data.message.button_reply;

                switch (selectedButton.id) {
                    case 'see_products':
                        // respond with a list of products
                        let categories = await Store.getAllCategories();
                        if (categories.status !== 'success') {
                            await Whatsapp.sendText({
                                message: `Sorry, I could not get the categories.`,
                                recipientNumber: recipientNumber,
                                message_id,
                            });
                        }
                        // limit to 3 categories
                        let listOfCategories = categories.data.slice(0, 3);

                        let _listOfSections = async () => {
                            return Promise.all(
                                listOfCategories.map(async (category) => {
                                    let product =
                                        await Store.getProductsInCategory(
                                            category
                                        );
                                    if (product.status === 'success') {
                                        return {
                                            title: `Top 3 in #${category}`.substring(
                                                0,
                                                24
                                            ),
                                            rows: product.data.map(
                                                (product) => {
                                                    let trackable_id = `${product.id
                                                        .toString()
                                                        .substring(
                                                            0,
                                                            256
                                                        )}_${category}_${recipientNumber}`;
                                                    let title = (() =>
                                                        `${product.title.substring(
                                                            0,
                                                            21
                                                        )}...`)();
                                                    let description = (() => {
                                                        let price =
                                                            product.price;
                                                        let description =
                                                            product.description;
                                                        let output =
                                                            `$${price}\n${description}`.substring(
                                                                0,
                                                                69
                                                            );
                                                        return `${output}...`;
                                                    })();
                                                    return {
                                                        id: trackable_id,
                                                        title,
                                                        description,
                                                    };
                                                }
                                            ),
                                        };
                                    }
                                })
                            );
                        };
                        let listOfSections = await _listOfSections();
                        listOfSections = listOfSections.map((section) => {
                            return {
                                title: section.title,
                                rows: section.rows.slice(0, 3),
                            };
                        });
                        console.log({
                            len: listOfSections.length,
                        });

                        await Whatsapp.sendList({
                            recipientNumber: recipientNumber,
                            headerText: 'Black Friday Top 3 of 3',
                            bodyText:
                                'We have great products lined up for you based on your previous shopping history.\nPlease select one of the products below.',
                            footerText: 'Powered by: Blanqx LLC',
                            listOfSections,
                        });
                        break;
                    case 'track_order':
                        // respond with a list of georaphical locations of orders

                        let oneLocation =
                            RandomGeoLocations[
                                Math.floor(
                                    Math.random() * RandomGeoLocations.length
                                )
                            ];
                        await Whatsapp.sendText({
                            recipientNumber: recipientNumber,
                            message: `Your order is on the way. Here is where we are at now:`,
                        });
                        await Whatsapp.sendLocation({
                            recipientNumber: recipientNumber,
                            latitude: oneLocation.latitude,
                            longitude: oneLocation.longitude,
                            name: 'Mom-N-Pop Shop',
                            address: oneLocation.address,
                        });
                        break;
                    case 'speak_to_human':
                        // respond with a list of human resources
                        await Whatsapp.sendText({
                            recipientNumber: recipientNumber,
                            message: `Not to brag, but unlike humans, chatbots are super fast⚡, we never sleep, never rest, never take lunch🍽 and can multitask.\n\nAnway don't fret, a hoooooman will 📞contact you soon.\n\nWanna blast☎ his/her phone😈?\nHere are the contact details:`,
                        });

                        await Whatsapp.sendContact({
                            recipientNumber: recipientNumber,
                        });
                        break;
                    default:
                        await Whatsapp.sendText({
                            recipientNumber: recipientNumber,
                            message:
                                'Sorry, I did not understand your request.',
                        });

                        break;
                }
            }

            await Whatsapp.markMessageAsRead({
                message_id,
            });

            return res.sendStatus(200);
        } else if (data && data.isNotificationMessage) {
            console.log('got notification');

            return res.sendStatus(200);
        } else {
            console.log('No data');
            return res.sendStatus(500);
        }
    } catch (error) {
        console.error({ error });
        return res.sendStatus(404);
    }
});

router.get('/qr', async (req, res) => {
    // createQRCodeMessage
    let msg = req.query.msg;

    if (msg) {
        let results = await Whatsapp.createQRCodeMessage({
            message: msg,
        });

        return res.status(200).send(results);
    } else {
        return res.status(400).send('No message provided');
    }
});

module.exports = router;