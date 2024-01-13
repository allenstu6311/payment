const express = require("express");
const bodyParser = require('body-parser');
const axios = require("axios");
const cors = require('cors');
const ecpay_payment = require('ecpay_aio_nodejs');
const router = express.Router();
const path = require('path');

const app = express();
// 使用body-parser中间件来解析POST请求的数据
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use('/', router);

const MERCHANTID = 2000132
const HASHKEY = "5294y06JbISpM5x9"
const HASHIV = "v77hoKGq4kWxNNIS"
const HOST = "http://127.0.0.1:5500/index.html"
const url = "`https://dccbf1901db8e5cabf4d2ebbe23031c1.serveo.net"

const options = {
    "OperationMode": "Test", //Test or Production
    "MercProfile": {
        "MerchantID": "2000132",
        "HashKey": "5294y06JbISpM5x9",
        "HashIV": "v77hoKGq4kWxNNIS"
    },
    "IgnorePayment": [
        //    "Credit",
        //    "WebATM",
        //    "ATM",
        //    "CVS",
        //    "BARCODE",
        //    "AndroidPay"
    ],
    "IsProjectContractor": false
}

router.post("/buy", (req, res) => {
    let param = req.body
    console.log(param)

    let ItemName = ''
    let TotalAmount = 0

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
        ClientBackURL: `${url}/clientReturn`,

    }

    const create = new ecpay_payment(options);
    // 注意：在此事直接提供 html + js 直接觸發的範例，直接從前端觸發付款行為
    const html = create.payment_client.aio_check_out_all(base_param);
    res.send(html)
})


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

// 用戶交易完成後的轉址
router.get('/clientReturn', (req, res) => {
    console.log('clientReturn:', req.body, req.query);
    res.sendFile(path.join(__dirname, 'result.html'));
    
});
 // res.render('return', { query: req.query });
app.listen(3000, () => {
    console.log('http://localhost:3000')
})


