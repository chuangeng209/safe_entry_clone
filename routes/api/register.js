const express = require('express');
const mongodb = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
const router = express.Router();
require('dotenv').config()
const dbConnection = process.env.DB_CONNECTION

const session = require('express-session');
const { check, validationResult } = require('express-validator');




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

			dbCollection.find({"_id": ObjectId(req.params.id)}).toArray((err,result) => {
				res.send(result)
			})
		});
	} catch (error) {
		console.log(error);
	}
}
)

router.post('/', 
	[
		check('name').not().isEmpty().withMessage('Name is required'),
		check('email', 'Email is required').isEmail()
	],
async (req, res) => {
	let errors = validationResult(req).array();

	if (errors.length != 0) {


		//console.log(errors.length);

		req.session.errors = errors;
		req.session.success = false;

		return res.redirect('/registration');
	} else {
		const biz = {
			name: req.body.name,
			email: req.body.email,
			date: sgTime('+8')
		}

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