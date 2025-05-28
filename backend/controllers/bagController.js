// controllers/bagController.js

const db = require("../models/index");
const {
  omit,
  checkMissingField,
  checkUnique,
  errorResponseHandler,
  ValidationError,
  successResponseCreated,
  successResponse,
} = require("../Helpers");

const bagController = {};

// Create new bags
bagController.newCharcodes = async (req, res) => {
  try {
    const { amount } = req.body;
    checkMissingField([amount]);

    const bags = [];
    for (let i = 0; i < amount; i++) {
      const bag = new db.Bag();
      const newBag = await bag.save();
      bags.push(newBag.charcode);
    }

    if (!bags.length) throw new Error("Oops, something went wrong");

    return successResponseCreated(res, { bags });
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// Update bag by charcode
bagController.updateBagByCharcode = async (req, res) => {
  try {
    const { charcode } = req.params;
    const updates = req.body;

    const bag = await db.Bag.findOne({ charcode, is_deleted: false });
    if (!bag) throw new Error("Bag not found");

    Object.assign(bag, updates);
    await bag.save();

    return successResponse(res, { message: "Bag updated", charcode });
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// Get single bag by charcode
bagController.getBag = async (req, res) => {
  try {
    const bag = await db.Bag.findOne({ charcode: req.params.charcodeId, is_deleted: false })
      .populate('_order')
      .populate('locations.storage_pickup._order_to_storage');

    if (!bag) throw new ValidationError(404, "Bag not found");

    return successResponse(res, { bag });
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// Get multiple bags
bagController.getBags = async (req, res) => {
  try {
    const bags = await db.Bag.find({ is_deleted: false })
      .populate({ path: '_order', populate: ['_user', '_delivery', '_destination_site'] });

    const farmers = await db.User.find({ is_deleted: false });

    return successResponse(res, { bags, farmers });
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// Update bag status
bagController.updateBagsStatus = async (req, res) => {
  try {
    const { bagsToUpdate, newStatus, selectedOrder, location, signatureUrl, deliverToStorage } = req.body;
    checkMissingField([bagsToUpdate, newStatus]);

    for (const bagData of bagsToUpdate) {
      const bag = await db.Bag.findOne({ charcode: bagData.charcode, is_deleted: false });
      if (!bag) throw new ValidationError(404, "Bag not found");

      bag.status = newStatus;
      bag.locations[newStatus] = location;
      bag.locations[newStatus].time = new Date();

      if (signatureUrl) bag.signature = signatureUrl;

      await bag.save();
    }

    return successResponse(res);
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

module.exports = bagController;