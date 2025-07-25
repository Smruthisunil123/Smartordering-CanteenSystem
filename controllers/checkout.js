const express = require("express");
const https = require("https");
const qs = require("querystring");
const crypto = require("crypto");
const config = require("../Paytm/config")
const checksum_lib = require("../Paytm/checksum")
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });
const Order = require("../config/dbSchema").Order;
const dbSchema = require('../config/dbSchema')
const Item = dbSchema.Item;

module.exports = {  
  // It will be used to do payment, make order reciept with order id and redirect to paytm's url for payment
    payNow :  (req, res) => {

      console.log("Content got from checkout is  "+ req.body.StringData) // It shows error when only req.body why ??
    
    const jsonItemsgot = JSON.parse(req.body.StringData);

      console.log("json items : "+ jsonItemsgot.arr[0].id) 

    const allItemsGot = jsonItemsgot.arr; // arr contains required items for order

    let totalCostGot = 0; // totalCost of order
    for(let i=0; i<allItemsGot.length;i++){
      totalCostGot += allItemsGot[i].q * allItemsGot[i].p;
    }

      console.log("total cost is "+ totalCostGot)

      console.log("user is "+  req.user) // if not then handle or handle in route it self

    // All Required Items
    const date = "2022-11-10"; //currently it is the date for which we are doing payment to just confirm, or for preorder we need this 
    const allItems = allItemsGot; // map all items with original ones
    const totalAmount = totalCostGot; //default
    const userName = req.user.firstname;
    const userPhone = req.user.phone
    const userEmail = req.user._id
    const userId = req.user._id
    const orderId = date + crypto.randomBytes(6).toString('hex');
    const currTime = new Date();
    
    const orderDetails = {
            _id : orderId,
            userName: userName,
            userId: userId, // need it to hover for database 
            paytmUserName: "@smruhti",
            userEmail: userEmail,
            userPhone: userPhone,
            totalAmount : totalAmount,
            allItems: allItems,
            orderStatus: "pending",
            paymentStatus: "pending",
            timeWhenOrderPlaced: currTime
        }

        const order = new Order(orderDetails);

        order.save(); // stored in orders for admin, Now also store in users database

        // ALSO SAVE IT IN USER's DATABASE IF WANT

        console.log(orderDetails)

        var paymentDetails = {
          amount: orderDetails.totalAmount.toString(), // total amount is number
          customerId: orderDetails.paytmUserName,
          customerEmail: orderDetails.userEmail,
          customerPhone: orderDetails.userPhone,
        };
        if (
          !paymentDetails.amount ||
          !paymentDetails.customerId ||
          !paymentDetails.customerEmail ||
          !paymentDetails.customerPhone
        ) { // If one of them is not present
          res.status(400).send("Payment failed");
        } else { // send request to the paytm's server from our server
          var params = {}; // make an params object
          params["MID"] = config.PaytmConfig.mid;
          params["WEBSITE"] = config.PaytmConfig.website;
          params["CHANNEL_ID"] = "WEB";
          params["INDUSTRY_TYPE_ID"] = "Retail";
          params["ORDER_ID"] = orderDetails._id;  // we have made this ?? how can we use it. it is our custom order id
          params["CUST_ID"] = paymentDetails.customerId;
          params["TXN_AMOUNT"] = paymentDetails.amount; // we are passing this
          params["CALLBACK_URL"] = `${process.env.URL}/checkout/order/${orderDetails._id}`; // callback to call when payment done or success so need to add entries in database when such event occurs
          params["EMAIL"] = paymentDetails.customerEmail;
          params["MOBILE_NO"] = paymentDetails.customerPhone; 
      
          // in my case user cann't temper anything i will change everything
          checksum_lib.genchecksum(
            params,
            config.PaytmConfig.key,
            function (err, checksum) {
              var txn_url =
                "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
              // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
      
              var form_fields = "";
              for (var x in params) {
                form_fields +=
                  "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
              }
              form_fields +=
                "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
      
              res.writeHead(200, { "Content-Type": "text/html" });
              res.write(
                '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
                  txn_url +
                  '" name="f1">' +
                  form_fields +
                  '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
              );
              res.end();
            }
          );
        }
    },

  // Route for verifiying payment, it is like a webhook and called by paytm ig, but how paytm can call my localhost ??
paymentCallback : (req, res) => {

  var body = "";

  req.on("data", function (data) {
    body += data;
  });

  req.on("end", function () {
    var html = "";
    var post_data = qs.parse(body);

    // received params in callback
    console.log("Callback Response: ", post_data, "\n");

    // verify the checksum
    var checksumhash = post_data.CHECKSUMHASH;
    // delete post_data.CHECKSUMHASH;
    var result = checksum_lib.verifychecksum(
      post_data,
      config.PaytmConfig.key,
      checksumhash
    );
    console.log("Checksum Result => ", result, "\n");

    // Send Server-to-Server request to verify Order Status
    // in order id add some employee information and then see
    var params = { MID: config.PaytmConfig.mid, ORDERID: post_data.ORDERID };

    // TODO : here check the details informations and update the orderId with respective values in background and redirect another with different route
    
    console.log("status is " + post_data.STATUS)
    const orderDetails = {
      _id : post_data.ORDERID,
      orderStatus: post_data.STATUS == "TXN_FAILURE" ? "Failed" : "Ongoing", // should i just not accept order if payment is not done
      paymentStatus: post_data.STATUS,
      timeWhenOrderPlaced: new Date()
  }


  // Updating Order with current status
  Order.findByIdAndUpdate(
    orderDetails._id,
    { $set: { paymentStatus: orderDetails.paymentStatus, orderStatus: orderDetails.orderStatus} },
    { new: true, upsert: true },
    function (err, managerparent) {
      if (err) throw err;
      console.log(managerparent); // updated value here
    }
  );

  // save this info. in database if storing details in users info.

    checksum_lib.genchecksum(
      params,
      config.PaytmConfig.key,
      function (err, checksum) {
        params.CHECKSUMHASH = checksum;
        post_data = "JsonData=" + JSON.stringify(params);

        var options = {
          hostname: "securegw-stage.paytm.in", // for staging
          // hostname: 'securegw.paytm.in', // for production
          port: 443,
          path: "/merchant-status/getTxnStatus",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": post_data.length,
          },
        };

        // Set up the request
        var response = "";
        var post_req = https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", function () {
            console.log("S2S Response: ", response, "\n");

            var _result = JSON.parse(response);
            if (_result.STATUS == "TXN_SUCCESS") {
              // res.send({success: "payment sucess", "S2S response": _result});
              res.redirect(`/checkout/order/${orderDetails._id}`)
            } else {
              // res.send({orderDetails: orderDetails, "S2S Respornse": _result});
              res.redirect(`/checkout/order/${orderDetails._id}`)
            }
          });
        });

        // post the data
        post_req.write(post_data);
        post_req.end();
      }
    );
  });
},

getOrderDetails: (req, res)=>{
  const orderId = req.params.orderId
  console.log(orderId)
  Order.findById(orderId, (err, docs)=>{
    if(docs){
      console.log(docs)
      res.render("orderDetails",{orderDetails: docs })
    } else {
      res.send({message: `The given `+ orderId+ `orderId doesn't exists here..`})
    }
  })
  },

}