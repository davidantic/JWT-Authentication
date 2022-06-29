const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json()) // --> metoda koja sluzi da omoguci slanje podataka u postman-body tj koriscenje

const users = [
    {
        id: "1",
        username: "David",
        password: "Daki123",
        isAdmin: true,
    },
    {
        id: "2",
        username: "Sladja",
        password: "Sladja123",
        isAdmin: false,
    }
]



//login route

app.post("/api/login", (req, res) => {
    //uzimam korisnicko ime i sifru od usera
    const { username, password } = req.body;
    const user = users.find((u) => {
        return u.username === username && u.password === password; // vrati ako je username username i sifra sifra
    })
    if (user) {
        //generiram acsessToken
        const accessToken = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "secretKey", { expiresIn: "20s" }) //sending payload expiresIn predstavlja kada korisnik dobije token on se menja za 15s zbog bolje zastitenosti
        const refreshToken = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "refreshSecretKey",)
        refreshTokens.push(refreshToken);
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken,
            refreshToken
        })
    } else {
        res.status(400).json("Username or password incorrect!")
    }
})

let refreshTokens = []

//refreshToken

app.post("/api/refresh", (req, res) => {
    //uzmi refresovan token od usera
    const refreshToken = req.body.token

    //salji gresku ako nema tokena ili je pogresan token 
    if (!refreshToken) return res.status(401).json("You are not authenticated")
    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json("Refresh token is not valid")
    }
    //ako je sve  ok kreiraj novi access token, refresh token i posalji useru
    jwt.verify(refreshToken, "refreshSecretKey", (err, user) => {
        err && console.log(err);
        refreshTokens = refreshTokens.filter(token => token !== refreshToken)

        const newAccessToken = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "secretKey", { expiresIn: "10m" })
        const newRefreshToken = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "refreshSecretKey", { expiresIn: "10m" })

        refreshTokens.push(newRefreshToken);

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    })
})

//verify method
const verify = (req, res, next) => {
    const authHeader = req.headers.authorization; //token
    if (authHeader) {
        const token = authHeader.split(" ")[1];

        jwt.verify(token, "secretKey", (err, user) => {
            if (err) {
                return res.status(401).json("Token is not valid")
            }

            req.user = user;
            next();
        }); //koristi gore secretKey
    } else {
        res.status(401).json("You are not authenticated")
    }
}

//delete route
app.delete("/api/users/:userId", verify, (req, res) => {
    if (req.user.id === req.params.userId || req.user.isAdmin) {
        res.status(200).json("User has been deleted");
    } else {
        res.status(403).json("You are not allowed to delete this user!")
    }
})

//logout

app.post("/api/logout", verify, (req, res) => {
    const refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.status(200).json("You logged out successfully")
})

app.listen(5500, () => console.log("Server started"))