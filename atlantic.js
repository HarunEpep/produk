const axios = require("axios");
const config = require("./config");

const BASE_URL = "https://atlantich2h.com";

const parseError = (err) => err?.response?.data ? JSON.stringify(err.response.data) : (err.message || String(err));

async function createDeposit({ amount, orderId, paymentMethod = 'QRIS' }) {
  const url = `${BASE_URL}/deposit/create`;

  const formData = new URLSearchParams();
  formData.append('api_key', config.ATLANTIC_API_KEY);
  formData.append('nominal', amount.toString());
  formData.append('reff_id', orderId);
  formData.append('metode', paymentMethod); // QRIS, BCA, BRI, dll

  try {
    const { data } = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    if (!data || data.status !== 'success') {
      throw new Error(data.message || "Respons tidak valid dari server Atlantic Pedia.");
    }

    // Atlantic Pedia deposit response format
    return {
      id: data.data?.id,
      reff_id: data.data?.reff_id,
      nominal: data.data?.nominal,
      metode: data.data?.metode,
      qr_string: data.data?.qr_string,
      qr_image: data.data?.qr_image,
      status: data.data?.status || 'pending',
      expired_at: data.data?.expired_at
    };

  } catch (err) {
    err.message = "createDeposit Atlantic: " + parseError(err);
    throw err;
  }
}

async function cancelDeposit({ depositId }) {
  const url = `${BASE_URL}/deposit/cancel`;

  const formData = new URLSearchParams();
  formData.append('api_key', config.ATLANTIC_API_KEY);
  formData.append('id', depositId);

  try {
    const { data } = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    if (!data || data.status !== 'success') {
      throw new Error(data.message || "Gagal membatalkan deposit.");
    }

    return data.data;

  } catch (err) {
    err.message = "cancelDeposit Atlantic: " + parseError(err);
    throw err;
  }
}

async function checkDepositStatus({ depositId }) {
  const url = `${BASE_URL}/deposit/status`;

  const formData = new URLSearchParams();
  formData.append('api_key', config.ATLANTIC_API_KEY);
  formData.append('id', depositId);

  try {
    const { data } = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    if (!data || data.status !== 'success') {
      throw new Error(data.message || "Gagal mendapatkan status deposit.");
    }

    const depositData = data.data;

    // Atlantic Pedia status: pending, success, failed, expired
    if (depositData.status === 'success') {
      return { status: 'PAID', deposit: depositData };
    } else if (depositData.status === 'failed' || depositData.status === 'expired') {
      return { status: 'FAILED', deposit: depositData };
    } else {
      return { status: 'PENDING', deposit: depositData };
    }

  } catch (err) {
    err.message = "checkDepositStatus Atlantic: " + parseError(err);
    throw err;
  }
}

async function createQris({ amount, orderId }) {
  return await createDeposit({ amount, orderId, paymentMethod: 'QRIS' });
}

async function getTransactionDetail({ orderId }) {
  // Untuk backward compatibility, kita perlu mencari deposit berdasarkan reff_id
  // Tapi Atlantic Pedia API tidak punya endpoint untuk search by reff_id
  // Kita akan return mock response untuk sementara
  return {
    status: 'pending',
    message: 'Status check via deposit ID'
  };
}

async function checkPaymentStatus(orderId) {
  // Untuk backward compatibility dengan kode yang ada
  // Kita perlu implementasi yang lebih kompleks untuk tracking berdasarkan reff_id
  return { status: 'PENDING', error: 'Use deposit ID for status check' };
}

module.exports = {
  createDeposit,
  cancelDeposit,
  checkDepositStatus,
  createQris,
  getTransactionDetail,
  checkPaymentStatus
};