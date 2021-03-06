const router = require('express').Router();
const pool = require("../db");
const bcrypt = require('bcrypt');
const jwtGenerator = require('../utils/jwtGenerator');
const validinfo = require('../middleware/validinfo');
const authorize = require('../middleware/authorize');

//registering

router.post("/register",validinfo, async (req, res)=>{
    try {
        //1. destructure the req.body (name,email,password,github)

        const { name,email,github,password} = req.body;
        //2.check if user exixt (if user exist then throw error)
        const user = await pool.query("SELECT * FROM users WHERE user_email = $1 OR user_github = $2",[
            email,
            github
        ]);

        if(user.rows.length !==0){
            return res.status(401).json("user already exist");
        }

        //3.bcrypt the user password

        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);
        const bcryptPassword =await bcrypt.hash(password,salt);

        //4. enter the new user inside our database

        const newUser = await pool.query("INSERT INTO users (user_name,user_email,user_password,user_github)VALUES($1,$2,$3,$4) RETURNING *",[
            name,email,bcryptPassword,github
        ]);

        //res.json(newUser.rows[0]);


        //5. generating our jwt token

        const token = jwtGenerator(newUser.rows[0].user_id);
        res.json({token});
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error");
    }
});

router.post("/login",validinfo, async(req,res)=>{

    try {

        //1. destruct the req.body
        const {email, password} = req.body;


        //2.check if exixst (if not then throw error)
        const user  = await pool.query("SELECT * FROM users WHERE user_email = $1",[
            email
        ]);

        if(user.rows.length === 0 ){
            return res.status(401).json("Email or Password is incorrect");
        }

        //3. check incoming password
        const validPassword = await  bcrypt.compare(password,user.rows[0].user_password);

        if (!validPassword) {
            return res.status(401).json("Email or Password is incorrect"); 
        }


        //4. give jwt token

        const token = jwtGenerator(user.rows[0].user_id);
        res.json({token});
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error"); 
    }
});

router.get("/is-verify",authorize, async (req,res)=>{
    try {
        res.json(true);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error"); 
        
    }
});




module.exports = router;