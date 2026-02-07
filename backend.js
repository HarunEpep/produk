const express = require('express');
const axios = require('axios');
const config = require('./config');
const atlantic = require('./atlantic');
const ptero = require('./ptero');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// In-memory storage for pending deposits
const pendingDeposits = new Map();

// Helper function to generate unique order ID
function generateOrderId() {
    return `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to get package specs
function getPackageSpecs(packageCode) {
    const specs = config.PACKAGE_SPECS;
    return specs[packageCode] || null;
}

// Helper function to calculate price
function getPackagePrice(packageCode) {
    const prices = config.PACKAGE_PRICES;
    return prices[packageCode] || 0;
}

// API Endpoint: Create Deposit/QRIS
app.get('/create-deposit', async (req, res) => {
    try {
        const { amount, package: packageCode } = req.query;

        if (!amount && !packageCode) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter amount atau package diperlukan'
            });
        }

        let finalAmount = parseInt(amount);
        let packageSpecs = null;

        if (packageCode) {
            packageSpecs = getPackageSpecs(packageCode);
            if (!packageSpecs) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Paket tidak valid'
                });
            }
            finalAmount = getPackagePrice(packageCode);
        }

        if (finalAmount <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Amount tidak valid'
            });
        }

        const orderId = generateOrderId();

        console.log(`🔄 Membuat deposit QRIS untuk amount ${finalAmount} - Order ID: ${orderId}`);

        // Create deposit using Atlantic Pedia
        const depositData = await atlantic.createDeposit({
            amount: finalAmount,
            orderId: orderId,
            paymentMethod: 'QRIS'
        });

        // Store deposit data
        pendingDeposits.set(depositData.id, {
            depositId: depositData.id,
            orderId: orderId,
            packageCode: packageCode || 'custom',
            packageSpecs: packageSpecs,
            amount: finalAmount,
            depositData: depositData,
            createdAt: new Date(),
            status: 'pending'
        });

        console.log(`✅ Deposit berhasil dibuat - Deposit ID: ${depositData.id}`);

        res.json({
            status: 'success',
            deposit_id: depositData.id,
            qr_image: depositData.qr_image,
            qr_string: depositData.qr_string,
            order_id: orderId,
            amount: finalAmount,
            expired_at: depositData.expired_at
        });

    } catch (error) {
        console.error('❌ Error creating deposit:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Gagal membuat deposit: ' + error.message
        });
    }
});

// API Endpoint: Check Deposit Status
app.get('/deposit-status/:depositId', async (req, res) => {
    try {
        const { depositId } = req.params;

        if (!depositId) {
            return res.status(400).json({
                status: 'error',
                message: 'Deposit ID diperlukan'
            });
        }

        console.log(`🔍 Checking deposit status - Deposit ID: ${depositId}`);

        const statusResult = await atlantic.checkDepositStatus({ depositId });

        if (statusResult.status === 'PAID') {
            console.log(`✅ Deposit paid for ID ${depositId}`);

            // Get deposit info from storage
            const depositInfo = pendingDeposits.get(depositId);
            if (depositInfo && depositInfo.packageSpecs) {
                // Create Pterodactyl server
                try {
                    const serverName = `server_${Date.now()}`;
                    const email = `user_${Date.now()}@ichanstore.com`;
                    const username = serverName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const password = Math.random().toString(36).slice(-12) + 'A1!';

                    console.log(`🔄 Creating Pterodactyl user: ${username}`);

                    const user = await ptero.createUser({
                        email: email,
                        username: username,
                        first_name: serverName,
                        last_name: 'Panel',
                        password: password,
                        root_admin: false
                    });

                    console.log(`✅ User created with ID: ${user.id}`);

                    const server = await ptero.createServer({
                        name: serverName,
                        description: `Panel ${depositInfo.packageSpecs.label} - Auto Created`,
                        userId: user.id,
                        ram: depositInfo.packageSpecs.ram.toString(),
                        disk: depositInfo.packageSpecs.disk,
                        cpu: depositInfo.packageSpecs.cpu,
                        featureLimits: depositInfo.packageSpecs.unlimited ? {
                            databases: 0,
                            backups: 0,
                            allocations: 0
                        } : {
                            databases: 5,
                            backups: 5,
                            allocations: 1
                        },
                        isPrivate: false
                    });

                    console.log(`✅ Server created with ID: ${server.id}`);

                    // Remove from pending deposits
                    pendingDeposits.delete(depositId);

                    return res.json({
                        status: 'success',
                        message: 'Pembayaran berhasil! Server telah dibuat.',
                        payment_status: 'PAID',
                        server: {
                            id: server.id,
                            username: username,
                            password: password,
                            server_name: serverName
                        }
                    });

                } catch (serverError) {
                    console.error('❌ Error creating server:', serverError.message);
                    return res.json({
                        status: 'partial_success',
                        message: 'Pembayaran berhasil tapi gagal membuat server: ' + serverError.message,
                        payment_status: 'PAID'
                    });
                }
            }
        }

        res.json({
            status: 'success',
            payment_status: statusResult.status,
            deposit: statusResult.deposit
        });

    } catch (error) {
        console.error('❌ Error checking deposit status:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Gagal check status deposit: ' + error.message
        });
    }
});

// API Endpoint: Cancel Deposit
app.post('/cancel-deposit', async (req, res) => {
    try {
        const { depositId } = req.body;

        if (!depositId) {
            return res.status(400).json({
                status: 'error',
                message: 'Deposit ID diperlukan'
            });
        }

        console.log(`🗑️ Cancelling deposit - Deposit ID: ${depositId}`);

        await atlantic.cancelDeposit({ depositId });

        // Remove from pending deposits
        pendingDeposits.delete(depositId);

        res.json({
            status: 'success',
            message: 'Deposit berhasil dibatalkan'
        });

    } catch (error) {
        console.error('❌ Error cancelling deposit:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Gagal membatalkan deposit: ' + error.message
        });
    }
});

// Legacy endpoint for backward compatibility
app.get('/cetakqris', async (req, res) => {
    try {
        const { harga } = req.query;

        if (!harga) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter harga diperlukan'
            });
        }

        const packageSpecs = getPackageSpecs(harga);
        if (!packageSpecs) {
            return res.status(400).json({
                status: 'error',
                message: 'Paket tidak valid'
            });
        }

        const amount = getPackagePrice(harga);
        if (amount === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Harga paket tidak ditemukan'
            });
        }

        const orderId = generateOrderId();

        console.log(`🔄 Membuat QRIS untuk paket ${harga} - Order ID: ${orderId}`);

        const depositData = await atlantic.createQris({
            amount: amount,
            orderId: orderId
        });

        pendingDeposits.set(depositData.id, {
            depositId: depositData.id,
            orderId: orderId,
            packageCode: harga,
            packageSpecs: packageSpecs,
            amount: amount,
            depositData: depositData,
            createdAt: new Date(),
            status: 'pending'
        });

        console.log(`✅ QRIS berhasil dibuat - Deposit ID: ${depositData.id}`);

        res.json({
            status: 'success',
            qr_image: depositData.qr_image,
            qr_string: depositData.qr_string,
            kodeunik: depositData.id,
            order_id: orderId,
            amount: amount,
            expired_at: depositData.expired_at
        });

    } catch (error) {
        console.error('❌ Error creating QRIS:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Gagal membuat QRIS: ' + error.message
        });
    }
});

// Legacy endpoint for backward compatibility
app.get('/verify-pembayaran', async (req, res) => {
    try {
        const { kode } = req.query;

        if (!kode) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter kode diperlukan'
            });
        }

        console.log(`🔍 Verifying payment - Kode: ${kode}`);

        // Find deposit by ID
        const depositInfo = pendingDeposits.get(kode);
        if (!depositInfo) {
            return res.status(404).json({
                status: 'error',
                message: 'Deposit tidak ditemukan'
            });
        }

        const statusResult = await atlantic.checkDepositStatus({ depositId: kode });

        if (statusResult.status === 'PAID') {
            console.log(`✅ Payment verified for deposit ${kode}`);

            // Create Pterodactyl server
            try {
                const serverName = `server_${Date.now()}`;
                const email = `user_${Date.now()}@ichanstore.com`;
                const username = serverName.toLowerCase().replace(/[^a-z0-9]/g, '');
                const password = Math.random().toString(36).slice(-12) + 'A1!';

                const user = await ptero.createUser({
                    email: email,
                    username: username,
                    first_name: serverName,
                    last_name: 'Panel',
                    password: password,
                    root_admin: false
                });

                const server = await ptero.createServer({
                    name: serverName,
                    description: `Panel ${depositInfo.packageSpecs.label} - Auto Created`,
                    userId: user.id,
                    ram: depositInfo.packageSpecs.ram.toString(),
                    disk: depositInfo.packageSpecs.disk,
                    cpu: depositInfo.packageSpecs.cpu,
                    featureLimits: depositInfo.packageSpecs.unlimited ? {
                        databases: 0,
                        backups: 0,
                        allocations: 0
                    } : {
                        databases: 5,
                        backups: 5,
                        allocations: 1
                    },
                    isPrivate: false
                });

                pendingDeposits.delete(kode);

                res.json({
                    status: 'success',
                    message: 'Pembayaran berhasil! Server telah dibuat.',
                    data: {
                        id: server.id,
                        username: username,
                        password: password,
                        server_name: serverName
                    }
                });

            } catch (serverError) {
                console.error('❌ Error creating server:', serverError.message);
                res.status(500).json({
                    status: 'error',
                    message: 'Pembayaran berhasil tapi gagal membuat server: ' + serverError.message
                });
            }

        } else {
            res.json({
                status: statusResult.status.toLowerCase(),
                message: 'Pembayaran belum diterima'
            });
        }

    } catch (error) {
        console.error('❌ Error verifying payment:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Gagal verifikasi pembayaran: ' + error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        pending_deposits: pendingDeposits.size,
        service: 'IchanStore Atlantic Pedia API'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 IchanStore Backend with Atlantic Pedia API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💰 Create Deposit: http://localhost:${PORT}/create-deposit?package=1gb`);
    console.log(`🔍 Check Status: http://localhost:${PORT}/deposit-status/{deposit_id}`);
    console.log(`❌ Cancel Deposit: POST http://localhost:${PORT}/cancel-deposit`);
});

module.exports = app;