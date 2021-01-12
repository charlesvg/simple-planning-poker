import express = require('express');
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
import session = require('express-session');
import multer = require('multer');


const router = express.Router()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
// const username = 'makawifi';
// const pwd = 'makawifi!';
//
// const adminUser = 'makaioe';
// const adminPass = 'makaioe!';

router.use(cookieParser());
router.use(bodyParser.urlencoded({extended: true}));
router.use(session({
    secret: 'somethingrandom456',
    resave: false,
    saveUninitialized: false
}));

router.post('/login', (req, res) => {
    const session = req.session as any;

    console.log('session', session ? true : false, 'req', req.body);

    if (req.session && req.body && req.body.username && req.body.room) {
        session.isLoggedIn = true;
        session.username = req.body.username;
        session.room = req.body.room;
        res.redirect('/poker.html');
        res.end();
    } else {
        res.redirect('/index.html')
        res.end();
    }

});

router.get('/room', (req, res) => {
    const session = req.session as any;
    if (session) {
        res.json({room: session.room});
    } else {
        res.json({room: 'error-room-undefined'});
    }
});

//
// router.use((req, res, next) => {
//     const session = req.session as any;
//     if (session && session.isLoggedIn) {
//         next();
//     } else {
//         res.redirect('/index.html')
//         res.end();
//     }
// });
//
// router.get('/keys.html', (req, res, next) => {
//     const session = req.session as any;
//     if (session && session.isAdmin) {
//         next();
//     } else {
//         res.redirect('/index.html')
//         res.end();
//     }
// });
//
// router.get('/isAdmin', (req, res) => {
//     const session = req.session as any;
//     res.json({
//         "isAdmin": (session && session.isAdmin) ? 'true' : 'false'
//     });
// });
//
//
// router.get('/logout', (req, res) => {
//     const session = req.session as any;
//     if (session) {
//         session.isLoggedIn = false;
//         session.isAdmin = false;
//     }
//     res.redirect('index.html');
//     res.end();
// });
//



export default router;
