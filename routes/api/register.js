const express = require('express');
const mongodb = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
const router = express.Router();
require('dotenv').config()
const dbConnection = process.env.DB_CONNECTION



function sgTime(offset){
	const date = new Date();
	let utc = date.getTime() + (date.getTimezoneOffset() * 60000);
	let newDate = new Date(utc + (3600000 * offset));
	return newDate.toLocaleString()
} 

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

router.get('/:id', async (req, res) => {
	try {
		await loadPostsCollection((dbCollection) => {
			//console.log(typeof req.params.id)
			//console.log(req.params.id)
			dbCollection.find({"_id": ObjectId(req.params.id)}).toArray((err,result) => {
				res.send(result)
			})
		});
	} catch (error) {
		console.log(error);
	}
}
)

router.post('/', async (req, res) => {
	const biz = {
		name: req.body.name,
		email: req.body.email,
		date: sgTime('+8')
	}
	if (!biz.name || !biz.email) {
		return res.status(400).json({msg: 'Please include a name and email'})
	} 
	else {
		try { 
			await loadPostsCollection((dbCollection) => {
				dbCollection.insertOne(biz);
				res.status(200);
				
				//console.log(typeof ObjectId(biz._id).toString());
				//console.log(ObjectId(biz._id).toString());
				//console.log(link.concat('hello'));
				//console.log(biz.id);
				let Obj = ObjectId(biz._id).valueOf();
				console.log(typeof Obj);
				res.redirect('/link/' + Obj);
				//res.redirect(301, 'http://127.0.0.1:5000/link/' + ObjectId(biz._id));

				//res.send('registration ok');
			});
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
			const dbObject = client.db('cluster1');
			const dbCollection = dbObject.collection('register'); 
			successCallback(dbCollection);
		}
	})
}


module.exports = router;