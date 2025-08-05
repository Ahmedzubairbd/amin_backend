module.exports = {
  sonaliSMS: {
    apiKey: 'YOUR_API_KEY', // Replace with your actual API key
    secretKey: 'YOUR_SECRET_KEY', // Replace with your actual secret key
    senderId: 'YOUR_SENDER_ID', // Replace with your approved sender ID
    endpoints: {
      sendSMS: 'http://api.sonalisms.com:7788/sendtext',
      checkStatus: 'http://api.sonalisms.com:7788/getstatus',
      checkBalance: 'http://api.sonalisms.com/sms/smsConfiguration/smsClientBalance.jsp'
    }
  }
};