const express = require("express");
const bodyParser = require('body-parser');
const axios = require("axios");
const cors = require('cors');
const ecpay_payment = require('ecpay_aio_nodejs');
const router = express.Router();
const path = require('path');
require('dotenv').config();

const app = express();
// 使用body-parser中间件来解析POST请求的数据
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use('/', router);

const url = "https://d56b11bcaf3d165aa7be3327b4f9907f.serveo.net"
 // http://localhost:3000

//代理伺服器指令 ssh -R 80:localhost:3000 serveo.net

const testId = {
    MERCHANTID: "3002607",
    HASHKEY:'pwFHCqoQZGmho4w6',
    HASHIV:'EkRm7iFT261dpevs'
}
// const { MERCHANTID, HASHKEY, HASHIV } = process.env;
const { MERCHANTID, HASHKEY, HASHIV } = testId;
console.log('MERCHANTID',MERCHANTID)

const options = {
    OperationMode: 'Test', //Test or Production
    MercProfile: {
      MerchantID: MERCHANTID,
      HashKey: HASHKEY,
      HashIV: HASHIV,
    },
    IgnorePayment: [
      //    "Credit",
      //    "WebATM",
      //    "ATM",
      //    "CVS",
      //    "BARCODE",
      //    "AndroidPay"
    ],
    IsProjectContractor: false,
  };

router.post("/buy", (req, res) => {
    let param = req.body
    let ItemName = ''
    let TotalAmount = 1

    for (let i = 0; i < param.length; i++) {
        ItemName += param[i].ItemName + (i != param.length-1? "#":'')
        TotalAmount += param[i].amount
    }


    const MerchantTradeDate = new Date().toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC',
    });

    let TradeNo = 'test' + new Date().getTime();
    let base_param =
    {
        MerchantTradeNo: TradeNo, //請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
        MerchantTradeDate,
        TotalAmount: TotalAmount.toString(),
        TradeDesc: '測試交易描述1#測試交易描述2',
        ItemName: ItemName,
        ReturnURL:`${url}/return`,
        ClientBackURL:`${url}/clientReturn`,
    }

    const create = new ecpay_payment(options);
    const html = create.payment_client.aio_check_out_all(base_param);
    res.send(html)
})

//會在付款成功自動觸發
app.post('/return', async (req, res) => {
    console.log('return:', req.body);

    const { CheckMacValue } = req.body;
    const data = { ...req.body };
    delete data.CheckMacValue; // 此段不驗證

    const create = new ecpay_payment(options);
    const checkValue = create.payment_client.helper.gen_chk_mac_value(data);

    console.log(
        '確認交易正確性：',
        CheckMacValue === checkValue,
        CheckMacValue,
        checkValue,
    );

    // 交易成功後，需要回傳 1|OK 給綠界
    res.send('1|OK');
});

// 用戶交易完成後的轉址(點擊返回購買成功頁面)
app.get('/clientReturn', (req, res) => {
    res.sendFile(path.join(__dirname, 'result.html'));
    
});
 // res.render('return', { query: req.query });
app.listen(3000, () => {
    console.log('http://localhost:3000')
})


