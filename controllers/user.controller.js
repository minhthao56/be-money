const Users = require("../models/user.model");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const TOKEN_SECRET = "weojdjkfjowewejfwefjiwewefj";
const sgMail = require("@sendgrid/mail");
const shortid = require("shortid");
const Finances = require("../models/finance.model");
sgMail.setApiKey(
  "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"
);
//Cloudinary
cloudinary.config({
  cloud_name: "du4arxzzj",
  api_key: "821499727673838",
  api_secret: "hDcEoltxpFdpSkkBeffwV7-Rqso",
});

//Create User
module.exports.createUser = async function (req, res) {
  const email = req.body.email;
  const user = await Users.findOne({ email: email });
  if (user) {
    res.status(400);
    res.json({ msg: "Email already exists" });
  } else {
    req.body.avatarUrl =
      "https://res.cloudinary.com/du4arxzzj/image/upload/v1590497543/user_lp41pe.png";
    req.body.password = bcrypt.hashSync(req.body.password, 10);

    const user = await Users.insertMany(req.body);
    const idUser = user[0]._id.toString();
    const addMoney = {
      idUser: idUser,
      income: [],
      expense: [],
    };
    await Finances.insertMany(addMoney);
    res.json(req.body);
  }
};

//Loign
module.exports.login = async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const user = await Users.findOne({ email: email });
  if (!user) {
    res.status(401);
    res.json({ msg: "Email wrong" });
  } else if (!bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ msg: "Password wrong" });
  } else {
    const token = jwt.sign({ _id: user._id }, TOKEN_SECRET, {
      expiresIn: 24 * 60 * 1000,
    });
    res.json(token);
  }
};

// Check logged
module.exports.checkLoggedIn = async function (req, res) {
  const token = req.headers["auth"];
  if (token === null) {
    res.status(401).json({ msg: "No Token" });
  } else {
    const verified = jwt.verify(token, TOKEN_SECRET);
    const user = await Users.findOne({ _id: verified._id });
    res.json(user);
  }
};
// Update inform user
module.exports.updateInfoUser = async function (req, res) {
  const body = req.body;
  const id = req.tokenPayload._id;

  if (req.file !== undefined) {
    const path = req.file.path;
    let result = await cloudinary.uploader.upload(path, function (
      error,
      result
    ) {
      if (error) {
        res.status(400).json({ msg: "Err server" });
      }
    });
    const avatarUrl = result.url;
    const user = await Users.findByIdAndUpdate(
      { _id: id },
      {
        $set: { avatarUrl: avatarUrl },
      }
    );
    user.avatarUrl = avatarUrl;
    res.json(user);
  }
  if (body.name !== "" && body.name !== "undefined") {
    const name = body.name;
    const user = await Users.findByIdAndUpdate(
      { _id: id },
      {
        $set: { name: name },
      }
    );
    user.name = name;
    res.json(user);
  }
  if (body.email !== "" && body.email !== "undefined") {
    const email = body.email;
    const user = await Users.findByIdAndUpdate(
      { _id: id },
      {
        $set: { email: email },
      }
    );
    res.json(user);
  }
  if (body.pass !== "undefined" && body.pass !== "") {
    const pass = body.pass;
    const password = bcrypt.hashSync(pass, 10);
    const user = await Users.findByIdAndUpdate(
      { _id: id },
      {
        $set: { password: password },
      }
    );
  }
};

module.exports.addCurrencyDefault = async function (req, res) {
  const body = req.body;
  const User = await Users.findOneAndUpdate(
    { _id: body.idUser },
    {
      $set: { defaultCurrency: body.sign },
    }
  );
  res.json(User);
};
// Forget password
module.exports.fogotPass = async function (req, res) {
  const email = req.body.email;
  const pass = shortid.generate();
  const password = bcrypt.hashSync(pass, 10);
  console.log(pass);
  const msg = {
    to: email,
    from: "minhthao1111@outlook.com",
    subject: "New Password",
    text: "You should check your accout and change your password right now.",
    html: "New your passwor is " + pass,
  };

  await Users.findOneAndUpdate(
    {
      email: email,
    },
    { $set: { password: password } }
  );
  await sgMail.send(msg);

  res.json("ok nha");
};
