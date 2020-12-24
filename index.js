const express = require('express');
const path = require('path')
const { v4: uuidv4 } = require('uuid');
const exphbs = require('express-handlebars')
const fetch = require('node-fetch');
const app = express()
const QRCode = require('qrcode')
const logger = require('./middleware/logger')
const helmet = require('helmet')


require('dotenv').config()

//const cookieParser = require('cookie-parser');
const session = require('express-session');

//app.use(cookieParser());
app.use(session({
    secret: 'positronx',
    saveUninitialized: false,
    resave: false
}));


app.use(helmet())
app.use(logger)
app.use(express.static(path.join(__dirname, 'public')))

//to handle json data 
app.use(express.json())
//to handle url encoded data
app.use(express.urlencoded({extended: false}))

//Hander bars middle ware 
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');



///////////////////////////////////////////////////////////////////////////

//////////////////////////////Display web page/////////////////////////////////////////////
//sequence impt 

template = process.env.HOST_LINK || 'http://localhost:' + process.env.PORT // process.env.HOST_LINK || || 'http://localhost:5000' only this will change 

let url = new URL(template + '/api/register');
let form_api = new URL(template + '/api/posts'); 
let form_url = new URL(template + '/form'); 
let checkout_url = new URL(template + '/checkout'); 
let home_url = new URL (template);



//register biz for fake entry to visitors
app.get('/registration', (req,res) => 
{
    res.render('register', {
        success: req.session.success,
        errors: req.session.errors,
        })        
    req.session.errors = null;
}
);


////Link to qr code - register collection 
app.get('/link/:id', (req,res) => {
    let urlId = url+'/' +req.params.id;
    let homeId = home_url + req.params.id;
    api(urlId)
    function api(input) {
        return fetch(input).then(res => res.json()).then(data => {
            //console.log(data.name)

            QRCode.toDataURL(homeId, function (err, url) {
                res.render('link', {
                    name: data.name,
                    qrcodelink: homeId,
                    qrcode: url
                })
              })

        }).catch((error) => console.log(error));
    }
});



// landing page - entry of the location  , have check in or checkout options 
app.get('/:id', (req,res) => {
    let urlId = url+'/'+ req.params.id;
    let formId = form_url + '/' +req.params.id;
    let checkoutId = checkout_url + '/' +req.params.id
    api(urlId)
    function api(input) {

        return fetch(input).then(res => res.json()).then(data => {
            

            res.render('index', {
                name: data[0].name,
                qrcodelink: formId,
                checkoutlink: checkoutId
            })
        }).catch((error) => console.log(error));
    }
});

// Form page - checkin - entry of the location
app.get('/form/:id', (req,res) => {
    let urlId = url+'/'+req.params.id
    let backId = home_url + req.params.id
    //console.log(typeof req.params.id)
    api(urlId)
    function api(input) {
        return fetch(input).then(res => res.json()).then(data => {
            //console.log(data[0])
            res.render('form', {
                name: data[0].name,
                back: backId,
                api: form_api + '/' + req.params.id, // 'http://127.0.0.1:5000/api/posts/sadsadsa
                checktype: 'Check In',
                success: req.session.success,
                errors: req.session.errors,
            })
            req.session.errors = null;
            
        }).catch((error) => 
        console.log(error))
    }
});


// CHeck out form - if user need to type to check out 
app.get('/checkout/:id', (req,res) => {
    let urlId = url+'/'+ req.params.id
    let backId = home_url + req.params.id
    //console.log(typeof req.params.id)
    api(urlId)
    function api(input) {
        return fetch(input).then(res => res.json()).then(data => {
            res.render('form', {
                name: data[0].name,
                back: backId,
                api: form_api + '/checkout/' + req.params.id, // 'http://127.0.0.1:5000/api/posts/checkout/sadsadsa
                checktype: 'Check Out'
            })
        }).catch((error) => console.log(error));
    }
});



//After succesfull check in -- show status 
app.get('/success/:id', (req,res) => { // check in 
    status_link = form_api + '/' + req.params.id
    api(status_link)
    function api(input) {
        return fetch(input).then(
            res => res.json()).then(data => {

            if (data[0].status == 'Check-in') {
                res.render('success', {
                    name: data[0].place_name,
                    date: data[0].date,
                    status: data[0].status,
                    api: form_api + '/out/' + req.params.id, 
                    checkOut: true
                })
            } else {

                console.log(data);

                res.render('success', {
                    name: data[0].place_name,
                    date: data[0].date,
                    status: data[0].status,
                    api: form_api + '/out/' + req.params.id, 
                    checkOut: false
                })
            }
        }).catch((error) => console.log(error));
    }
});



// need to check if user checkout object vairable or not , if not redirect him / her to the checkout form  
//page view once user checkout  
app.get('/complete/:id', (req,res) => { //check out 
    api(form_api+ '/' + req.params.id)
    function api(input) {
        return fetch(input).then(res => res.json()).then(data => {
            //console.log(data)
            res.render('checkout', {
                name: data[0].place_name,
                date: data[0].date,
                status: data[0].status, 
            })
        }).catch((error) => console.log(error));
    }
});


//create api route 
const posts = require('./routes/api/posts');
const register = require('./routes/api/register');
app.use('/api/posts', posts);
app.use('/api/register', register);



const PORT = process.env.PORT || 3000; //look for port in environment (deploy) || in dev in 5000 
app.listen(PORT, () => console.log(`server started on ${PORT}`));



