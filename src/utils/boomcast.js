const axios = require("axios");
const config = require("../config/config");

const sendOTPUsingBoomCast = async ({ phonenumber, message }) => {
  try {
    const response = await axios.get("http://api.boom-cast.com/boomcast/WebFramework/boomCastWebService/OTPMessage.php", {
      params: {
        masking: "Jntr Sarkar",
        userName: config.boomcast_username,
        password: config.boomcast_password,
        MsgType: "TEXT",
        receiver: phonenumber,
        message: message,
      },
    });
    console.log("Boomcast Response:", response.data);
  } catch (error) {
    console.error("Boomcast Error:", error);
  }
};

module.exports = sendOTPUsingBoomCast;
