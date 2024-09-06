const crypto = require("crypto");
const querystring = require("querystring");
const axios = require("axios");
const FormData = require("form-data");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

/**
 * @param {string} plaintext - 要加密的參數
 * @param {string} key - 加密 Key
 * @param {Buffer} iv - 初始化向量 iv
 * @returns {Buffer} - 加密結果
 */
function encrypt(plaintext, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let cipherText = cipher.update(plaintext, "utf8", "base64");
  cipherText += cipher.final("base64");

  const tag = cipher.getAuthTag().toString("base64");
  return Buffer.from(`${cipherText}:::${tag}`).toString("hex").trim();
}

/**
 * @param {string} encryptStr - 加密過後的參數
 * @param {string} key - 加密 Key
 * @param {Buffer} iv - 初始化向量 iv
 * @returns {string} - hash 結果的字串，16進制且皆為大寫
 */
function sha256(encryptStr, key, iv) {
  const hash = crypto.createHash("sha256").update(`${key}${encryptStr}${iv}`);
  return hash.digest("hex").toUpperCase();
}

/**
 * @param {string} encryptStr - 要解密的參數
 * @param {string} key - 加密 Key
 * @param {Buffer} iv - 初始化向量 iv
 * @returns {string} - 解密結果
 */
function decrypt(encryptStr, key, iv) {
  const [encryptData, tag] = Buffer.from(encryptStr, "hex")
    .toString()
    .split(":::");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  let decipherText = decipher.update(encryptData, "base64", "utf8");
  decipherText += decipher.final("utf8");

  return decipherText;
}

const merKey = "iWPMCeg8mDyOorv1pHgYq94OMtUEsqvr";
const merIv = Buffer.from("Hz7nzyXxORLOPRyx");

app.get("/pay", (req, res) => {
  const merData = req.query;

  const plaintext = querystring.stringify(merData);

  const getEncrypt = encrypt(plaintext, merKey, merIv);
  // const getDecrypt = decrypt(getEncrypt, merKey, merIv)
  const getSha256 = sha256(getEncrypt, merKey, merIv);

  const htmlForm = `
    <form id="payForm" action="https://sandbox-api.payuni.com.tw/api/upp" method="post">
        <input type="hidden" name="MerID" value="S04110732">
        <input type="hidden" name="Version" value="1.0">
        <input type="hidden" name="EncryptInfo" value="${getEncrypt}">
        <input type="hidden" name="HashInfo" value="${getSha256}">
      </form>
  `;
  res.send(htmlForm);
});

/**
 * 查詢交易紀錄
 */
app.get("/query", (req, res) => {
  const queryData = req.query;
  const plaintext = querystring.stringify(queryData);
  const getEncrypt = encrypt(plaintext, merKey, merIv);
  const getSha256 = sha256(getEncrypt, merKey, merIv);

  const formData = new FormData();
  formData.append("MerID", "S04110732");
  formData.append("Version", "1.0");
  formData.append("EncryptInfo", getEncrypt);
  formData.append("HashInfo", getSha256);

  axios
    .post("https://sandbox-api.payuni.com.tw/api/trade/query", formData)
    .then((response) => {
      const getDecrypt = new URLSearchParams(
        decrypt(response.data.EncryptInfo, merKey, merIv)
      );
      const result = {};
      getDecrypt.forEach((value, key) => {
        const text = key.match(/[^[\]]+/g);
        result[text[text.length - 1]] = value;
      });
      res.send(result);
    });
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
