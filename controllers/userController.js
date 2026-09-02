const User = require("../models/User");

const profile = async (req, res) => {

    res.json({

        success: true,

        message: "Profile Loaded",

        user: req.user

    });

};

// const savePushToken = async (req, res) => {

//     try {

//         const { expoPushToken } = req.body;

//         await User.findByIdAndUpdate(

//             req.user.id,

//             {
//                 expoPushToken
//             }

//         );

//         res.json({

//             success: true,

//             message: "Push Token Saved"

//         });

//     } catch (err) {

//         res.status(500).json({

//             success: false,

//             message: err.message

//         });

//     }

// };
const savePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({
        success: false,
        message: "Push token is required"
      });
    }

    await User.findByIdAndUpdate(
      req.user.id,
      {
        $addToSet: {
          expoPushTokens: expoPushToken
        }
      }
    );

    res.json({
      success: true,
      message: "Push Token Saved"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = {

    profile,
    savePushToken

};