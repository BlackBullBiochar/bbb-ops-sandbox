const db = require("../models/index");
const {
  omit,
  checkMissingField,
  errorResponseHandler,
  ValidationError,
  successResponseCreated,
  successResponse,
} = require("../Helpers");

const siteController = {};

// Create a new site
siteController.createSite = async (req, res) => {
  try {
    const { category, name, fullName, maxStock, address } = req.body;
    checkMissingField([category, name, fullName, maxStock, address]);

    const inventory = {
      weekly_production: [],
      est_weekly_production: [],
      bags_delivered: [],
      current_stock: [],
      forecasted_stock: [],
    };

    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 21);

    const end = new Date(start);
    end.setFullYear(start.getFullYear() + 10);

    let current = new Date(start);

    while (current <= end) {
      const weekData = { date: new Date(current), amount: 0 };

      Object.keys(inventory).forEach(key => inventory[key].push({ ...weekData }));
      current.setDate(current.getDate() + 7);
    }

    const site = new db.Site({
      category,
      name,
      full_name: fullName,
      inventory,
      max_stock: maxStock,
      address,
    });

    await site.save();

    return successResponseCreated(res, {
      site: omit(site.toObject(), ["is_deleted", "__v", "_id", "created_at"]),
    });
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// Retrieve sites info and inventory
siteController.getSites = async (req, res) => {
  try {
    const sites = await db.Site.find({ is_deleted: false });

    if (!sites.length) throw new ValidationError(404, "No sites found");

    return successResponse(res, { sites });
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

//retrieve bags by site name and date range
siteController.getBagsBySiteAndDate = async (req, res) => {
  try {
    const { siteName } = req.params;
    const { from, to } = req.query;

    if (!siteName || !from) {
      throw new ValidationError(400, "Site name and 'from' date are required");
    }

    const site = await db.Site.findOne({
      name: new RegExp(`^${siteName}$`, 'i'), // case-insensitive match
      is_deleted: false
    });

    if (!site) {
      throw new ValidationError(404, "Site not found");
    }

    const match = {
      _site: site._id,
      is_deleted: false,
      bagging_date: {}
    };

    const fromDate = new Date(from);
    const toDate = to ? new Date(to) : fromDate;

    match.bagging_date.$gte = fromDate;
    match.bagging_date.$lte = toDate;

    const bags = await db.Bags.find(match);

    return successResponse(res, { bags });
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};


module.exports = siteController;