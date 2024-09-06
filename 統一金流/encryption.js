// 測試前端模擬Nodejs加密

const merData = {
  MerID: "AAA",
  MerTradeNo: "BBB",
  Prod: "商品說明",
  TradeAmt: 1000,
  Timestamp: Math.floor(Date.now() / 100),
};

async function encrypt(plaintext, key, iv) {
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(plaintext);
  const keyBuffer = encoder.encode(key);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const cipherText = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encodedText
  );

  // 將加密的結果轉換為 base64
  const base64Cipher = btoa(String.fromCharCode(...new Uint8Array(cipherText)));
  return base64Cipher;
}

async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // 將哈希結果轉換為 16 進制字串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

encrypt(plaintext, merKey, merIv).then((encrypted) => {
  sha256(encrypted).then((hash) => {
    console.log("Encrypted:", encrypted);
    console.log("SHA256 Hash:", hash);

    // 將加密後的數據傳送到伺服器
    const formData = new FormData();
    formData.append("MerID", "S04110732");
    formData.append("Version", "1.0");
    formData.append(
      "EncryptInfo",
      "79676671644133504c656c7758793131724d5163737745614d3162504756574464356d6866445634534359774f616a57756b552f2b6c546e77746e5172454b597345386635336f6177637975776f3945596474646c694e7561424f43414f39444d666353343846374373796e6c386a476579484b645064524865422b52306a347a2f6c6161534d3d3a3a3a6655704a4b41514a2f756f486f6336475946315838673d3d"
    );
    formData.append(
      "HashInfo",
      "31BB10AFD36446A30A177F17431B79D50E58F58CDCA960120532C80FBCB8298A"
    );

    // 發送 POST 請求
    fetch("https://sandbox-api.payuni.com.tw/api/upp", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.text())
      .then((data) => {
        console.log(data);
        document.body.insertAdjacentHTML("beforeend", data);
        app.innerHTML = data;
        // 自动提交表单
        document.forms["autoForm"].submit();
      });
  });
});
