const axios = require('axios');
const smsConfig = require('../config/smsConfig');

class SMSService {
  constructor() {
    this.config = smsConfig.sonaliSMS;
  }

  async sendSMS(phoneNumber, message) {
    try {
      const params = new URLSearchParams();
      params.append('apikey', this.config.apiKey);
      params.append('secretkey', this.config.secretKey);
      params.append('callerID', this.config.senderId);
      params.append('toUser', phoneNumber);
      params.append('messageContent', message);

      const response = await axios.get(this.config.endpoints.sendSMS, { params });
      
      if (response.data.Status === '0') {
        return {
          success: true,
          messageId: response.data.Message_ID,
          status: response.data.Text
        };
      } else {
        return {
          success: false,
          error: response.data.Text,
          statusCode: response.data.Status
        };
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: 'Failed to send SMS',
        details: error.message
      };
    }
  }

  async checkBalance() {
    try {
      const response = await axios.get(this.config.endpoints.checkBalance, {
        params: {
          client: this.config.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to check SMS balance:', error);
      return null;
    }
  }

  async getSMSStatus(messageId) {
    try {
      const response = await axios.get(this.config.endpoints.checkStatus, {
        params: {
          apikey: this.config.apiKey,
          secretkey: this.config.secretKey,
          messageid: messageId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to check SMS status:', error);
      return null;
    }
  }
}

module.exports = new SMSService();