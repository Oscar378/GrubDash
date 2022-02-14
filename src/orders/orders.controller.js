const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Middleware Validation Checks
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    const message =
      propertyName == "status"
        ? `Order must have a status of pending, preparing, out-for-delivery, delivered`
        : `Order must include a ${
            propertyName === "dishes" ? "dish" : propertyName
          }`;
    next({
      status: 400,
      message,
    });
  };
}

function propertyLengthIsNotZero(propertyName) {
  return function (req, res, next) {
    if (propertyName.length > 0) {
      return next();
    }
    const message =
      propertyName == "status"
        ? `Order must have a status of pending, preparing, out-for-delivery, delivered`
        : `Order must include a ${propertyName}`;

    next({ status: 400, message });
  };
}

function arrayIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes !== undefined) {
    if (Array.isArray(dishes) && dishes.length > 0) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  return next();
}

function dishQuantityValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish, index) => {
    const { quantity } = dish;
    if (
      !quantity ||
      typeof quantity !== "number" ||
      quantity <= 0 ||
      quantity === null
    ) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  return next();
}

function routeIdMatchesOrderId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id === undefined || id === null || id.length < 1) return next();
  if (orderId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Dish: ${id}, Route: ${orderId}`,
  });
  return next();
}

function deliveredStatusValid(req, res, next) {
  const { data: { status } = {} } = req.body;

  if (
    status === "pending" ||
    status === "delivered" ||
    status === "out-for-delivery"
  ) {
    return next();
  }
  next({
    status: 400,
    message: `status`,
  });
}

function pendingStatusValid(req, res, next) {
  if (res.locals.order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  });
}

// TODO: Implement the /orders handlers needed to make the tests pass
// Route Handlers
function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.status(200).json({ data: order });
}

function destroy(req, res) {
  // Cannot be named "delete", this is a reserved word in JS
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    arrayIsValid,
    bodyDataHas("dishes"),
    propertyLengthIsNotZero("deliverTo"),
    propertyLengthIsNotZero("mobileNumber"),
    dishQuantityValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("status"),
    deliveredStatusValid,
    arrayIsValid,
    bodyDataHas("dishes"),
    dishQuantityValid,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    propertyLengthIsNotZero("mobileNumber"),
    propertyLengthIsNotZero("deliverTo"),
    propertyLengthIsNotZero("status"),
    routeIdMatchesOrderId,
    update,
  ],
  delete: [orderExists, pendingStatusValid, destroy],
};
