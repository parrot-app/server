"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios")); // assuming you have axios installed
const app = (0, express_1.default)();
const port = 3000;
const apiBaseUrl = process.env.API_BASE; // from .env file
app.get('/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req;
    const cachePath = `/cache${url}.json`;
    const cacheDir = path_1.default.dirname(cachePath);
    // Check if cache directory exists
    if (!fs_1.default.existsSync(cacheDir)) {
        fs_1.default.mkdirSync(cacheDir, { recursive: true });
    }
    // Check if cache file exists
    if (fs_1.default.existsSync(cachePath)) {
        // Return cached response
        const cachedResponse = fs_1.default.readFileSync(cachePath, 'utf8');
        res.send(cachedResponse);
    }
    else {
        // Call external API and cache response
        const externalUrl = `${apiBaseUrl}${url}`;
        try {
            const response = yield axios_1.default.get(externalUrl);
            const responseBody = response.data;
            fs_1.default.writeFileSync(cachePath, JSON.stringify(responseBody));
            res.send(responseBody);
        }
        catch (error) {
            console.error(`Error fetching external API: ${error}`);
            res.status(500).send('Error fetching external API');
        }
    }
}));
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
