const Ad = require('../models/ad.model');
const { sendMail } = require('../utils/mailer');
const { uploadToSupabase } = require('../services/supabase.service');
const User = require('../models/user.model');
const mongoose = require('mongoose');

async function uploadAdHandler(req, reply) {
  console.log('[uploadAdHandler] Handler triggered ');

  const parts = req.parts();
  let productName = '', description = '', price = 0, adType = '', tag = '', advertiserEmail = '';
  let ageGroup = { min: 0, max: 0 };
  let fileName = '', fileType = '', fileBuffer;

  for await (const part of parts) {
    if (part.file) {
      fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${part.filename}`;
      fileType = part.mimetype;

      const chunks = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
    } else {
      const val = part.value;
      switch (part.fieldname) {
        case 'productName': productName = val; break;
        case 'description': description = val; break;
        case 'price':
          price = Number(val);
          break; case 'adType': adType = val; break;
        case 'tags':
          tags = val.split(',').map(tag => tag.trim());
          break;
        case 'advertiserId': advertiserEmail = val; break;
        case 'ageMin': ageGroup.min = Number(val); break;
        case 'ageMax': ageGroup.max = Number(val); break;
      }
    }
  }

  const user = await User.findOne({ email: advertiserEmail });
  if (!user) {
    console.error('[uploadAdHandler] No user found for email:', advertiserEmail);
    return reply.badRequest('Invalid advertiser email');
  }

  if (!fileBuffer || !fileType) {
    return reply.badRequest('Image file is required');
  }

  let imageUrl;
  try {
    imageUrl = await uploadToSupabase(fileBuffer, fileName, fileType);
  } catch (err) {
    console.error('[uploadAdHandler] Supabase upload failed ❌', err);
    return reply.internalServerError('Failed to upload image');
  }

  try {
    const ad = await Ad.create({
      advertiserId: user._id,
      productName,
      imageUrl,
      description,
      price,
      adType,
      tags,
      targetAgeGroup: ageGroup,
    });
    return reply.send({ success: true, ad });
  } catch (err) {
    console.error('[uploadAdHandler] MongoDB save failed ❌', err);
    return reply.internalServerError('Failed to save ad');
  }
}

async function getUserProfile(req, reply) {
  try {
    const userId = req.user?.sub;
    if (!userId) return reply.unauthorized('User not authenticated');

    const user = await User.findById(userId).select('name email interests time credit age role monthlySpent totalSpent');

    if (!user) return reply.notFound('User not found');

    reply.send({
      name: user.name,
      email: user.email,
      interests: user.interests || [],
      time: user.time || [],
      credit: user.credit || 0,
      role: user.role || 'user',
      age: user.age || null,
      monthlySpent: user.monthlySpent || 0,
      totalSpent: user.totalSpent || 0,
    });
  } catch (err) {
    req.log.error(err, '[getUserProfile] Error');
    reply.internalServerError('Could not fetch profile');
  }
}

async function getAds(req, reply) {
  try {
    const { type } = req.params;
    const { maxPrice } = req.query;

    const filter = { adType: type };
    if (maxPrice) {
      filter.price = { $lte: Number(maxPrice) };
    }

    const ads = await Ad.find(filter).sort({ createdAt: -1 });
    reply.send(ads);
  } catch (error) {
    console.error("Error fetching ads:", error);
    reply.internalServerError("Could not fetch ads");
  }
}

async function AddToCart(req, reply) {
  try {
    const { adId } = req.params;
    const { quantity = 1 } = req.body;
    const userId = req.userData._id;

    const ad = await Ad.findById(adId);
    if (!ad) return reply.notFound('Ad not found.');

    const user = await User.findById(userId);
    if (!user) return reply.notFound('User not found.');

    const alreadyInCart = user.cart.some(item => item.ad.toString() === adId);
    if (alreadyInCart) return reply.badRequest('Ad already in cart.');

    user.cart.push({
      ad: ad._id,
      addedAt: new Date(),
      price: ad.price,
      quantity,
    });

    await user.save();

    reply.send({ success: true, message: 'Ad added to cart', cart: user.cart });
  } catch (err) {
    req.log.error({ err }, '[AddToCart] Failed');
    reply.internalServerError('Failed to add to cart');
  }
}


async function getCartHandler(req, reply) {
  try {
    const userId = req.userData._id;

    const user = await User.findById(userId)
      .populate({
        path: 'cart.ad',
        select: 'title description price imageUrl',
      })
      .select('cart');

    if (!user) {
      return reply.code(404).send({ message: 'User not found' });
    }

    reply.send(user.cart);
  } catch (error) {
    console.error(error);
    reply.code(500).send({ message: 'Server error' });
  }
}

async function removeFromCartHandler(req, reply) {
  try {
    const userId = req.userData._id;
    const { adId } = req.body;

    if (!adId) {
      return reply.code(400).send({ success: false, message: "adId is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { cart: { ad: adId } } },
      { new: true }
    ).populate({
      path: "cart.ad",
      select: "title description price imageUrl"
    });

    if (!user) {
      return reply.code(404).send({ success: false, message: "User not found" });
    }

    return reply.send({ success: true, message: "Removed from cart", cart: user.cart });
  } catch (error) {
    console.error("Remove from cart error:", error);
    reply.code(500).send({ success: false, message: "Server error" });
  }
}

async function getAdById(req, reply) {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, message: "Invalid ad ID" });
    }

    const ad = await Ad.findById(id);
    if (!ad) {
      return reply.status(404).send({ success: false, message: "Ad not found" });
    }
    reply.send({ success: true, ad });
  } catch (err) {
    console.error("[getAdById] ❌", err);
    reply.status(500).send({ success: false, message: "Server error" });
  }
};

async function getRelatedAds(req, reply) {
  try {
    const { tags = [], adType } = req.body;

    if (!tags && !adType) {
      return reply.badRequest('Tags or adType must be provided');
    }

    let relatedAds = [];

    if (tags.length > 0) {
      relatedAds = await Ad.find({
        tags: { $in: tags },
      })
        .limit(6)
        .lean();
    }

    if (relatedAds.length === 0 && adType) {
      relatedAds = await Ad.find({ adType }).limit(6).lean();
    }

    return reply.send({ success: true, relatedAds });
  } catch (err) {
    console.error('[getRelatedAds] Error:', err);
    return reply.internalServerError('Failed to fetch related ads');
  }
}


async function addAddress(req, reply) {
  try {
    const userId = req.userData._id;
    const { label, city, state, postalCode, mobileNo } = req.body;

    if (!city || !state || !postalCode || !mobileNo) {
      return reply.badRequest("All address fields are required");
    }

    const user = await User.findById(userId);
    if (!user) return reply.notFound("User not found");

    const newAddress = { label, city, state, postalCode, mobileNo };
    user.address.push(newAddress);
    await user.save();

    reply.send({ success: true, message: "Address added", addresses: user.address });
  } catch (err) {
    req.log.error(err);
    reply.internalServerError("Failed to add address");
  }
}

async function updateAd(req, reply) {
  console.log("update ads trigred......")
  try {
    const advertiserId = req.userData._id;
    const { adId } = req.params;
    const { productName, description, tags } = req.body;
    console.log("\nthe ad id is:-- ",adId,"\n");

    const ad = await Ad.findById(adId);
    if (!ad) return reply.notFound("Ad not found");

    if (ad.advertiserId.toString() !== advertiserId.toString()) {
      return reply.forbidden("Not allowed to update this ad");
    }

    if (productName !== undefined) ad.productName = productName;
    if (description !== undefined) ad.description = description;
    if (tags !== undefined) ad.tags = tags;

    await ad.save();

    reply.send({
      success: true,
      message: "Ad updated successfully",
      ad,
    });
  } catch (err) {
    req.log.error(err);
    reply.internalServerError("Failed to update ad");
  }
}



async function updateAddress(req, reply) {
  try {
    const userId = req.userData._id;
    const { addressId } = req.params;
    const { label, city, state, postalCode, mobileNo } = req.body;

    const user = await User.findById(userId);
    if (!user) return reply.notFound("User not found");

    const address = user.address.id(addressId);
    if (!address) return reply.notFound("Address not found");

    // Update fields if provided
    if (label !== undefined) address.label = label;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (mobileNo !== undefined) address.mobileNo = mobileNo;

    await user.save();

    reply.send({ success: true, message: "Address updated", addresses: user.address });
  } catch (err) {
    req.log.error(err);
    reply.internalServerError("Failed to update address");
  }
}

async function deleteAddress(req, reply) {
  try {
    const userId = req.userData._id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) return reply.notFound("User not found");

    const index = user.address.findIndex(addr => addr._id.toString() === addressId);
    if (index === -1) return reply.notFound("Address not found");

    user.address.splice(index, 1);
    await user.save();

    reply.send({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    req.log.error(err, "[deleteAddress] Failed");
    reply.internalServerError("Failed to delete address");
  }
}

async function deleteAds(req, reply) {
  try {
    const advertiserId = req.userData._id;
    const { adId } = req.params
    const ad = await Ad.findById(adId);
    if (!ad) return reply.notFound("ad not found");
    if (ad.advertiserId.toString() !== advertiserId.toString()) {
      return reply.forbidden("Not allowed to delete this ad");
    } await ad.deleteOne();

    reply.send({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (err) {
    req.log.error(err);
    reply.internalServerError("Failed to delete ad");
  }
}




async function getUserAddresses(req, reply) {
  try {
    const userId = req.userData._id;

    const user = await User.findById(userId).select('address');
    if (!user) return reply.notFound('User not found');

    reply.send({ success: true, addresses: user.address });
  } catch (err) {
    req.log.error(err);
    reply.internalServerError('Failed to fetch addresses');
  }
}


async function createOrder(req, reply) {
  try {
    const userId = req.userData.id;
    const { adId, total, quantity, address } = req.body;

    if (!adId || !total || !quantity || !address) {
      return reply.status(400).send({ error: "adId, total, quantity and address are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const ad = await Ad.findById(adId);
    if (!ad) {
      return reply.status(404).send({ error: "Ad not found" });
    }

    const newOrderID = Date.now();

    user.orders.push({
      orderID: newOrderID,
      ad: adId,
      total,
      quantity,
      deliveryAddress: {
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        mobileNo: address.mobileNo
      },
      orderDate: new Date(),
    });

    user.totalSpent += total;

    const now = new Date();
    if (
      !user.lastSpentReset ||
      user.lastSpentReset.getMonth() !== now.getMonth() ||
      user.lastSpentReset.getFullYear() !== now.getFullYear()
    ) {
      user.monthlySpent = total;
      user.lastSpentReset = now;
    } else {
      user.monthlySpent += total;
    }

    await user.save();

    await sendMail({
      to: user.email,
      subject: `Order Confirmation - #${newOrderID}`,
      html: `
        <h2>Order Confirmation</h2>
        <p>Hi ${user.name || "Customer"},</p>
        <p>Your order has been successfully placed!</p>

        <h3>Order Details:</h3>
        <ul>
          <li><b>Order ID:</b> ${newOrderID}</li>
          <li><b>Product:</b> ${ad.productName}</li>
          <li><b>Price:</b> ₹${total}</li>
          <li><b>Quantity:</b> ${quantity}</li>
          <li><b>Delivery Address:</b> ${address.city}, ${address.state}, ${address.postalCode}</li>
          <li><b>Contact No:</b> ${address.mobileNo}</li>
        </ul>

        <p><b>Product Image:</b></p>
        <img src="${ad.imageUrl}" alt="${ad.productName}" width="200" style="border-radius:8px;" />

        <p>We will notify you once your order is shipped.</p>
        <p>Thank you for shopping with us!</p>
      `
    });
    console.log('imageUrllglhlg: ', ad.imageUrl);

    return reply.code(201).send({
      success: true,
      message: "Order successfully created and confirmation email sent",
      orderNo: newOrderID
    });

  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
}

async function getAdvertiserAdsHandler(req, reply) {
  try {
    const advertiserId = req.userData._id;

    const ads = await Ad.find({ advertiserId })
      .populate('feedbacks.userId', 'name')
      .sort({ createdAt: -1 });

    reply.send({ ads });
  } catch (err) {
    req.log.error({ err }, '[getAdvertiserAdsHandler] Failed to get advertiser ads');
    reply.internalServerError('Failed to fetch ads');
  }
}




module.exports = { uploadAdHandler, getUserProfile, getAds, AddToCart, getCartHandler, removeFromCartHandler, getRelatedAds, getAdById, addAddress, updateAddress,updateAd, deleteAddress,deleteAds, getUserAddresses, createOrder, getAdvertiserAdsHandler }
