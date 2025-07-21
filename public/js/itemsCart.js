const decrease = (itemNumber) => {
  var itemval = document.getElementById(itemNumber);
  if (itemval.value <= 0) {
    itemval.value = 0;
    alert("Negative quantity not allowed");
  } else {
    itemval.value = parseInt(itemval.value) - 1;
  }
};

const increase = (itemNumber) => {
  var itemval = document.getElementById(itemNumber);
  if (itemval.value >= 5) {
    itemval.value = 5;
    alert("max 5 allowed");
  } else {
    itemval.value = parseInt(itemval.value) + 1;
  }
};

let arr = [];

// To disable checkout button if no item is added
if (arr.length == 0) {
  document.getElementById('checkOut').disabled = true;
} else {
  document.getElementById('checkOut').disabled = false;
}

function addDish(element) {
  console.log("Adding item with ID:", element);
  if (!element) {
    alert("Invalid item ID. Please try again.");
    return;
  }

  document.getElementById('checkOut').disabled = false;

  let totalAmount = 0;

  let price = document.querySelector(`#price${element}`).innerHTML;
  let quantity = document.querySelector(`#q${element}`);
  quantity.defaultValue = 0;
  let title = document.getElementById(`name${element}`).innerHTML;
  let menu = document.getElementById(`menu${element}`).innerHTML;

  console.log("Price:", price, "Quantity:", quantity.value, "Title:", title, "Menu:", menu);

  if (quantity.value == 0) {
    alert("Add at least 1 item");
    return;
  }

  if (arr == null) {
    arr = [];
  }

  let found = 0;

  arr.forEach((ele) => {
    if (ele.id == element) {
      if ((Number(ele.q) + Number(quantity.value)) > 5) {
        alert("Maximum 5 items only.");
        ele.q = 5;
      } else {
        ele.q = Number(ele.q) + Number(quantity.value);
      }
      found = 1;
    }
  });

  if (!found) {
    arr.push({
      id: element,
      t: title,
      p: Number(price),
      q: Number(quantity.value),
      r: 0,
      m: menu
    });
  }

  console.log("Current cart array:", arr);

  document.getElementById("appendHere").innerHTML = "";
  let removeCount = 0;
  arr.forEach((ele) => {
    ele.r = removeCount;

    let billElem = document.createElement("div");
    billElem.innerHTML = `<h4>${ele.t}</h4>
    <div>
        <div>Price :  ${ele.p}</div>
        <div>Quantity : ${ele.q}</div>
        <button class="btn btn-primary" onclick="removeDish(${removeCount})">🗑️</button>
    </div>`;
    billElem.className = "billItems";
    document.querySelector("#appendHere").append(billElem);
    totalAmount = totalAmount + ele.q * ele.p;

    quantity.value = 0;
    removeCount++;
  });

  let productTotal = document.getElementById("product_total_amt");
  let grandTotal = document.getElementById("total_cart_amt");

  productTotal.innerHTML = ` ${totalAmount}`;
  grandTotal.innerHTML = ` ${totalAmount}`;
  document.getElementById("StringData").value = JSON.stringify({ arr });

  console.log("StringData value:", document.getElementById("StringData").value);
}

function removeDish(element) {
  console.log("Removing item with removeCount:", element);
  let totalAmount = 0;

  // Remove the item from the array
  arr = arr.filter((ele) => ele.r !== element);

  document.getElementById("StringData").value = JSON.stringify({ arr });
  console.log("Updated cart array:", arr);
  document.getElementById("appendHere").innerHTML = "";

  let removeCount = 0;
  arr.forEach((ele) => {
    ele.r = removeCount;

    let billElem = document.createElement("div");
    billElem.innerHTML = `<h4>${ele.t}</h4>
    <div>
        <div>Price :  ${ele.p}</div>
        <div>Quantity : ${ele.q}</div>
        <button class="btn btn-primary" onclick="removeDish(${removeCount})">🗑️</button>
    </div>`;
    billElem.className = "billItems";
    document.querySelector("#appendHere").append(billElem);
    totalAmount = totalAmount + ele.q * ele.p;

    removeCount++;
  });

  let productTotal = document.getElementById("product_total_amt");
  let grandTotal = document.getElementById("total_cart_amt");

  productTotal.innerHTML = ` ${totalAmount}`;
  grandTotal.innerHTML = ` ${totalAmount}`;

  if (arr.length == 0) {
    document.getElementById('checkOut').disabled = true;
  } else {
    document.getElementById('checkOut').disabled = false;
  }
}