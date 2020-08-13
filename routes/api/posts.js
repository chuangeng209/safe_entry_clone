const express = require('express');
const mongodb = require('mongodb');
const router = express.Router();
const dbConnection = require('DB_CONNECTION');

function sgTime(offset){
    const date = new Date();
    let utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    let newDate = new Date(utc + (3600000 * offset));
    return newDate.toLocaleString()
} 

//Get Visitors info 
router.get('/', async (req, res) => {
    try{
        await loadPostsCollection((dbCollection) => {
            dbCollection.find({}).toArray((err, result) => {
                res.send(result)
            })
        });
        } catch (error) {
            console.log(error);
        }
    });


//Add Post 
router.post('/:id', async (req, res) => {
    const visitor = { 
        ic: req.body.ic,
        number: req.body.number,
        date: sgTime('+8'),
        status: 'Check-in',
        place_id: req.params.id 
    }
    if (!visitor.ic || !visitor.number) {
        return res.status(400).json({msg: 'Please include a name and email'})
    } 
    else {
        try { 
            await loadPostsCollection((dbCollection) => {
                dbCollection.insertOne(visitor);
                res.status(200);
                res.redirect('http://127.0.0.1:5000/success/' + visitor._id);
            });
            // res.status(201).send();
         } catch (error) {
             console.log(error);
         }
    }
  });


  router.post('/out/:id', async (req, res) => { //check out 
    // need to include , if the user check out beforehand in the unique id, will bring them back to form homepage 
    const visitor = { 
        ic: req.body.ic,
        number: req.body.number,
        date: sgTime('+8'),
        status: 'Check-out',
        place_id: req.params.id 
    }
    if (!visitor.ic || !visitor.number) {
        return res.status(400).json({msg: 'Please include a name and email'})
    } 
    else {
        try { 
            await loadPostsCollection((dbCollection) => {
                dbCollection.insertOne(visitor);
                res.status(200);
                res.redirect('http://127.0.0.1:5000/success/' + visitor._id);
            }
            );
            // res.status(201).send();
         } catch (error) {
             console.log(error);
         }
    }
  });

async function loadPostsCollection(successCallback) { 
    const client = await mongodb.MongoClient.connect(dbConnection, {
        useNewUrlParser: true, // stop warning 
        useUnifiedTopology: true
    }, (err, client) => {
        if (err) { 
            return console.error(err) 
        } else {
            console.log('Connected to db');
            // return client.db('cluster1').collection('posts');
            const dbObject = client.db('cluster1');
            const dbCollection = dbObject.collection('posts'); 
            successCallback(dbCollection);
        }
    })
}


module.exports = router;

