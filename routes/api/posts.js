const express = require('express');
const mongodb = require('mongodb');
const router = express.Router();
const ObjectId = require('mongodb').ObjectId;

const session = require('express-session');
const { check, validationResult } = require('express-validator');



require('dotenv').config()
const dbConnection = process.env.DB_CONNECTION


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


//get post _id

router.get('/:id', async (req, res) => {
	try {
		await loadPostsCollection((dbCollection) => {

			dbCollection.find({"_id": ObjectId(req.params.id)}).toArray((err,result) => {
				res.send(result)
			})
		});
	} catch (error) {
		console.log(error);
	}
}
)

//Add Post - check in --> done 
router.post('/:id', 
	[
		check('ic').custom((ic, {req}) => {

			let icFormat = /^[stfgSTFG]\d{7}[a-zA-Z]$/;
			if (!icFormat.test(ic) || ic.length != 9) {
				throw new Error('Please key in IC properly')
			} else {
				return true
			}			
		}),	
		check('number').custom((val, {req, loc, path}) => {			
			var num_format = /^[0-9]{8}$/;
			if (!num_format.test(val) || val.length !== 8) {
				throw new Error ('Number is required')
			} else {
				return true
			}
		}),
	],
	 async (req, res) => {
	
		let errors = validationResult(req).array();

		//console.log(typeof(errors))

		if (errors.length != 0) {

			//console.log(errors.length)

			req.session.errors = errors;
			req.session.success = false;


			//console.log(req.body.name);

			return res.redirect('/form/' + req.params.id);
			
		} else {

			//console.log(req.params)

			const visitor = { 
				ic: req.body.ic,
				number: req.body.number,
				date: sgTime('+8'),
				status: 'Check-in',
				place_id: req.params.id,
				place_name: req.body.name
			}

			//console.log(visitor)

			req.session.success = true; 
		
			//only case that pass 
			try { 
				await loadPostsCollection((dbCollection) => {
					dbCollection.insertOne(visitor);
					//console.log('post test', visitor)
					//console.log('test visitor id', ObjectId(visitor._id).valueOf());
					res.status(200);
					//console.log('test visitor id', ObjectId(visitor._id).valueOf());

					return res.redirect('/success/' + ObjectId(visitor._id).valueOf());
				});
			} catch (error) {
				console.error(error);
			}



		}


  });






// KIV
//Add Post for checkout - manually key in 
router.post('/checkout/:id', 
[
	check('ic').custom((ic, {req}) => {
		//console.log(ic)
		let icFormat = /^[stfgSTFG]\d{7}[a-zA-Z]$/;
		if (!icFormat.test(ic) || ic.length != 9) {
			throw new Error('Please key in IC properly')
		} else {
			return true
		}			
	}),	
	check('number').custom((val, {req, loc, path}) => {			
		var num_format = /^[0-9]{8}$/;
		if (!num_format.test(val) || val.length !== 8) {
			throw new Error ('Number is required')
		} else {
			return true
		}
	}),
],
async (req, res) => {

	let errors = validationResult(req).array();


	if (errors.length != 0) {


		req.session.errors = errors;
		req.session.success = false;

		return res.redirect('/form/' + req.params.id);
		
	} else {

	const visitor = { 
		ic: req.body.ic,
		number: req.body.number,
		date: sgTime('+8'),
		status: 'Check-out',
		place_name: req.body.name 
	}


	req.session.success = true; 



		try { 
			await loadPostsCollection((dbCollection) => {
				dbCollection.insertOne(visitor);
				//console.log(visitor)
				res.status(200);
				res.redirect('/success/' + ObjectId(visitor._id).valueOf());
			});
			// res.status(201).send();
		 } catch (error) {
			 console.log(error);
		 }

		}
  });



// when user use the check in already link 
router.post('/out/:id', async (req, res) => { //check out using the link  
	try {
		await loadPostsCollection((dbCollection) => {
			dbCollection.find({"_id": ObjectId(req.params.id)}).toArray((err,result) => {
				//console.log(result[0])
				const outgoing = {
					ic: result[0].ic,
					number: result[0].number,
					date: sgTime('+8'),
					status: 'Check-out',
					check_in_user_id: result[0]._id,
					place_id: result[0].place_id, 
					place_name: result[0].place_name
				}
				try { 
					 	loadPostsCollection((dbCollection) => {
					        dbCollection.insertOne(outgoing);
							res.status(200);
							//res.send("ok");
					        res.redirect('/complete/' + ObjectId(outgoing._id).valueOf());
					    }
					    );
					    // res.status(201).send();
					 } catch (error) {
					     console.log(error);
					 }	
			})
		});
	} catch (error) {
		console.log(error);
	}

}
);


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
