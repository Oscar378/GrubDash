const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Middleware Validation Checks
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function propertyLengthIsNotZero(propertyName) {
  return function (req, res, next) {
    if (propertyName.length > 0) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function dishPriceNotLessThanOne() {
  return function (req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price === undefined) {
      return next();
    }
    if (price > 0) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  };
}

function isPriceValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (typeof price === "number") {
    return next();
  }
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
}

function routeIdMatchesDishId(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id === undefined || id === null || id.length < 1) return next();
  if (dishId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });

  return next();
}

// TODO: Implement the /dishes handlers needed to make the tests pass
// Route Handlers
function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    dishPriceNotLessThanOne(),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    propertyLengthIsNotZero("name"),
    propertyLengthIsNotZero("description"),
    propertyLengthIsNotZero("image_url"),
    create,
  ],
  update: [
    dishExists,
    routeIdMatchesDishId,
    dishPriceNotLessThanOne(),
    isPriceValid,
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("name"),
    bodyDataHas("image_url"),
    bodyDataHas("description"),
    propertyLengthIsNotZero("description"),
    update,
  ],
};
