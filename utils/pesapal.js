const axios = require('axios');

const PESAPAL_CONFIG = {
  CONSUMER_KEY: process.env.PESAPAL_CONSUMER_KEY,
  CONSUMER_SECRET: process.env.PESAPAL_CONSUMER_SECRET,
  BASE_URL: 'https://cybqa.pesapal.com/pesapalv3'
};

function splitFullName(fullName) {
  const parts = fullName.trim().split(' ');
  return {
    first_name: parts[0] || 'Guest',
    middle_name: parts.slice(1, -1).join(' ') || '',
    last_name: parts[parts.length - 1] || ''
  };
}

async function getAccessToken() {
  const res = await axios.post(`${PESAPAL_CONFIG.BASE_URL}/api/Auth/RequestToken`, {
    consumer_key: PESAPAL_CONFIG.CONSUMER_KEY,
    consumer_secret: PESAPAL_CONFIG.CONSUMER_SECRET
  }, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
  });
  return { token: res.data.token };
}

async function getNotificationId(token, callbackUrl) {
  const res = await axios.post(`${PESAPAL_CONFIG.BASE_URL}/api/URLSetup/RegisterIPN`, {
    url: callbackUrl,
    ipn_notification_type: 'GET'
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });
  return { ipn_id: res.data.ipn_id };
}

async function getMerchantOrderUrl(details, token, baseUrl) {
  const names = splitFullName(details.customerName);
  const payload = {
    id: details.merchantReference,
    currency: 'KES',
    amount: details.amount,
    description: details.description,
    callback_url: `${baseUrl}/api/pesapal/callback`,
    notification_id: details.notification_id,
    billing_address: {
      phone_number: details.phoneNumber,
      country_code: 'KE',
      email_address: 'noreply@revup.com',
      first_name: names.first_name,
      middle_name: names.middle_name,
      last_name: names.last_name,
      line_1: 'Nairobi',
      city: 'Nairobi',
      postal_code: '00100',
      state: 'Nairobi'
    }
  };

  const res = await axios.post(`${PESAPAL_CONFIG.BASE_URL}/api/Transactions/SubmitOrderRequest`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });

  return {
    order_tracking_id: res.data.order_tracking_id,
    redirect_url: res.data.redirect_url
  };
}

async function getTransactionStatus(orderTrackingId, token) {
  const res = await axios.get(`${PESAPAL_CONFIG.BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  return res.data;
}

module.exports = {
  getAccessToken,
  getNotificationId,
  getMerchantOrderUrl,
  getTransactionStatus
};
