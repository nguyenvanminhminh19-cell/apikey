const express = require("express");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const KEY_FILE = "./keys.json";

app.use(express.json());

function loadKeys() {
    try {
        if (!fs.existsSync(KEY_FILE)) {
            fs.writeFileSync(
                KEY_FILE,
                JSON.stringify({ keys: {} }, null, 2)
            );
        }

        return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
    } catch (err) {
        console.error("Không thể đọc keys.json:", err.message);
        return { keys: {} };
    }
}

function saveKeys(data) {
    fs.writeFileSync(
        KEY_FILE,
        JSON.stringify(data, null, 2)
    );
}

function checkApiKey(req, res, next) {
    const key =
        req.headers["x-api-key"] ||
        req.query.key ||
        req.body?.key;

    if (!key) {
        return res.status(401).json({
            success: false,
            error: "Missing API key"
        });
    }

    const data = loadKeys();
    const info = data.keys[key];

    if (!info) {
        return res.status(403).json({
            success: false,
            error: "Invalid API key"
        });
    }

    if (!info.active) {
        return res.status(403).json({
            success: false,
            error: "API key disabled"
        });
    }

    if (
        info.expiresAt &&
        Date.now() > new Date(info.expiresAt).getTime()
    ) {
        return res.status(403).json({
            success: false,
            error: "API key expired"
        });
    }

    next();
}

app.get("/", (req, res) => {
    res.json({
        success: true,
        name: "VAN MINH API",
        version: "1.0.0",
        status: "online"
    });
});

app.get("/api/test", checkApiKey, (req, res) => {
    res.json({
        success: true,
        message: "API key hợp lệ",
        timestamp: new Date().toISOString()
    });
});

app.post("/api/key/create", (req, res) => {
    const { expiresAt } = req.body;

    const randomPart = crypto
        .randomBytes(12)
        .toString("hex")
        .toUpperCase();

    const key = `VMVIP-${randomPart}`;

    const data = loadKeys();

    data.keys[key] = {
        active: true,
        expiresAt: expiresAt || null
    };

    saveKeys(data);

    res.json({
        success: true,
        key,
        expiresAt: expiresAt || null
    });
});

app.get("/api/key/check", checkApiKey, (req, res) => {
    res.json({
        success: true,
        valid: true,
        message: "API key đang hoạt động"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log(" VAN MINH API SERVER");
    console.log(` PORT: ${PORT}`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(" STATUS: ONLINE");
    console.log("=================================");
});